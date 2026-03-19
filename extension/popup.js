// 状态管理
const state = {
  fromLang: 'en',
  toLang: 'zh',
  inputText: '',
  outputText: '',
  backTranslation: '',
  isTranslating: false,
  currentEngine: 'google' // 默认谷歌
};

// DOM 元素
const els = {
  // Global Language Selector
  sourceLangSelect: document.getElementById('sourceLangSelect'),
  targetLangSelect: document.getElementById('targetLangSelect'),
  swapLangBtn: document.getElementById('swapLangBtn'),
  
  // Text Mode Elements
  inputText: document.getElementById('inputText'),
  placeholderLayer: document.getElementById('placeholderLayer'),
  pasteBtn: document.getElementById('pasteBtnReal'),
  clearInput: document.getElementById('clearInput'),
  translateBtn: document.getElementById('translateBtn'),
  outputText: document.getElementById('outputText'),
  backTranslation: document.getElementById('backTranslation'),
  outputActions: document.getElementById('outputActions'),
  speakBtn: document.getElementById('speakBtn'),
  copyBtn: document.getElementById('copyBtn'),
  clearOutput: document.getElementById('clearOutput'),
  
  // Other Elements
  quickTransResult: document.getElementById('quickTransResult')
};

// 初始化状态
chrome.storage.sync.get(['engine'], (result) => {
  if (result.engine) {
    state.currentEngine = result.engine;
  }
});

// 开关：网页对照翻译（滑动开关）
const dualToggle = document.getElementById('dualToggle');
chrome.storage.sync.get(['dualEnabled','dualMode'], (r) => {
  if (dualToggle) dualToggle.checked = !!r.dualEnabled;
  const mode = r.dualMode || 'bilingual';
  setSegMode(mode);
});
dualToggle && dualToggle.addEventListener('change', (e) => {
  chrome.storage.sync.set({ dualEnabled: !!e.target.checked });
});

// 模式切换（分段控件）
function setSegMode(mode){
  const bi = document.getElementById('segBilingual');
  const tr = document.getElementById('segTranslated');
  if (!bi || !tr) return;
  bi.classList.toggle('active', mode === 'bilingual');
  tr.classList.toggle('active', mode === 'translated');
}
document.getElementById('segBilingual')?.addEventListener('click', ()=>{
  setSegMode('bilingual');
  chrome.storage.sync.set({ dualMode: 'bilingual' });
});
document.getElementById('segTranslated')?.addEventListener('click', ()=>{
  setSegMode('translated');
  chrome.storage.sync.set({ dualMode: 'translated' });
});

// 开关：网页对照翻译（滑动开关）
function init() {
  loadSettings();
  setupTabs();
  attachEvents();
  setupLangDropdowns();
  syncLangLabels();
  setupMessageListener();
  // 侧边栏打开时，通知 background 尝试注入脚本到当前页面
  chrome.runtime.sendMessage({ type: 'jt_panel_opened' }).catch(() => {});
}

// 标签页切换逻辑
function setupTabs() {
  const tabs = document.querySelectorAll('.mode-tab');
  const contents = document.querySelectorAll('.tab-content');
  
  // 从存储加载上次激活的标签
  chrome.storage.local.get(['activeTab'], (res) => {
    if (res.activeTab) {
      switchTab(res.activeTab);
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      switchTab(target);
      chrome.storage.local.set({ activeTab: target });
    });
  });

  function switchTab(target) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    contents.forEach(c => c.classList.toggle('active', c.id === `tab-${target}`));
  }
}

// 监听内容脚本的消息（快捷翻译）
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'jt_selection_change') {
      handleQuickTranslation(msg.text);
    }
  });
}

let quickTransDebounce = null;
async function handleQuickTranslation(text) {
  const container = els.quickTransResult;
  if (!text || !text.trim()) {
    container.innerHTML = '<div class="quick-trans-placeholder">在网页上选中文字，此处即显示翻译</div>';
    return;
  }
  
  // 防抖，避免频繁请求
  if (quickTransDebounce) clearTimeout(quickTransDebounce);
  
  container.innerHTML = '<div style="color:#9ca3af;padding:12px;">正在翻译...</div>';
  
  quickTransDebounce = setTimeout(async () => {
    try {
      // 使用当前Web模式的语言设置（虽然同步了，但读取当前DOM值最稳妥）
      const from = els.webFromLang ? els.webFromLang.value : state.fromLang;
      const to = els.webToLang ? els.webToLang.value : state.toLang;
      
      const result = await fetchTranslate(text, from, to);
      container.innerText = result;
    } catch (err) {
      container.innerHTML = '<div style="color:#ef4444;padding:12px;">翻译失败</div>';
    }
  }, 500); // 500ms 延迟
}

// 加载设置
async function loadSettings() {
  const settings = await chrome.storage.local.get(['fromLang', 'toLang']);
  if (settings.fromLang) {
    els.sourceLangSelect.value = settings.fromLang;
    state.fromLang = settings.fromLang;
  }
  if (settings.toLang) {
    els.targetLangSelect.value = settings.toLang;
    state.toLang = settings.toLang;
  }
  syncLangLabels();
}

// 绑定事件
function attachEvents() {
  // --- 全局语言切换 ---
  els.sourceLangSelect.addEventListener('change', (e) => {
    handleLangChange('from', e.target.value);
  });
  
  els.targetLangSelect.addEventListener('change', (e) => {
    handleLangChange('to', e.target.value);
  });

  // 统一处理语言变更
  function handleLangChange(type, value) {
    if (type === 'from') {
      state.fromLang = value;
      els.sourceLangSelect.value = value;
      
      // 互斥逻辑
      if (state.fromLang === state.toLang) {
        state.toLang = state.fromLang === 'zh' ? 'en' : 'zh';
        els.targetLangSelect.value = state.toLang;
      }
    } else {
      state.toLang = value;
      els.targetLangSelect.value = value;
      
      // 互斥逻辑
      if (state.toLang === state.fromLang) {
        state.fromLang = state.toLang === 'zh' ? 'en' : 'zh';
        els.sourceLangSelect.value = state.fromLang;
      }
    }
    syncLangLabels();
    chrome.storage.local.set({ fromLang: state.fromLang, toLang: state.toLang });
    
    // 如果当前在文本翻译 Tab 且有输入，触发重译
    const activeTab = document.querySelector('.mode-tab.active')?.dataset.tab;
    if (activeTab === 'text' && els.inputText.value.trim()) {
      performTranslation();
    }
  }

  // 互换语言
  els.swapLangBtn.addEventListener('click', swapLangs);

  function swapLangs() {
    const newFrom = state.toLang;
    const newTo = state.fromLang;
    // 直接更新状态并保存，避免两次触发 change
    state.fromLang = newFrom;
    state.toLang = newTo;
    els.sourceLangSelect.value = newFrom;
    els.targetLangSelect.value = newTo;
    syncLangLabels();
    chrome.storage.local.set({ fromLang: state.fromLang, toLang: state.toLang });
    
    // 如果当前在文本翻译 Tab 且有输入，触发重译
    const activeTab = document.querySelector('.mode-tab.active')?.dataset.tab;
    if (activeTab === 'text' && els.inputText.value.trim()) {
      performTranslation();
    }
  }

  // 输入监听
  els.inputText.addEventListener('input', (e) => {
    const val = e.target.value;
    els.clearInput.classList.toggle('hidden', !val);
    // 控制占位层显示隐藏
    els.placeholderLayer.style.display = val ? 'none' : 'flex';
    // 动态控制翻译按钮状态
    els.translateBtn.disabled = !val.trim();

    // 自动调整高度逻辑
    els.inputText.style.height = '48px'; // 先重置为初始高度
    const scrollHeight = els.inputText.scrollHeight;
    if (scrollHeight > 48) {
      els.inputText.style.height = Math.min(scrollHeight, 240) + 'px';
    }
    // 处理滚动条显示
    els.inputText.style.overflowY = scrollHeight > 240 ? 'auto' : 'hidden';
  });

  // 粘贴按钮逻辑
  const pasteBtnReal = document.getElementById('pasteBtnReal');
  if (pasteBtnReal) {
    pasteBtnReal.addEventListener('click', async () => {
      // 向父页面 (content script) 请求粘贴，因为 iframe 可能没有剪贴板权限
      window.parent.postMessage({ type: 'jt_paste_request' }, '*');
    });
  }

  // 监听来自父页面的粘贴响应
  window.addEventListener('message', (event) => {
    if (event.data.type === 'jt_paste_response' && event.data.text) {
      const inputText = document.getElementById('inputText');
      if (inputText) {
        inputText.value = event.data.text;
        // 触发 input 事件以更新状态
        inputText.dispatchEvent(new Event('input'));
        // 自动聚焦
        inputText.focus();
      }
    }
  });

  // 清空输入
  els.clearInput.addEventListener('click', () => {
    els.inputText.value = '';
    els.clearInput.classList.add('hidden');
    els.placeholderLayer.style.display = 'flex';
    els.translateBtn.disabled = true;
    
    // 重置高度
    els.inputText.style.height = '48px';
    els.inputText.style.overflowY = 'hidden';

    // 同时清空翻译结果区域
    els.outputText.innerText = '翻译结果将在这里展示';
    els.outputText.style.color = 'var(--text-gray)';
    els.backTranslation.classList.add('hidden');
    els.outputActions.classList.add('hidden');
    
    els.inputText.focus();
  });

  // 翻译触发
  els.translateBtn.addEventListener('click', performTranslation);

  // 回车翻译
  els.inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performTranslation();
    }
  });

  // 结果操作：复制
  els.copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(els.outputText.innerText);
    const originalSvg = els.copyBtn.innerHTML;
    els.copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';
    setTimeout(() => els.copyBtn.innerHTML = originalSvg, 2000);
  });

  // 结果操作：朗读
  const speakIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
  const stopIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

  els.speakBtn.addEventListener('click', () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      els.speakBtn.innerHTML = speakIcon;
      return;
    }

    const text = els.outputText.innerText;
    if (!text || text === '翻译结果将在这里展示') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = els.targetLangSelect.value === 'zh' ? 'zh-CN' : 'en-US';
    
    utterance.onstart = () => {
      els.speakBtn.innerHTML = stopIcon;
    };

    utterance.onend = () => {
      els.speakBtn.innerHTML = speakIcon;
    };

    utterance.onerror = () => {
      els.speakBtn.innerHTML = speakIcon;
    };

    window.speechSynthesis.speak(utterance);
  });
}

function setInputAndTranslate(text) {
  els.inputText.value = text;
  els.clearInput.classList.remove('hidden');
  els.placeholderLayer.style.display = 'none';
  els.translateBtn.disabled = false;
  els.inputText.style.height = '48px';
  const scrollHeight = els.inputText.scrollHeight;
  els.inputText.style.height = Math.min(Math.max(scrollHeight, 48), 240) + 'px';
  els.inputText.style.overflowY = scrollHeight > 240 ? 'auto' : 'hidden';
  els.inputText.focus();
  performTranslation();
}

function detectLang(text) {
  const zhCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const enCount = (text.match(/[A-Za-z]/g) || []).length;
  if (zhCount === 0 && enCount === 0) return null;
  return zhCount >= enCount ? 'zh' : 'en';
}

function maybeAdjustLangByInput(text) {
  const detected = detectLang(text);
  if (!detected) return;
  if (detected === 'zh') {
    if (els.sourceLangSelect.value !== 'zh' || els.targetLangSelect.value === 'zh') {
      els.sourceLangSelect.value = 'zh';
      els.targetLangSelect.value = 'en';
      state.fromLang = 'zh';
      state.toLang = 'en';
      chrome.storage.local.set({ fromLang: state.fromLang, toLang: state.toLang });
      syncLangLabels();
    }
  } else if (detected === 'en') {
    if (els.sourceLangSelect.value !== 'en' || els.targetLangSelect.value === 'en') {
      els.sourceLangSelect.value = 'en';
      els.targetLangSelect.value = 'zh';
      state.fromLang = 'en';
      state.toLang = 'zh';
      chrome.storage.local.set({ fromLang: state.fromLang, toLang: state.toLang });
      syncLangLabels();
    }
  }
}

// 去掉与背景/面板的主动消息联动监听

async function getHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['history'], (r) => {
      resolve(Array.isArray(r.history) ? r.history : []);
    });
  });
}

async function addHistory(item) {
  const list = await getHistory();
  const withTime = item && item.t ? item : { ...item, t: Date.now() };
  list.unshift(withTime);
  const trimmed = list.slice(0, 20);
  return new Promise((resolve) => {
    chrome.storage.local.set({ history: trimmed }, () => resolve());
  });
}

function formatHistoryTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function renderHistoryItem(item) {
  const wrap = document.createElement('div');
  wrap.className = 'history-card';
  const timeText = formatHistoryTime(item.t);
  if (timeText) {
    const time = document.createElement('div');
    time.className = 'history-timestamp';
    time.innerText = timeText;
    wrap.appendChild(time);
  }
  const src = document.createElement('div');
  src.className = 'history-src';
  src.innerText = item.src;
  const divider = document.createElement('div');
  divider.className = 'history-divider';
  const out = document.createElement('div');
  out.className = 'history-out';
  out.innerText = item.out;
  wrap.appendChild(src);
  wrap.appendChild(divider);
  wrap.appendChild(out);
  return wrap;
}

async function renderHistory() {
  const list = await getHistory();
  const container = document.getElementById('historyList');
  if (!container) return;
  container.innerHTML = '';
  list.forEach((i) => container.appendChild(renderHistoryItem(i)));
}

document.addEventListener('DOMContentLoaded', () => {
  const clearHistory = document.getElementById('clearHistory');
  if (clearHistory) {
    clearHistory.addEventListener('click', () => {
      chrome.storage.local.set({ history: [] }, () => renderHistory());
    });
  }
  const historyHeader = document.getElementById('historyLeft');
  const historyContainer = document.getElementById('historyContainer');
  const toggleIcon = document.getElementById('historyToggleIcon');
  let collapsed = true;
  if (historyHeader && historyContainer && toggleIcon) {
    historyHeader.addEventListener('click', () => {
      collapsed = !collapsed;
      historyContainer.style.display = collapsed ? 'none' : 'block';
      toggleIcon.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  }
  const clearBtn = document.getElementById('clearHistory');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  renderHistory();
});
// 执行翻译核心逻辑
async function performTranslation() {
  const currentText = els.inputText.value.trim();
  if (!currentText || state.isTranslating) return;

  maybeAdjustLangByInput(currentText);

  state.isTranslating = true;
  els.translateBtn.disabled = true;
  els.translateBtn.classList.add('loading');
  els.outputText.innerText = '正在翻译...';
  els.outputText.style.color = 'var(--text-dark)';
  els.backTranslation.classList.add('hidden');
  els.outputActions.classList.add('hidden');

  try {
    // 1. 主翻译
    const mainResult = await fetchTranslate(currentText, els.sourceLangSelect.value, els.targetLangSelect.value);
    
    // 检查：如果在请求期间输入框被清空了，则不再渲染结果
    if (!els.inputText.value.trim()) return;

    els.outputText.innerText = mainResult;
    
    // 2. 显示操作栏
    els.outputActions.classList.remove('hidden');

    // 3. 执行回译 (Back Translation) - 用来核对意思是否正确
    const backFrom = els.targetLangSelect.value;
    const backTo = (backFrom === 'zh' || backFrom === 'zh-CN') ? 'en' : 'zh';
    
    const backResult = await fetchTranslate(mainResult, backFrom, backTo);
    
    // 再次检查输入框状态
    if (!els.inputText.value.trim()) return;

    els.backTranslation.innerText = backResult;
    els.backTranslation.classList.remove('hidden');

    await addHistory({
      t: Date.now(),
      from: els.sourceLangSelect.value,
      to: els.targetLangSelect.value,
      src: currentText,
      out: mainResult
    });
    renderHistory();
  } catch (err) {
    // 只有在输入框仍有内容时才显示错误
    if (els.inputText.value.trim()) {
      els.outputText.innerText = '翻译失败，请切换翻译引擎或检查网络';
      els.outputText.style.color = '#F53F3F';
      els.backTranslation.classList.add('hidden');
      els.outputActions.classList.add('hidden');
    }
  } finally {
    state.isTranslating = false;
    els.translateBtn.disabled = !els.inputText.value.trim();
    els.translateBtn.classList.remove('loading');
  }
}

// 统一翻译接口
async function fetchTranslate(text, from, to) {
  try {
    const engineSelect = document.getElementById('engineSelect');
    const engine = engineSelect ? engineSelect.value : state.currentEngine;

    const res = await chrome.runtime.sendMessage({
      type: 'jt_translate_text',
      engine: engine, // 'google' or 'ai'
      from,
      to,
      text
    });
    
    if (res && res.text) {
      return res.text;
    }
    if (res && res.error) {
      throw new Error(res.error);
    }
    throw new Error('未返回翻译结果');
  } catch (err) {
    console.error('Translation Error:', err);
    throw err;
  }
}

// 启动
init();

// ===== 自定义门户式下拉（视觉样式） =====
function syncLangLabels() {
  const map = {
    zh: '中文（简体）',
    en: '英语',
    ja: '日语',
    ko: '韩语',
    fr: '法语',
    de: '德语',
    es: '西班牙语',
    ru: '俄语',
    ar: '阿拉伯语',
    pt: '葡萄牙语',
    it: '意大利语',
    nl: '荷兰语',
    th: '泰语',
    vi: '越南语',
    id: '印尼语'
  };
  const fromLabel = document.getElementById('sourceLangLabel');
  const toLabel = document.getElementById('targetLangLabel');
  if (fromLabel) fromLabel.textContent = map[els.sourceLangSelect.value] || '中文（简体）';
  if (toLabel) toLabel.textContent = map[els.targetLangSelect.value] || '中文（简体）';
}

function setupLangDropdowns() {
  const sourceLangBox = document.getElementById('sourceLangBox');
  const targetLangBox = document.getElementById('targetLangBox');
  sourceLangBox && sourceLangBox.addEventListener('click', (e) => {
    e.stopPropagation();
    openPortalDropdown('source', sourceLangBox);
  });
  targetLangBox && targetLangBox.addEventListener('click', (e) => {
    e.stopPropagation();
    openPortalDropdown('target', targetLangBox);
  });
}

function openPortalDropdown(which, anchorEl) {
  closePortalDropdown();
  const rect = anchorEl.getBoundingClientRect();
  const mask = document.createElement('div');
  mask.className = 'jt-dd-mask';
  const panel = document.createElement('div');
  panel.className = 'jt-dd';
  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.bottom + 8}px`;
  panel.style.width = `${rect.width}px`;
  const options = [
    { value: 'zh', label: '中文（简体）' },
    { value: 'en', label: '英语' },
    { value: 'ja', label: '日语' },
    { value: 'ko', label: '韩语' },
    { value: 'fr', label: '法语' },
    { value: 'de', label: '德语' },
    { value: 'es', label: '西班牙语' },
    { value: 'ru', label: '俄语' },
    { value: 'ar', label: '阿拉伯语' },
    { value: 'pt', label: '葡萄牙语' },
    { value: 'it', label: '意大利语' },
    { value: 'nl', label: '荷兰语' },
    { value: 'th', label: '泰语' },
    { value: 'vi', label: '越南语' },
    { value: 'id', label: '印尼语' }
  ];
  
  // Determine current value and select element based on 'which'
  let currentVal, selectEl;
  if (which === 'source') {
    currentVal = els.sourceLangSelect.value;
    selectEl = els.sourceLangSelect;
  } else if (which === 'target') {
    currentVal = els.targetLangSelect.value;
    selectEl = els.targetLangSelect;
  }

  options.forEach(opt => {
    const item = document.createElement('div');
    item.className = 'jt-dd-item' + (opt.value === currentVal ? ' active' : '');
    item.textContent = opt.label;
    item.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (selectEl && selectEl.value !== opt.value) {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      closePortalDropdown();
    });
    panel.appendChild(item);
  });
  document.body.appendChild(mask);
  document.body.appendChild(panel);
  requestAnimationFrame(()=> panel.classList.add('show'));
  setTimeout(() => {
    const closer = (ev) => {
      if (!panel.contains(ev.target)) {
        closePortalDropdown();
        document.removeEventListener('click', closer, true);
      }
    };
    document.addEventListener('click', closer, true);
  }, 0);
  window.__jt_dd_mask = mask;
  window.__jt_dd_panel = panel;
}

function closePortalDropdown() {
  if (window.__jt_dd_panel) {
    window.__jt_dd_panel.remove();
    window.__jt_dd_panel = null;
  }
  if (window.__jt_dd_mask) {
    window.__jt_dd_mask.remove();
    window.__jt_dd_mask = null;
  }
}

// 引擎选择下拉框事件监听
function initEngineSelect() {
  // 此功能已移至 content.js 中的自定义下拉框逻辑实现
  // 仅保留状态同步，以便 popup 内部逻辑能获取最新引擎
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.engine) {
      state.currentEngine = changes.engine.newValue;
      // 如果输入框有内容，切换引擎后重新翻译
      if (els.inputText && els.inputText.value.trim()) {
        performTranslation();
      }
    }
  });
}

// 在初始化时调用新功能
window.addEventListener('DOMContentLoaded', () => {
  init();
  initEngineSelect();
});
