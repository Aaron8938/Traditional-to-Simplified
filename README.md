# Traditional to Simplified

> 一款 macOS Safari 网页扩展，在浏览网页时自动将繁体中文转换为简体中文。

无需任何额外服务，所有转换都在本地浏览器内完成，基于字典映射、最长匹配优先，对动态加载的内容也能实时转换。

## 功能特性

- **自动转换**：打开网页后自动将页面中的繁体中文转为简体中文。
- **一键开关**：通过工具栏图标的弹出菜单可随时开启 / 关闭转换，关闭时自动恢复原始文本。
- **实时响应动态内容**：使用 `MutationObserver` 监听 DOM 变化，单页应用（SPA）动态插入的内容同样会被转换。
- **中英双语界面**：弹出菜单支持中文 / English 切换，首次安装时根据系统语言自动推断。
- **纯本地、零网络请求**：转换字典随扩展打包，转换过程不依赖任何服务器，不发送任何数据。
- **智能跳过**：自动跳过 `<script>`、`<style>`、`<code>`、`<pre>` 等标签内的文本，避免破坏代码与样式。

## 工作原理

1. **字典映射**：扩展内置一份繁→简字典（基于 [OpenCC](https://github.com/BYVoid/OpenCC) 数据，共 4612 条映射）。
2. **最长匹配优先**：转换时从当前位置尝试匹配 4→1 个字符的词组，优先命中更长的词组，减少单字误转。
3. **TextNode 遍历**：递归遍历 `document.body` 下的文本节点进行替换，并记录原始文本以便关闭时恢复。
4. **字典缓存**：字典由 background script 加载并缓存，content script 通过消息请求获取，避免重复加载。

## 项目结构

```
Traditional to Simplified/
├── Traditional to Simplified/                 # Safari 扩展宿主 App（Swift / Cocoa）
│   ├── AppDelegate.swift
│   ├── ViewController.swift                   # 内嵌 WKWebView，引导用户开启扩展
│   └── Resources/
│
├── Traditional to Simplified Extension/       # Web Extension 主体
│   ├── SafariWebExtensionHandler.swift        # Safari 原生消息桥接
│   ├── Info.plist
│   └── Resources/
│       ├── manifest.json                      # Manifest V3 配置
│       ├── background.js                      # 字典加载缓存 + storage 管理
│       ├── content.js                         # DOM 遍历 + 转换 + MutationObserver + 恢复
│       ├── dictionary.json                    # 繁→简字典（4612 条，约 59 KB）
│       ├── popup.html / popup.css / popup.js  # 工具栏弹出菜单（苹果风格开关）
│       ├── _locales/                          # 扩展名称/描述的国际化文案
│       └── images/                            # 图标资源
│
└── Traditional to Simplified.xcodeproj/       # Xcode 工程
```

## 安装

### 下载 DMG 安装包

从 [GitHub Releases](https://github.com/Aaron8938/Traditional-to-Simplified/releases) 下载最新的 `Traditional to Simplified 1.0.0.dmg`。

### 安装步骤

1. 双击 `.dmg` 文件，弹出安装窗口。
2. 将 **Traditional to Simplified** 拖到 **Applications** 文件夹。
3. 启动 App 后，会自动弹出 Safari 引导页，点击按钮跳转到 **Safari → 设置 → 扩展**。
4. 勾选 **Traditional to Simplified**，确认权限提示。
5. 安装完成，打开任意繁体网站即可看到自动转换效果。

---

### ⚠️ 重要：首次打开无法启动的解决办法（必读）

由于本应用使用开发证书签名，未经过 Apple 公证（Notarization），macOS 会阻止启动并提示「无法打开，因为无法验证开发者」或「已损坏」。

**这是正常现象，应用本身没有任何问题。** 请按以下任一方式解决：

#### 方式一：终端命令（推荐，最可靠）

打开「终端」App，粘贴以下命令并回车（会要求输入你的开机密码，输入时不显示字符，输完直接回车）：

```bash
sudo xattr -rd com.apple.quarantine /Applications/Traditional\ to\ Simplified.app
```

执行完成后，直接双击 App 即可正常打开，之后都不会再出现任何提示。

#### 方式二：右键打开（部分 macOS 版本可用）

1. 在「访达」→「应用程序」中找到 **Traditional to Simplified**。
2. **按住 Control 键点击** App 图标（或右键点击），选择 **打开**。
3. 弹窗中选择 **打开** 确认。
4. 之后正常双击即可打开。

> 如果右键打开无效（部分 macOS 版本会仍然阻止），请使用上面的终端命令方式。

---

### 从源码构建

```bash
git clone https://github.com/Aaron8938/Traditional-to-Simplified.git
cd "Traditional to Simplified"
xcodebuild -project "Traditional to Simplified.xcodeproj" \
           -scheme "Traditional to Simplified" build
```

## 使用方法

- 点击 Safari 工具栏中的扩展图标，弹出菜单提供两个开关：
  - **自动转换**：开启 / 关闭繁简转换，关闭后网页立即恢复原文。
  - **语言切换**：切换弹出菜单的界面语言（中文 / English），默认跟随系统语言。
- 转换状态和语言偏好会自动记住，下次使用时沿用。

## 技术栈

- **扩展标准**：Manifest V3（Safari Web Extension）
- **前端**：原生 JavaScript（无框架）、HTML、CSS
- **宿主 App**：Swift / Cocoa / SafariServices
- **字典数据**：[OpenCC](https://github.com/BYVoid/OpenCC)（开放灰度许可）

## 字典数据说明

`dictionary.json` 基于 OpenCC 的 `TSCharacters.txt` 单字映射，为适配 Safari 扩展的加载方式重新整理为 JSON 对象（`{ "繁": "简" }`）。最长匹配长度设为 4，可在 `content.js` 中的 `convertText` 函数内调整。

## 许可证

本项目源代码采用 [MIT License](LICENSE) 发布。字典数据来自 OpenCC，遵循其原始许可。
