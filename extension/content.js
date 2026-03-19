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

  // 监听来自 background 的打开消息
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'jt_toggle_floating_window') {
      toggleFloatingWindow();
    }
  });

  // 辅助函数：调整页面内容宽度（挤压效果）
  function adjustPageContent(width) {
    document.body.style.transition = 'width 0.1s linear';
    document.body.style.width = `calc(100% - ${width})`;
    document.body.style.marginRight = width;
  }

  function resetPageContent() {
    document.body.style.width = '';
    document.body.style.marginRight = '';
    document.body.style.transition = '';
  }

  // 创建/切换悬浮窗
    let floatingContainer = null;
    function toggleFloatingWindow() {
      // 检查页面上是否已经存在悬浮窗（防止多开）
      // 检查 Shadow DOM 宿主
      const existingHost = document.getElementById('jt-floating-host');
      // 检查旧的 ID（兼容性清理）
      const existingContainer = document.getElementById('jt-floating-container');
      
      if (existingHost) {
        if (existingHost.style.display === 'none') {
          existingHost.style.display = 'flex';
          // 重新触发一次宽度调整，确保页面被挤压
          adjustPageContent(existingHost.style.width || '400px');
        } else {
          existingHost.style.display = 'none';
          resetPageContent();
        }
        return;
      }
      
      // 如果存在旧的容器，先移除（清理旧代码产生的残留）
      if (existingContainer) {
        existingContainer.remove();
      }
  
      // 使用 Shadow DOM 封装
    const shadowHost = document.createElement('div');
    shadowHost.id = 'jt-floating-host';
    Object.assign(shadowHost.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: '360px', // 改回 360px
      height: '100vh',
      maxHeight: '100vh',
      zIndex: '2147483647',
      // borderRadius: '12px', // 不需要圆角了
      // boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // 去掉投影
      borderLeft: '1px solid #e5e7eb', // 加个左边框区分页面
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    });

    const shadow = shadowHost.attachShadow({ mode: 'open' });

    // 注入全局样式重置，防止页面样式污染
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial; /* 重置所有继承样式 */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      * {
        box-sizing: border-box;
      }
      iframe {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid #e5e7eb;
        background: #fff;
        flex-shrink: 0;
        cursor: default;
        user-select: none;
      }
      .header:active {
        cursor: default;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        flex: 1; /* 让左侧占据剩余空间 */
        min-width: 0; /* 防止挤压 */
      }
      .header-right {
        display: flex;
        gap: 8px;
        flex-shrink: 0; /* 保持右侧按钮不收缩 */
      }
      button {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        border-radius: 4px;
      }
      button:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
    `;
    shadow.appendChild(style);

    // 创建 Header
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-left">
        <!-- 移除拖拽图标 -->
        <span style="display:flex;align-items:center;">
          <img src="${chrome.runtime.getURL('icons/logo_extension.png')}" style="height:20px;width:auto;" alt="">
        </span>
      </div>
      <div class="header-right">
        <!-- 引擎选择下拉框 (复用语言选择样式) -->
        <div class="engine-dropdown" style="position:relative; margin-right: 8px;">
          <div id="engine-trigger" style="
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            color: #374151;
            background: #f3f4f6; /* 复用语言选择框背景色 */
            transition: background 0.2s;
          ">
            <span id="current-engine-label" style="font-weight:400;">Google</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#9ca3af;"><path d="M6 9L12 15L18 9"/></svg>
          </div>
          
          <!-- 下拉菜单 -->
          <div id="engine-menu" style="
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 4px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(16,24,40,.12); /* 修复阴影 */
            min-width: 140px;
            z-index: 50;
            padding: 8px; /* 内边距 */
            overflow: hidden;
          ">
            <!-- 移除 "翻译引擎" 标题 -->
            <div class="engine-option" data-value="google" style="padding: 10px 12px; cursor: pointer; font-size: 14px; color: #6b7280; display: flex; align-items: center; justify-content: space-between; border-radius: 8px; line-height: 1; transition: background 0.1s;">
              <span>谷歌翻译</span>
              <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0395FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="engine-option" data-value="ai" style="padding: 10px 12px; cursor: pointer; font-size: 14px; color: #6b7280; display: flex; align-items: center; justify-content: space-between; border-radius: 8px; line-height: 1; transition: background 0.1s;">
              <span>AI智能翻译</span>
              <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0395FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        </div>
        
        <!-- 宽度调整按钮 -->
        <button id="width-btn" title="切换宽度" style="
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          background: transparent;
          border: none;
          min-width: 48px;
          font-weight: 500;
        ">
          <!-- 初始内容由 JS 动态设置 -->
        </button>
        <button id="close-btn" title="关闭">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
    shadow.appendChild(header);

    // 创建 Iframe
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('popup.html');
    shadow.appendChild(iframe);

    // 创建拖拽调整宽度的把手 (Resizer)
    const resizer = document.createElement('div');
    resizer.id = 'jt-resizer';
    resizer.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: col-resize;
      background: transparent;
      z-index: 10;
    `;
    // 鼠标悬停时显示把手，或者一直透明，只要能抓到就行
    resizer.onmouseenter = () => resizer.style.background = 'rgba(0,0,0,0.05)';
    resizer.onmouseleave = () => resizer.style.background = 'transparent';
    shadow.appendChild(resizer);

    // 状态管理：宽度模式
    let widthMode = 'default'; // default(360px) -> half(50%) -> third(30%)

    // 辅助函数：调整页面内容宽度（挤压效果）
    function adjustPageContent(width) {
      document.body.style.transition = 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'; // 更慢更自然
      document.body.style.width = `calc(100% - ${width})`;
      document.body.style.marginRight = width;
    }

    function resetPageContent() {
      document.body.style.width = '';
      document.body.style.marginRight = '';
      document.body.style.transition = 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }

    // 更新宽度按钮提示文字
    function updateWidthBtnTitle(mode) {
      const btn = header.querySelector('#width-btn');
      let text = '默认';
      
      if (mode === 'half') text = '50%';
      if (mode === 'third') text = '30%';
      if (mode === 'default') text = '默认';
      
      btn.textContent = text;
      
      // 样式调整：鼠标悬停时显示背景
      btn.onmouseenter = () => btn.style.background = '#f3f4f6';
      btn.onmouseleave = () => btn.style.background = 'transparent';
    }


    // 绑定事件
    // 引擎切换 (自定义下拉菜单逻辑)
    const engineTrigger = header.querySelector('#engine-trigger');
    const engineMenu = header.querySelector('#engine-menu');
    const currentLabel = header.querySelector('#current-engine-label');
    const engineOptions = header.querySelectorAll('.engine-option');
    let isMenuOpen = false;

    // 初始化引擎状态
    chrome.storage.sync.get(['engine'], (res) => {
      const current = res.engine || 'google';
      updateEngineUI(current);
    });

    function updateEngineUI(value) {
      // 更新 Trigger 文本
      const labelMap = { 'google': '谷歌翻译', 'ai': 'AI智能翻译' };
      currentLabel.textContent = labelMap[value] || '谷歌翻译';
      
      // 更新选项选中状态
      engineOptions.forEach(opt => {
        const check = opt.querySelector('.check-icon');
        // 隐藏对勾图标
        if (check) check.style.display = 'none';
        
        if (opt.dataset.value === value) {
          // 选中项样式
          opt.style.background = '#edf6ff';
          opt.style.color = '#0395FF';
        } else {
          // 未选中项样式
          opt.style.background = 'transparent';
          opt.style.color = '#374151';
        }
        
        // 绑定悬浮效果 (JS实现更灵活)
        opt.onmouseenter = () => {
          if (opt.dataset.value !== value) {
            opt.style.background = '#F5F6F8';
          }
        };
        opt.onmouseleave = () => {
          if (opt.dataset.value !== value) {
            opt.style.background = 'transparent';
          }
        };
      });
    }

    // 切换菜单显示
    engineTrigger.onclick = (e) => {
      e.stopPropagation();
      isMenuOpen = !isMenuOpen;
      engineMenu.style.display = isMenuOpen ? 'block' : 'none';
      // 点击展开时不需要变背景色，保持 f3f4f6
      // engineTrigger.style.background = isMenuOpen ? '#f3f4f6' : 'transparent';
    };

    // 点击选项
    engineOptions.forEach(opt => {
      opt.onclick = (e) => {
        e.stopPropagation();
        const value = opt.dataset.value;
        chrome.storage.sync.set({ engine: value });
        updateEngineUI(value);
        isMenuOpen = false;
        engineMenu.style.display = 'none';
        // engineTrigger.style.background = 'transparent';
      };
    });

    // 点击外部关闭菜单
    document.addEventListener('click', () => {
      if (isMenuOpen) {
        isMenuOpen = false;
        engineMenu.style.display = 'none';
        // engineTrigger.style.background = 'transparent';
      }
    });

    // 监听来自 popup 的消息（如粘贴请求）
    window.addEventListener('message', async (event) => {
      // 验证来源安全
      // 注意：由于是扩展内部 iframe，origin 可能是 chrome-extension://...
      if (event.data.type === 'jt_paste_request') {
        try {
          // 读取剪贴板文本
          const text = await navigator.clipboard.readText();
          // 发回给 iframe
          iframe.contentWindow.postMessage({
            type: 'jt_paste_response',
            text: text
          }, '*');
        } catch (err) {
          console.error('Failed to read clipboard:', err);
          // 尝试使用 execCommand 降级方案
          try {
            const textArea = document.createElement("textarea");
            document.body.appendChild(textArea);
            textArea.focus();
            document.execCommand('paste');
            const text = textArea.value;
            document.body.removeChild(textArea);
            if (text) {
              iframe.contentWindow.postMessage({
                type: 'jt_paste_response',
                text: text
              }, '*');
            }
          } catch (e) {
             console.error('Fallback paste failed:', e);
          }
        }
      }
    });

    // 关闭
    header.querySelector('#close-btn').onclick = (e) => {
      e.stopPropagation();
      shadowHost.style.display = 'none';
      resetPageContent(); 
    };

    // 宽度切换按钮（保留作为快捷方式）
    header.querySelector('#width-btn').onclick = (e) => {
      e.stopPropagation();
      const currentWidth = shadowHost.offsetWidth;
      let newWidth;
      
      if (widthMode === 'default') {
        widthMode = 'half';
        newWidth = '50%';
      } else if (widthMode === 'half') {
        widthMode = 'third';
        newWidth = '30%';
      } else {
        widthMode = 'default';
        newWidth = '360px';
      }
      
      shadowHost.style.width = newWidth;
      adjustPageContent(newWidth);
      updateWidthBtnTitle(widthMode);
    };

    // 拖拽调整宽度逻辑
    resizer.onmousedown = (e) => {
      e.preventDefault();
      document.body.style.transition = 'none'; // 拖拽时禁用过渡动画，防止卡顿
      shadowHost.style.transition = 'none';
      iframe.style.pointerEvents = 'none'; // 关键修复：禁用iframe事件，防止拖拽卡顿或失效
      
      const startX = e.clientX;
      const startWidth = shadowHost.offsetWidth;
      
      const onMouseMove = (ev) => {
        // 计算新宽度：因为是右侧面板，向左拖动（ev.clientX 变小）宽度增加
        const deltaX = startX - ev.clientX;
        let newWidth = startWidth + deltaX;
        
        // 限制最小最大宽度
        if (newWidth < 300) newWidth = 300;
        if (newWidth > window.innerWidth - 100) newWidth = window.innerWidth - 100;
        
        const widthStr = newWidth + 'px';
        shadowHost.style.width = widthStr;
        document.body.style.width = `calc(100% - ${widthStr})`;
        document.body.style.marginRight = widthStr;
      };
      
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        iframe.style.pointerEvents = ''; // 恢复iframe事件
        // 恢复过渡动画（可选）
        // document.body.style.transition = 'width 0.3s ease';
      };
      
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
    
    // 初始化时也执行一次挤压
    adjustPageContent('360px');
    
    // 初始化宽度按钮标题
    updateWidthBtnTitle('default');

    document.body.appendChild(shadowHost);
    floatingContainer = shadowHost; // 更新引用
  }
})();
