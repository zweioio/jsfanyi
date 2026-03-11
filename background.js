// 移除侧边栏配置，使用 popup 模式
// chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Edge Token Cache
let edgeToken = '';
let edgeTokenExpiry = 0;

// Translation Cache (LRU-like simple implementation)
const CACHE_SIZE = 500;
const translationCache = new Map();

function getCacheKey(text, from, to, engine) {
  return `${engine}:${from}:${to}:${text}`;
}

function getCachedTranslation(text, from, to, engine) {
  const key = getCacheKey(text, from, to, engine);
  if (translationCache.has(key)) {
    // Refresh key to mark as recently used
    const val = translationCache.get(key);
    translationCache.delete(key);
    translationCache.set(key, val);
    return val;
  }
  return null;
}

function setCachedTranslation(text, from, to, engine, result) {
  const key = getCacheKey(text, from, to, engine);
  if (translationCache.has(key)) {
    translationCache.delete(key);
  } else if (translationCache.size >= CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, result);
}

async function getEdgeToken() {
  if (edgeToken && Date.now() < edgeTokenExpiry) return edgeToken;
  try {
    const res = await fetch('https://edge.microsoft.com/translate/auth');
    if (res.ok) {
      const text = await res.text();
      edgeToken = text.trim();
      edgeTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 mins cache
      return edgeToken;
    }
  } catch (e) {
    console.error('Edge Auth Error:', e);
  }
  return null;
}

// Unified Translation Service
async function translateService(items, from, to, engine) {
  const out = {};
  const missingItems = [];

  // 1. Check Cache
  for (const item of items) {
    const cached = getCachedTranslation(item.text, from, to, engine);
    if (cached) {
      out[item.id] = cached;
    } else {
      missingItems.push(item);
    }
  }

  if (missingItems.length === 0) return out;

  // 2. Try AI (Edge) if selected
  if (engine === 'ai') {
    const edgeOut = await fetchEdgeBatch(missingItems, from, to);
    if (edgeOut) {
      // Merge results and cache them
      for (const item of missingItems) {
        if (edgeOut[item.id]) {
          out[item.id] = edgeOut[item.id];
          setCachedTranslation(item.text, from, to, engine, edgeOut[item.id]);
        }
      }
      return out; // Return whatever we got, even if partial (Edge rarely fails partially)
    }
    // If Edge fails completely, fall through to Google
  }

  // 3. Google Fallback (or primary if engine is google)
  // Google Translate API doesn't support batching in this free endpoint way easily without multiple requests,
  // so we process concurrently.
  const sl = from === 'zh' ? 'zh-CN' : from;
  const tl = to === 'zh' ? 'zh-CN' : to;
  const limit = 4;
  let i = 0;
  
  async function worker() {
    while (i < missingItems.length) {
      const it = missingItems[i++];
      try {
        // Double check cache before request (rare race condition but good practice)
        // const cached = getCachedTranslation(it.text, from, to, 'google');
        
        const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(it.text)}`;
        const gResp = await fetch(gUrl);
        const gData = await gResp.json();
        const resText = (gData && gData[0]) ? gData[0].map(d => d[0]).join('') : '';
        
        if (resText) {
          out[it.id] = resText;
          // Cache Google results too
          setCachedTranslation(it.text, from, to, engine, resText);
        } else {
          out[it.id] = '';
        }
      } catch (e) {
        out[it.id] = '';
      }
    }
  }
  
  await Promise.all(Array.from({length: Math.min(limit, missingItems.length)}, () => worker()));
  
  return out;
}

// Edge Batch Translate
async function fetchEdgeBatch(items, from, to) {
  const token = await getEdgeToken();
  if (!token) return null;

  const fromLang = (from === 'zh' || from === 'zh-CN') ? 'zh-Hans' : from;
  const toLang = (to === 'zh' || to === 'zh-CN') ? 'zh-Hans' : to;

  // Edge supports max 1000 items or 50k chars per request.
  const body = items.map(it => ({ Text: it.text }));
  
  try {
    const url = `https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${fromLang}&to=${toLang}&includeSentenceLength=true`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      const out = {};
      data.forEach((item, index) => {
        if (item && item.translations && item.translations[0]) {
          out[items[index].id] = item.translations[0].text;
        }
      });
      return out;
    }
  } catch (e) {
    console.error('Edge Translate Error:', e);
  }
  return null;
}

// 监听扩展图标点击或快捷键，直接在网页上创建悬浮窗
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked, tab:', tab);
  // 注入 content script（如果尚未注入）
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }, (results) => {
    console.log('Script injected results:', results);
    // 然后发送消息创建悬浮窗
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { type: 'jt_open_floating_panel' }).then((response) => {
        console.log('Message sent successfully, response:', response);
      }).catch((error) => {
        console.error('Error sending message:', error);
      });
    }, 100);
  });
});

// 消息监听
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'jt_translate_batch') {
    (async () => {
      const { engine = 'google', from = 'en', to = 'zh', items = [] } = msg;
      const out = await translateService(items, from, to, engine);
      sendResponse(out);
    })();
    return true; // keep channel open
  }
  
  if (msg && msg.type === 'jt_translate_text') {
    (async () => {
      const { engine = 'google', from = 'en', to = 'zh', text = '' } = msg;
      // Reuse the service with a single item
      const items = [{ id: 'single', text }];
      const out = await translateService(items, from, to, engine);
      sendResponse({ text: out['single'] || '' });
    })();
    return true;
  }

  // 监听侧边栏打开，主动注入 content script (如果尚未注入)
  if (msg && msg.type === 'jt_panel_opened') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }).catch(() => {
          // Ignore error (e.g. script already exists or restricted page)
        });
      }
    });
  }
  
  // 监听宽度变化消息，转发给 content script
  if (msg && msg.type === 'jt_width_changed') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
      }
    });
    sendResponse({});
    return true;
  }
  
  // 监听打开悬浮窗的消息
  if (msg && msg.type === 'jt_open_floating_panel') {
    // 保存悬浮窗打开状态
    chrome.storage.local.set({ floatingPanelOpen: true });
    
    // 通知当前 tab 的 content script 创建悬浮窗
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        // 先确保 content script 已注入
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }).catch(() => {});
        
        // 然后发送消息
        setTimeout(() => {
          chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
        }, 200);
      }
    });
    
    sendResponse({ success: true });
    return true;
  }
});
