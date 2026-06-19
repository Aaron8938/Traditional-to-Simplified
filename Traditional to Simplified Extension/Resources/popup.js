const toggle = document.getElementById('toggle');
const status = document.getElementById('status');
const langToggle = document.getElementById('lang-toggle');
const header = document.getElementById('header');
const labelConvert = document.getElementById('label-convert');
const langCurrent = document.getElementById('lang-current');
const langAlt = document.getElementById('lang-alt');

// 中英文案字典
// checked = true  → English; checked = false → 中文
// 语言标签用简称, 跟随当前界面语言
const i18n = {
    zh: {
        header: '繁体转简体',
        convert: '自动转换',
        on: '转换已开启',
        off: '转换已关闭',
        current: '中',
        alt: '英'
    },
    en: {
        header: 'Traditional to Simplified',
        convert: 'Auto Convert',
        on: 'Conversion On',
        off: 'Conversion Off',
        current: 'EN',
        alt: 'ZH'
    }
};

let uiLang = 'zh';

// 根据系统语言推断默认界面语言
function detectSystemLang() {
    const sys = navigator.language.toLowerCase();
    return sys.startsWith('zh') ? 'zh' : 'en';
}

// 应用界面语言
function applyLang(lang) {
    uiLang = lang;
    const t = i18n[lang];
    header.textContent = t.header;
    labelConvert.textContent = t.convert;
    langCurrent.textContent = t.current;
    langAlt.textContent = t.alt;
    // checked = true 表示英文
    langToggle.checked = (lang === 'en');
}

// 读取并初始化
browser.storage.local.get(['enabled', 'uiLang']).then((result) => {
    const enabled = result.enabled !== false;
    toggle.checked = enabled;

    // uiLang 未设置时，根据系统语言推断
    const lang = result.uiLang || detectSystemLang();
    applyLang(lang);
    updateStatus(enabled);
});

// 转换开关
toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    browser.storage.local.set({ enabled: enabled });
    updateStatus(enabled);
});

// 语言开关
langToggle.addEventListener('change', () => {
    const lang = langToggle.checked ? 'en' : 'zh';
    browser.storage.local.set({ uiLang: lang });
    applyLang(lang);
    // 当前转换状态文字需要重新刷新
    updateStatus(toggle.checked);
});

function updateStatus(enabled) {
    status.textContent = enabled ? i18n[uiLang].on : i18n[uiLang].off;
}
