(() => {
  const BLOCK_SELECTOR = 'p,li,blockquote,h1,h2,h3,h4,h5,h6,td,figcaption';
  const INSERT_CLASS = 'jt-inline-translation';
  const ATTR_ID = 'data-jt-id';
  const seen = new WeakSet();
  let enabled = false;
  let mode = 'bilingual'; // 'bilingual' | 'translated'
  let observersInstalled = false;
  let running = false;
  let pageIsEnglish = true;

  const style = `
.${INSERT_CLASS}{margin-top:4px;display:block}
.${INSERT_CLASS}.loading{opacity:.9}
.${INSERT_CLASS}.loading .jt-spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(3,149,255,.25);border-top-color:#0395FF;border-radius:50%;animation:jtspin .8s linear infinite;transform:translateY(2px)}
@keyframes jtspin{to{transform:rotate(360deg)}}
`;
  function injectStyle() {
    if (document.getElementById('jt-inline-style')) return;
    const s = document.createElement('style');
    s.id = 'jt-inline-style';
    s.textContent = style;
    document.documentElement.appendChild(s);
  }

  function isSkippable(el) {
    if (!el) return true;
    if (el.closest('script,style,noscript,svg,canvas,math,textarea,input,iframe,pre,code,kbd,samp,[contenteditable]')) return true;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return true;
    return false;
  }

  function* collectBlocks(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const t = n.nodeValue?.trim() || '';
        if (t.length < 8) return NodeFilter.REJECT;
        if (pageIsEnglish) {
          if (!/[A-Za-z]/.test(t)) return NodeFilter.REJECT;
        } else {
          if (!/[\u4e00-\u9fa5]/.test(t)) return NodeFilter.REJECT;
        }
        const p = n.parentElement;
        if (!p || isSkippable(p)) return NodeFilter.REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const map = new Map();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const block = node.parentElement.closest(BLOCK_SELECTOR);
      if (!block || isSkippable(block)) continue;
      if (block.getAttribute('data-jt-has-translation') === '1') continue;
      // 如果紧邻的下一个元素已经是译文，也跳过
      const next = block.nextElementSibling;
      if (next && next.classList && next.classList.contains(INSERT_CLASS)) continue;
      const raw = (block.innerText || '').trim();
      const text = raw.replace(/\s+/g, ' ');
      if (text && text.length >= 8) map.set(block, text);
    }
    for (const [el, text] of map) yield { el, text };
  }

  function copyTextStyles(fromEl, toEl) {
    const cs = getComputedStyle(fromEl);
    const props = ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','color','wordBreak','whiteSpace'];
    props.forEach(p => { try { toEl.style[p] = cs[p]; } catch(_){} });
  }

  async function translateBatch(items) {
    const { engine = 'google' } = await chrome.storage.sync.get(['engine']);
    const from = pageIsEnglish ? 'en' : 'zh';
    const to = pageIsEnglish ? 'zh' : 'en';
    try {
      const res = await chrome.runtime.sendMessage({ type: 'jt_translate_batch', engine, from, to, items });
      if (res && typeof res === 'object') return res;
    } catch (e) {
      // ignore; will return empty map
    }
    // 兜底：返回空映射（不插入）
    return Object.fromEntries(items.map(i => [i.id, '']));
  }

  function createPlaceholder(el) {
    const div = document.createElement('div');
    div.className = INSERT_CLASS + ' loading';
    div.setAttribute('lang', pageIsEnglish ? 'zh-CN' : 'en');
    div.textContent = '';
    const spin = document.createElement('span');
    spin.className = 'jt-spinner';
    div.appendChild(spin);
    copyTextStyles(el, div);
    el.insertAdjacentElement('afterend', div);
    el.setAttribute('data-jt-has-translation', '1');
    if (mode === 'translated') {
      if (!el.getAttribute('data-jt-prev-display')) {
        el.setAttribute('data-jt-prev-display', el.style.display || '');
      }
      el.style.display = 'none';
    }
    return div;
  }

  function applyResult(placeholder, text, engine) {
    if (!placeholder) return;
    placeholder.classList.remove('loading');
    placeholder.setAttribute('data-engine', engine || '');
    placeholder.innerHTML = '';
    placeholder.textContent = text || '';
  }

  const BATCH_SIZE = 24;
  let debounceTimer = null;
  let cachedEngine = 'google';

  // ... (style definitions) ...

  function debounce(func, wait) {
    return function(...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // ... (helper functions) ...
  
  function removeAllInserted() {
    document.querySelectorAll(`.${INSERT_CLASS}`).forEach(n=>n.remove());
    document.querySelectorAll(BLOCK_SELECTOR).forEach(el=>{
      if (el.getAttribute && el.getAttribute('data-jt-has-translation') === '1') {
        el.removeAttribute('data-jt-has-translation');
        const prev = el.getAttribute('data-jt-prev-display');
        if (prev !== null) {
          el.style.display = prev;
          el.removeAttribute('data-jt-prev-display');
        }
      }
    });
  }

  async function processViewport() {
    if (!enabled || running) return;
    running = true;
    try {
      injectStyle();
      const batch = [];
      const placeholders = new Map();
      // collectBlocks now only scans what's needed, but ideally we limit scope.
      // For now, we rely on the generator yielding items.
      for (const {el, text} of collectBlocks()) {
        const id = crypto.randomUUID();
        el.setAttribute(ATTR_ID, id);
        const ph = createPlaceholder(el);
        placeholders.set(id, ph);
        batch.push({ id, text });
        if (batch.length >= BATCH_SIZE) break;
      }
      if (!batch.length) return;
      
      const result = await translateBatch(batch);
      for (const b of batch) {
        const ph = placeholders.get(b.id);
        applyResult(ph, result[b.id], cachedEngine);
      }
    } finally {
      running = false;
      // If we filled a batch, there might be more to translate.
      // Schedule another run shortly to continue processing the page.
      if (document.querySelectorAll(`${BLOCK_SELECTOR}:not([data-jt-has-translation])`).length > 0) {
         setTimeout(processViewport, 100);
      }
    }
  }

  // ... (other functions) ...

  function setupObservers() {
    if (observersInstalled) return;
    const processDebounced = debounce(processViewport, 200);
    
    const obs = new MutationObserver((mutations) => {
      // Simple optimization: check if relevant nodes were added
      let shouldProcess = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          shouldProcess = true; 
          break;
        }
      }
      if (shouldProcess) processDebounced();
    });
    
    obs.observe(document.body, { childList:true, subtree:true, characterData:false });
    window.addEventListener('scroll', processDebounced, { passive:true });
    observersInstalled = true;
  }

  // ... (rest of the file) ...

  async function init() {
    const { dualEnabled=false, dualMode='bilingual', engine='google' } =
      await chrome.storage.sync.get(['dualEnabled','dualMode', 'engine']);
    mode = dualMode || 'bilingual';
    cachedEngine = engine;
    pageIsEnglish = pageSeemsEnglish();
    enabled = !!dualEnabled;
    if (enabled) {
      injectStyle();
      processViewport();
      setupObservers();
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes.engine) {
        cachedEngine = changes.engine.newValue;
      }
      if (changes.dualEnabled) {
        enabled = !!changes.dualEnabled.newValue;
        if (!enabled) {
          removeAllInserted();
        } else {
          injectStyle();
          setupObservers();
          processViewport();
        }
      }
      // ... (rest of logic) ...
    });
  }

  function pageSeemsEnglish() {
    const lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (lang.startsWith('en')) return true;
    const sample = (document.body.innerText || '').slice(0, 2000);
    const letters = (sample.match(/[A-Za-z]/g) || []).length;
    const cjk = (sample.match(/[\u4e00-\u9fa5]/g) || []).length;
    return letters > cjk * 1.5;
  }

  function applyModeToExisting() {
    const list = document.querySelectorAll(`.${INSERT_CLASS}`);
    list.forEach(node => {
      const original = node.previousElementSibling;
      if (!original) return;
      if (mode === 'translated') {
        if (!original.getAttribute('data-jt-prev-display')) {
          original.setAttribute('data-jt-prev-display', original.style.display || '');
        }
        original.style.display = 'none';
      } else {
        const prev = original.getAttribute('data-jt-prev-display');
        original.style.display = prev ?? '';
        original.removeAttribute('data-jt-prev-display');
      }
    });
  }

  // 监听选区变化，发送给侧边栏（快捷翻译）
  document.addEventListener('mouseup', debounce(() => {
    const text = window.getSelection().toString().trim();
    if (text) {
      chrome.runtime.sendMessage({ type: 'jt_selection_change', text }).catch(() => {});
    }
  }, 300));

  // ===================================
  // 悬浮窗功能
  // ===================================
  
  let floatingPanel = null;
  let isPanelDragging = false;
  let panelDragOffset = { x: 0, y: 0 };
  
  // 创建悬浮窗
  function createFloatingPanel() {
    if (floatingPanel) return;
    
    // 创建悬浮窗容器
    floatingPanel = document.createElement('div');
    floatingPanel.id = 'jt-floating-panel';
    floatingPanel.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      top: 100px;
      right: 100px;
      width: 320px;
      min-width: 280px;
      max-width: 80vw;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;
    
    // 加载保存的位置
    chrome.storage.local.get(['panelX', 'panelY', 'widthState'], (res) => {
      if (res.panelX && res.panelY) {
        floatingPanel.style.left = res.panelX + 'px';
        floatingPanel.style.top = res.panelY + 'px';
        floatingPanel.style.right = 'auto';
      }
      
      // 应用宽度状态
      if (res.widthState) {
        applyWidthState(res.widthState);
      }
    });
    
    // 创建 header（拖拽区域）
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      cursor: grab;
      user-select: none;
      height: 44px;
    `;
    
    // 左侧：Logo 和拖拽手柄
    const leftSection = document.createElement('div');
    leftSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // 拖拽手柄
    const dragHandle = document.createElement('div');
    dragHandle.style.cssText = `
      width: 20px;
      height: 20px;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      user-select: none;
    `;
    dragHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`;
    
    // Logo 和品牌名称
    const brand = document.createElement('div');
    brand.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #1d1d1f;
    `;
    brand.innerHTML = `<img src="${chrome.runtime.getURL('icons/icon.png')}" style="width:18px;height:18px;" alt="logo"><span>即时翻译</span>`;
    
    leftSection.appendChild(dragHandle);
    leftSection.appendChild(brand);
    
    // 右侧：控制按钮
    const rightSection = document.createElement('div');
    rightSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    
    // 引擎选择下拉框
    const engineSelect = document.createElement('select');
    engineSelect.style.cssText = `
      padding: 4px 8px;
      font-size: 12px;
      color: #6b7280;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      outline: none;
      height: 28px;
    `;
    engineSelect.innerHTML = `
      <option value="google">谷歌翻译</option>
      <option value="ai">AI 引擎</option>
    `;
    
    // 加载当前引擎
    chrome.storage.sync.get(['engine'], (res) => {
      if (res.engine) engineSelect.value = res.engine;
    });
    
    engineSelect.addEventListener('change', (e) => {
      chrome.storage.sync.set({ engine: e.target.value });
    });
    
    // 宽度调整按钮
    const widthBtn = document.createElement('button');
    widthBtn.title = '调整宽度';
    widthBtn.style.cssText = `
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      border-radius: 6px;
    `;
    widthBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 14h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/><line x1="12" y1="3" x2="12" y2="21"/></svg>';
    
    let currentWidthIdx = 0;
    const widthOptions = ['default', 'half', 'third'];
    
    widthBtn.addEventListener('click', () => {
      currentWidthIdx = (currentWidthIdx + 1) % widthOptions.length;
      const newState = widthOptions[currentWidthIdx];
      applyWidthState(newState);
      chrome.storage.local.set({ widthState: newState });
    });
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.title = '关闭';
    closeBtn.style.cssText = `
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      border-radius: 6px;
    `;
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', () => {
      floatingPanel?.remove();
      floatingPanel = null;
      chrome.storage.local.set({ floatingPanelOpen: false });
    });
    
    rightSection.appendChild(engineSelect);
    rightSection.appendChild(widthBtn);
    rightSection.appendChild(closeBtn);
    
    header.appendChild(leftSection);
    header.appendChild(rightSection);
    
    // 创建内容区域（使用 iframe 加载 floating-window.html）
    const contentFrame = document.createElement('iframe');
    const floatingWindowUrl = chrome.runtime.getURL('floating-window.html');
    console.log('Floating window URL:', floatingWindowUrl);
    contentFrame.src = floatingWindowUrl;
    contentFrame.style.cssText = `
      flex: 1;
      border: none;
      width: 100%;
      height: 480px;
      min-height: 320px;
      max-height: 80vh;
    `;
    
    // 监听 iframe 加载错误
    contentFrame.addEventListener('error', (e) => {
      console.error('Iframe loading error:', e);
    });
    
    contentFrame.addEventListener('load', () => {
      console.log('Iframe loaded successfully');
    });
    
    floatingPanel.appendChild(header);
    floatingPanel.appendChild(contentFrame);
    document.body.appendChild(floatingPanel);
    
    // 应用宽度状态函数
    function applyWidthState(widthState) {
      if (!floatingPanel) return;
      
      const screenWidth = window.innerWidth;
      let newWidth;
      
      if (widthState === 'half') {
        newWidth = Math.min(screenWidth * 0.5, 600);
      } else if (widthState === 'third') {
        newWidth = Math.min(screenWidth * 0.333, 400);
      } else {
        newWidth = 320; // 默认宽度
      }
      
      floatingPanel.style.width = newWidth + 'px';
    }
    
    // 拖拽功能
    header.addEventListener('mousedown', (e) => {
      if (e.target === engineSelect || e.target === widthBtn || e.target === closeBtn || 
          e.target.closest('select') || e.target.closest('button')) {
        return;
      }
      
      isPanelDragging = true;
      const rect = floatingPanel.getBoundingClientRect();
      panelDragOffset.x = e.clientX - rect.left;
      panelDragOffset.y = e.clientY - rect.top;
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isPanelDragging || !floatingPanel) return;
      
      const newX = e.clientX - panelDragOffset.x;
      const newY = e.clientY - panelDragOffset.y;
      
      // 边界检查
      const rect = floatingPanel.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      floatingPanel.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      floatingPanel.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      floatingPanel.style.right = 'auto';
      floatingPanel.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (isPanelDragging && floatingPanel) {
        const rect = floatingPanel.getBoundingClientRect();
        chrome.storage.local.set({
          panelX: rect.left,
          panelY: rect.top,
          isDragging: false
        });
      }
      isPanelDragging = false;
      if (header) header.style.cursor = 'grab';
    });
    
    // 监听宽度变化消息
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'jt_width_changed' && floatingPanel) {
        applyWidthState(msg.widthState);
      }
      sendResponse({});
    });
  }
  
  // 监听打开悬浮窗的消息
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('Content script received message:', msg);
    if (msg.type === 'jt_open_floating_panel') {
      console.log('Creating floating panel...');
      createFloatingPanel();
      console.log('Floating panel created');
      sendResponse({ success: true });
    }
    return true;
  });
  
  // 页面加载时检查是否应该打开悬浮窗
  chrome.storage.local.get(['floatingPanelOpen'], (res) => {
    if (res.floatingPanelOpen) {
      // 延迟创建，确保页面已加载
      setTimeout(createFloatingPanel, 500);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
