// 繁体转简体 — content script
// 遍历页面文本节点，将繁体中文转换为简体中文

let dictionary = null;
let enabled = true;

// 记录被修改的节点及其原始文本，用于关闭时恢复
const modifiedNodes = new Map();

// 跳过这些标签内的文本
const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA',
    'INPUT', 'SELECT', 'OPTION', 'KBD', 'SAMP', 'VAR'
]);

// 转换文本：最长匹配优先
function convertText(text) {
    if (!dictionary || !text) return text;

    let result = '';
    let i = 0;
    while (i < text.length) {
        let matched = false;
        // 尝试匹配 4→1 个字符（词组优先）
        for (let len = Math.min(4, text.length - i); len >= 1; len--) {
            const sub = text.substring(i, i + len);
            if (dictionary[sub] !== undefined) {
                result += dictionary[sub];
                i += len;
                matched = true;
                break;
            }
        }
        if (!matched) {
            result += text[i];
            i++;
        }
    }
    return result;
}

// 递归转换节点
function convertNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const original = node.nodeValue;
        const converted = convertText(original);
        if (original !== converted) {
            if (!modifiedNodes.has(node)) {
                modifiedNodes.set(node, original);
            }
            node.nodeValue = converted;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has(node.tagName)) return;
        const children = [];
        for (const child of node.childNodes) children.push(child);
        for (const child of children) convertNode(child);
    }
}

// 恢复所有被修改的节点
function restoreDocument() {
    for (const [node, original] of modifiedNodes) {
        if (node.parentNode) {
            node.nodeValue = original;
        }
    }
    modifiedNodes.clear();
}

// 转换整个文档
function convertDocument() {
    if (!dictionary) return;
    convertNode(document.body);
}

// MutationObserver 监听动态内容
let observer = null;
function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
        if (!enabled || !dictionary) return;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                convertNode(node);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}

// 监听开关状态变化
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.enabled) {
        enabled = changes.enabled.newValue;
        if (enabled) {
            convertDocument();
            startObserver();
        } else {
            stopObserver();
            restoreDocument();
        }
    }
});

// 从 background 获取字典
function getDictionary() {
    return new Promise((resolve) => {
        browser.runtime.sendMessage({ type: 'getDictionary' }, (response) => {
            resolve(response ? response.dictionary : null);
        });
    });
}

// 初始化
async function init() {
    const result = await browser.storage.local.get('enabled');
    enabled = result.enabled !== false;

    dictionary = await getDictionary();

    if (enabled) {
        convertDocument();
        startObserver();
    }
}

init();
