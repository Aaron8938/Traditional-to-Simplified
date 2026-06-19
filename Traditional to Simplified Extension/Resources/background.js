// 繁体转简体 — background script
// 负责加载字典、管理开关状态、响应消息

let dictionary = null;

async function loadDictionary() {
    if (dictionary) return dictionary;
    try {
        const url = browser.runtime.getURL('dictionary.json');
        const response = await fetch(url);
        dictionary = await response.json();
        return dictionary;
    } catch (e) {
        console.error('繁简转换: 加载字典失败', e);
        dictionary = {};
        return dictionary;
    }
}

// 根据系统语言推断默认界面语言
function detectSystemLang() {
    const sys = navigator.language.toLowerCase();
    return sys.startsWith('zh') ? 'zh' : 'en';
}

// 安装时设置默认值
browser.runtime.onInstalled.addListener(async () => {
    const result = await browser.storage.local.get(['enabled', 'uiLang']);
    const updates = {};
    if (result.enabled === undefined) updates.enabled = true;
    if (result.uiLang === undefined) updates.uiLang = detectSystemLang();
    if (Object.keys(updates).length > 0) {
        await browser.storage.local.set(updates);
    }
    // 预加载字典
    await loadDictionary();
});

// 响应来自 content script 和 popup 的消息
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getDictionary') {
        loadDictionary().then(dict => {
            sendResponse({ dictionary: dict });
        });
        return true; // 异步响应
    }
});
