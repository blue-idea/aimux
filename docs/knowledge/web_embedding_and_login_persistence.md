# Noi 软件复刻方案：网页嵌入与 AI 站点持久化登录技术详解

> 本文档深入剖析 **Noi**（[github.com/lencx/Noi](https://github.com/lencx/Noi)）的核心实现原理，详细阐述其**如何嵌入第三方 AI 网页**、**如何持久化保持多站点登录状态**、**如何解决第三方 OAuth 弹窗授权**以及**如何绕过 Cloudflare 与 Google 风控拦截**，并提供可直接工程落地的代码架构方案。

---

## 目录

1. [Noi 架构全景与技术路线](#1-noi-架构全景与技术路线)
2. [核心机制一：网页是如何嵌入到客户端中的？](#2-核心机制一网页是如何嵌入到客户端中的)
   - 2.1 [为什么不能使用普通 `<iframe>`？](#21-为什么不能使用普通-iframe)
   - 2.2 [Electron 原生 View 嵌入机制（WebContentsView / BrowserView）](#22-electron-原生-view-嵌入机制webcontentsview--browserview)
   - 2.3 [主壳层与业务页面的视图分离架构](#23-主壳层与业务页面的视图分离架构)
   - 2.4 [多标签页、多视角分栏与状态保留（Show/Hide 策略）](#24-多标签页多视角分栏与状态保留showhide-策略)
   - 2.5 [备选路线：原生 WebView（Wails v3 / Tauri）父子窗口嵌入](#25-备选路线原生-webviewwails-v3--tauri父子窗口嵌入)
3. [核心机制二：如何长久保持各种 AI 站点的登录状态？](#3-核心机制二如何长久保持各种-ai-站点的登录状态)
   - 3.1 [Session Partition 与 `persist:` 磁盘落盘原理](#31-session-partition-与-persist-磁盘落盘原理)
   - 3.2 [多账号与多站点会话隔离（Session Isolation）](#32-多账号与多站点会话隔离session-isolation)
   - 3.3 [第三方 OAuth 登录弹窗（Google / Apple / GitHub）授权闭环](#33-第三方-oauth-登录弹窗google--apple--github授权闭环)
   - 3.4 [反爬虫与风控对抗（绕过 Google 403 与 Cloudflare 拦截）](#34-反爬虫与风控对抗绕过-google-403-与-cloudflare-拦截)
   - 3.5 [网站 Cookie / Cache 精准清理与生命周期管理](#35-网站-cookie--cache-精准清理与生命周期管理)
4. [核心机制三：Prompt 跨站点注入与交互控制（NoiAsk 机制）](#4-核心机制三prompt-跨站点注入与交互控制noiask-机制)
   - 4.1 [各大 AI 站点输入框特征与模拟注入](#41-各大-ai-站点输入框特征与模拟注入)
   - 4.2 [响应式框架的数据触发与自动发送](#42-响应式框架的数据触发与自动发送)
5. [完整工程落地代码实战](#5-完整工程落地代码实战)
   - 5.1 [主进程视图与 Session 管理器（TypeScript）](#51-主进程视图与-session-管理器typescript)
   - 5.2 [Preload 脚本与安全隔离配置](#52-preload-脚本与安全隔离配置)
   - 5.3 [OAuth 弹窗拦截处理器](#53-oauth-弹窗拦截处理器)

---

## 1. Noi 架构全景与技术路线

Noi 的本质是一个**专为 AI 工作流定制的轻量级多视图桌面浏览器工作台**。

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Noi 主窗口 (BrowserWindow)                       │
├────────────┬───────────────────────────────────────────────────────────┤
│ 侧边栏/Tabs │  动态内容工作区 (Content Area)                             │
│ (React UI) │                                                           │
│            │  ┌─────────────────────────┬───────────────────────────┐  │
│  [ChatGPT] │  │ WebContentsView A       │ WebContentsView B         │  │
│  [Claude]  │  │ (ChatGPT)               │ (Claude / DeepSeek)       │  │
│  [Gemini]  │  │                         │                           │  │
│  [Settings]│  │ 隔离分区: persist:chatgpt│ 隔离分区: persist:claude   │  │
│            │  │ 伪装 Chrome 桌面 UA      │ 伪装 Chrome 桌面 UA       │  │
│            │  └─────────────────────────┴───────────────────────────┘  │
├────────────┴───────────────────────────────────────────────────────────┤
│ 全局 Prompt 注入面板 / 底部状态栏                                         │
└────────────────────────────────────────────────────────────────────────┘
```

为了让 ChatGPT、Claude、Gemini、DeepSeek 等多个站点能同时在一个客户端内并存、左右分栏且互不干扰，Noi 采用了以下核心设计：
1. **主壳与内容解耦**：客户端外壳（Sidebar、Tab 栏、Prompt 库、设置）使用前端框架渲染（React + Tailwind）；
2. **多视图独立容器**：页面内容不使用传统 `<iframe>`，而是使用独立于主 DOM 的原生渲染容器；
3. **分区分流存储**：不同站点/工作空间绑定独立的 `persist:` 会话分区，Cookie 与缓存各自持久化；
4. **请求头与特征清洗**：剥离客户端所有自动化与 Electron 痕迹，伪装成标准 Google Chrome 桌面版。

---

## 2. 核心机制一：网页是如何嵌入到客户端中的？

### 2.1 为什么不能使用普通 `<iframe>`？

许多初学者尝试用网页前端技术做聚合客户端时，首选用 `<iframe>` 标签，但在 AI 场景下会立即遇到严重阻塞：

1. **CSP (Content Security Policy) 拦截**：各大 AI 站点（如 `chatgpt.com`、`claude.ai`、`gemini.google.com`）均严格下发 HTTP 响应头：
   ```http
   Content-Security-Policy: frame-ancestors 'none';
   X-Frame-Options: DENY
   ```
   浏览器收到后会直接拒绝在 `<iframe>` 中加载该页面。
2. **Cookie 与 Storage 跨源限制**：现代浏览器的 Partitioned Cookies / 3rd-Party Cookie 限制会导致 `<iframe>` 内的登录态、LocalStorage 和 IndexedDB 出现丢失或异常。
3. **同源策略拦截**：主窗口无法自由操作 `<iframe>` 内部的 DOM 进行 Prompt 自动化填充和提交。

### 2.2 Electron 原生 View 嵌入机制（WebContentsView / BrowserView）

Noi 的主流实现是基于 **Electron**。在 Electron 中，嵌入外部完整网站的最佳实践是采用原生 View 体系：

* **Electron 30 之前**：使用 `BrowserView`。
* **Electron 30+ 现代标准**：使用 `WebContentsView` 配合 `BaseWindow` / `BrowserWindow.contentView.addChildView()`。

`WebContentsView` 直接映射 Chromium 底层的原生图层。它拥有完全独立的渲染进程（Render Process）、独立的事件循环和独立的 DOM 树，且处于顶层（Top-Level）浏览上下文，**天然不受 `X-Frame-Options` 和 `frame-ancestors 'none'` 限制**。

### 2.3 主壳层与业务页面的视图分离架构

Noi 的界面分为两层：
1. **Shell 渲染层**：一个无边框或标准窗口，承载应用自身的 UI（导航栏、Tab 栏、分栏拖拽条、Prompt 抽屉、设置界面）。
2. **Web View 内容层**：若干个 `WebContentsView` 实例，由 Electron 主进程统一管理。

主进程根据前端发出的坐标指令，通过 `view.setBounds({ x, y, width, height })` 将指定的 View 精准叠放在主窗口的内容区。

```typescript
// 主进程中挂载 View 的核心逻辑
import { app, BrowserWindow, WebContentsView } from 'electron';

export function createEmbeddingView(mainWindow: BrowserWindow, url: string, partitionKey: string) {
  const view = new WebContentsView({
    webPreferences: {
      partition: `persist:${partitionKey}`, // 核心：持久化会话分区
      nodeIntegration: false,               // 安全隔离
      contextIsolation: true,              // 避免外部网站破坏全局环境
      sandbox: true,
      preload: path.join(__dirname, 'preload-embedded.js')
    }
  });

  // 挂载到主窗口
  mainWindow.contentView.addChildView(view);
  
  // 设置渲染区域（留出左侧 240px 侧边栏，顶部 40px Tab 栏）
  const bounds = mainWindow.getContentBounds();
  view.setBounds({
    x: 240,
    y: 40,
    width: bounds.width - 240,
    height: bounds.height - 40
  });

  // 加载第三方站点
  view.webContents.loadURL(url);
  return view;
}
```

### 2.4 多标签页、多视角分栏与状态保留（Show/Hide 策略）

普通浏览器切换 Tab 时若销毁后台 DOM，会导致未发送的对话草稿丢失、页面重新渲染、甚至连接断开。

Noi 保持流畅度的关键是 **View 缓存池与 Show/Hide 机制**：
* **切换 Tab 时不销毁 View**：当用户从 ChatGPT 切换到 Claude 时，主进程仅调用 `mainWindow.contentView.removeChildView(oldView)` 或将 `oldView.setVisible(false)`，其内存、DOM 状态、WebSocket 连接均保持存活。
* **分栏对照模式（Split View）**：
  若用户开启左右双视角，主进程计算屏幕宽度的一半，同时把两个 View 挂载上屏：
  ```typescript
  // 左右各占 50%
  const halfWidth = Math.floor((contentWidth) / 2);
  viewLeft.setBounds({ x: sidebarWidth, y: topBarHeight, width: halfWidth, height: contentHeight });
  viewRight.setBounds({ x: sidebarWidth + halfWidth, y: topBarHeight, width: contentWidth - halfWidth, height: contentHeight });
  viewLeft.setVisible(true);
  viewRight.setVisible(true);
  ```

### 2.5 备选路线：原生 WebView（Wails v3 / Tauri）父子窗口嵌入

若使用 Go + Wails v3 或 Rust + Tauri 2.0 进行复刻，其方案原理类似，但调用的是操作系统级 API：
* **Windows**：创建无边框原生窗口，通过 Win32 API `SetParent(childHWnd, parentHWnd)` 将子 WebView 挂载到主窗口内部，并设置 `WS_CHILD | WS_CLIPCHILDREN` 样式与 `WS_EX_NOACTIVATE` 避免焦点打架。
* **macOS**：通过 Cocoa API `[parentWindow addChildWindow:childWindow ordered:NSWindowAbove]` 建立层级叠加关系。
* **Linux**：通过 GTK `gtk_window_set_transient_for` 关联。

---

## 3. 核心机制二：如何长久保持各种 AI 站点的登录状态？

保持各大 AI 网站稳定登录，是复刻 Noi 最关键的技术攻坚点。必须同时解决：**会话持久化**、**第三方 OAuth 弹窗**、**Cloudflare 人机校验** 以及 **Google 403 封锁**。

### 3.1 Session Partition 与 `persist:` 磁盘落盘原理

在 Chromium 和 Electron 中，登录状态（Cookies、Session Storage、Local Storage、IndexedDB、Service Workers）完全由 `Session` 管理。

#### 核心关键：必须带有 `persist:` 前缀
* `partition: "my_site"`（无前缀）：被 Chromium 视作**纯内存临时会话**（In-Memory Session），程序一旦退出，Cookie 全部丢弃！
* `partition: "persist:my_site"`（有前缀）：Chromium 会在本地磁盘为该分区开辟持久化存储目录，所有登录凭证和 Cookie 均写入磁盘数据库。

#### 数据在磁盘上的物理存储分布
在 Windows 平台上，数据被保存在：
```
%APPDATA%\<YourAppName>\Partitions\<partition-name>\
  ├── Network/
  │   └── Cookies           <-- SQLite 格式的 Cookie 数据库 (登录状态核心)
  ├── Local Storage/        <-- leveldb 存储的 Token 与本地状态
  ├── IndexedDB/            <-- 各大站点的离线数据与 IndexedDB
  └── Cache/                <-- HTTP 缓存数据
```
在 macOS 上保存在 `~/Library/Application Support/<YourAppName>/Partitions/...`。
只要该目录文件完好，用户在应用重启后依然保持登录。

### 3.2 多账号与多站点会话隔离（Session Isolation）

在 Noi 中，用户可以灵活选择：
1. **全局共享会话模式**：所有 AI 站点或默认标签页共用 `persist:default` 分区，相互之间可以共享同顶级域名下的 SSO 登录态。
2. **多账号隔离模式（Noi Space）**：为不同站点或不同身份指定独立分区（例如 `persist:work_chatgpt` 和 `persist:personal_chatgpt`）。两个分区拥有独立的 `Cookies` 数据库，可实现**同一电脑上同时登录两个不同的 ChatGPT 账号**。

### 3.3 第三方 OAuth 登录弹窗（Google / Apple / GitHub）授权闭环

许多用户是通过点击 **"Log in with Google"** 或 **"Continue with Apple"** 登录 AI 站点的。
在前端页面中，这通常会触发 `window.open(authUrl, '_blank', 'width=500,height=600')`。

如果处理不当，常见的失败现象包括：
* 弹窗在外部默认浏览器（如 Chrome/Edge）中打开，授权完毕后回调到了外部浏览器，而桌面客户端内部仍未登录；
* 弹窗被拦截，无任何反应；
* 弹窗虽在客户端内打开，但使用了默认临时 Session，授权成功后 Cookie 没有同步写入业务 View 中。

#### 正确的拦截与授权解决方案：`setWindowOpenHandler`

必须在主进程中拦截嵌入视图的 `setWindowOpenHandler`，并将弹窗的 `partition` 严格绑定为当前父视图的同一个 partition：

```typescript
import { BrowserWindow, HandlerDetails } from 'electron';

export function setupOAuthHandler(viewWebContents: Electron.WebContents, currentPartition: string) {
  viewWebContents.setWindowOpenHandler((details: HandlerDetails) => {
    const url = details.url;

    // 1. 判断是否属于常见 OAuth 授权登录白名单域名
    const isAuthUrl = [
      'accounts.google.com',
      'appleid.apple.com',
      'github.com/login/oauth',
      'auth0.com',
      'auth.openai.com',
      'login.microsoftonline.com'
    ].some(domain => url.includes(domain));

    if (isAuthUrl) {
      // 2. 在应用内部弹出受控模态窗口进行登录
      return {
        action: 'allow',
        outlivesOpener: false,
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
          webPreferences: {
            partition: currentPartition, // 关键：继承相同分区，确保 Cookie 写入同一存储库
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }

    // 3. 对普通外部跳转链接（如文档链接），调用系统默认浏览器打开
    shell.openExternal(url);
    return { action: 'deny' };
  });
}
```

**工作流流程**：
1. 用户在 ChatGPT 视图点击 "Continue with Google"；
2. 内部触发打开 `accounts.google.com` 弹窗；
3. 弹窗加载时使用同一个 `persist:chatgpt` 分区；
4. 用户在弹窗完成 2FA 与授权，Google 往当前 Session 写入认证 Cookie 并回调 `auth.openai.com`；
5. 网页调用 `window.close()` 自动关闭弹窗；
6. ChatGPT 主视图检测到 Cookie 变化并自动刷新，登录成功完成闭环！

### 3.4 反爬虫与风控对抗（绕过 Google 403 与 Cloudflare 拦截）

AI 站点有着最严苛的风控策略。如果不做伪装，会直接遇到两大死穴：
* Google 报错：`403: disallowed_useragent`（禁止在非官方 Webview/嵌入式客户端中登录 Google 账号）；
* Cloudflare 盾死循环：无法通过 Turnstile 验证。

#### 核心对抗手段：

#### 1. 全局 User-Agent 伪装
Electron 默认的 UA 含有 `Electron/x.y.z` 和你自己的应用名 `Noi/1.0.0`，这会被 Google 和 Cloudflare 瞬间识别为机器或非授权嵌入。

**必须彻底剔除这些特征，替换为纯净的主流 Chrome 桌面 UA**：
```typescript
// 定义纯净的标准 Chrome 桌面 User-Agent
const CLEAN_CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// 1. 设置 session 默认 UA
session.fromPartition(partitionKey).setUserAgent(CLEAN_CHROME_UA);

// 2. 拦截并修正 HTTP 请求头中的 Client Hints 与 User-Agent
session.fromPartition(partitionKey).webRequest.onBeforeSendHeaders((details, callback) => {
  details.requestHeaders['User-Agent'] = CLEAN_CHROME_UA;
  details.requestHeaders['Sec-Ch-Ua'] = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
  details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0';
  details.requestHeaders['Sec-Ch-Ua-Platform'] = '"Windows"';
  callback({ cancel: false, requestHeaders: details.requestHeaders });
});
```

#### 2. 在 Preload 中抹除自动化指纹
在嵌入页面的 preload 脚本最顶部执行指纹抹除，欺骗网站的前端风控探测脚本：
```javascript
// preload-embedded.js
// 抹除自动化驱动标记
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined,
  configurable: true
});

// 伪造语言与插件列表（避免 headless 特征）
Object.defineProperty(navigator, 'languages', {
  get: () => ['zh-CN', 'zh', 'en-US', 'en'],
});
```

### 3.5 网站 Cookie / Cache 精准清理与生命周期管理

当用户账号失效或需要重置登录态时，Noi 提供了单站点或全部站点的缓存清理机制。在 Electron 中通过 `Session.clearStorageData` 细粒度操作：

```typescript
export async function clearSiteSessionData(partitionKey: string, siteOrigin?: string) {
  const ses = session.fromPartition(partitionKey);
  
  await ses.clearStorageData({
    origin: siteOrigin, // 如果指定则仅清理该站点，不传则清理当前分区下所有站点
    storages: [
      'cookies',
      'localstorage',
      'indexdb',
      'websql',
      'serviceworkers',
      'cachestorage'
    ]
  });
}
```

---

## 4. 核心机制三：Prompt 跨站点注入与交互控制（NoiAsk 机制）

Noi 的另一大卖点是支持在底栏或右栏输入一段 Prompt，一键分发或注入到正在浏览的 AI 输入框中。

### 4.1 各大 AI 站点输入框特征与模拟注入

各大 AI 站点并没有使用原生 `<input>`，而是普遍采用了富文本库（如 ProseMirror、Slate、Quill 或 React 受控组件）。如果直接设置 `element.value = "xxx"`，React 的内部虚拟 DOM 状态根本不会被触发，发送按钮依然是置灰状态。

基于对 Noi 源码（`NoiAsk` 扩展模块）的逆向分析，以下是各大 AI 站点的精准注入逻辑：

| 平台 | 目标 DOM 选择器 | 注入与事件触发策略 | 发送按钮与提交方式 |
|---|---|---|---|
| **ChatGPT** | `form #prompt-textarea` (contenteditable) | 创建 `<p>` 元素分段追加，聚焦并派发 `InputEvent` | 查找 `main form button` 中的最后一个发送按钮并点击 |
| **Claude** | `div.ProseMirror` (contenteditable) | 聚焦后执行 `document.execCommand('insertText', false, text)` | 查找 `button[aria-label*="send message" i]` 并点击 |
| **Gemini** | `.ql-editor.textarea` (Quill 编辑器) | 派发 `input` 事件并将文本同步给内部 `<p>` 标签 | 查找 `button[aria-label*="Send message"]`，置 `aria-disabled='false'` 后点击 |
| **DeepSeek** | `textarea` / `div[role="button"]` | 修改原型属性 `HTMLTextAreaElement.prototype.value` 并派发冒泡 `InputEvent` | 查找表单区域内的提交按钮执行 `.click()` |

### 4.2 响应式框架的数据触发与自动发送

以 ChatGPT 和 Claude 为例的核心注入代码：

```javascript
// 在嵌入 View 内通过 webContents.executeJavaScript() 执行
export function injectPromptToAI(platform, text) {
  if (platform === 'chatgpt') {
    const textarea = document.querySelector('form #prompt-textarea');
    if (textarea) {
      textarea.focus();
      textarea.innerHTML = '';
      text.split('\n').forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        textarea.appendChild(p);
      });
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      
      // 自动触发发送
      setTimeout(() => {
        const sendBtn = document.querySelector('button[data-testid="send-button"]') 
                     || document.querySelector('form button:has(svg)');
        if (sendBtn) sendBtn.click();
      }, 100);
    }
  } else if (platform === 'claude') {
    const inputElement = document.querySelector('div.ProseMirror');
    if (inputElement) {
      inputElement.focus();
      inputElement.innerHTML = '';
      // ProseMirror 对 execCommand 支持极好，能完美同步内部状态
      document.execCommand('insertText', false, text);
      
      setTimeout(() => {
        const btn = document.querySelector('button[aria-label*="send message" i]')
                 || document.querySelector('fieldset button:has(svg)');
        if (btn) btn.click();
      }, 100);
    }
  }
}
```

---

## 5. 完整工程落地代码实战

下面提供一个高内聚、结构严谨的主进程管理器骨架，演示如何构建支持**多 View 嵌入**、**持久化 Session**、**OAuth 弹窗拦截**与**UA 伪装**的现代化应用。

### 5.1 主进程视图与 Session 管理器（TypeScript）

```typescript
// src/main/ViewManager.ts
import { BrowserWindow, WebContentsView, session, shell } from 'electron';
import * as path from 'path';

export interface TabConfig {
  id: string;
  url: string;
  partitionKey: string;
  userAgent?: string;
}

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export class ViewManager {
  private mainWindow: BrowserWindow;
  private views: Map<string, WebContentsView> = new Map();
  private activeTabIds: string[] = []; // 支持单视角或双视角分栏
  private sidebarWidth: number = 240;
  private topBarHeight: number = 44;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.registerWindowResizeEvent();
  }

  /**
   * 创建或激活一个 Tab 视图
   */
  public openTab(config: TabConfig): WebContentsView {
    if (this.views.has(config.id)) {
      const existingView = this.views.get(config.id)!;
      this.setActiveViews([config.id]);
      return existingView;
    }

    const partitionName = `persist:${config.partitionKey || 'default'}`;
    const customSession = session.fromPartition(partitionName);

    // 1. 设置 UA 与清洗 HTTP Headers
    const targetUA = config.userAgent || DEFAULT_UA;
    customSession.setUserAgent(targetUA);
    customSession.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['User-Agent'] = targetUA;
      details.requestHeaders['Sec-Ch-Ua'] = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
      details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0';
      details.requestHeaders['Sec-Ch-Ua-Platform'] = '"Windows"';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // 2. 实例化 WebContentsView
    const view = new WebContentsView({
      webPreferences: {
        partition: partitionName,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: path.join(__dirname, 'preload-embedded.js')
      }
    });

    // 3. 配置 OAuth 拦截与弹窗管理
    this.setupWindowOpenHandler(view.webContents, partitionName);

    // 4. 载入目标地址
    view.webContents.loadURL(config.url);

    this.views.set(config.id, view);
    this.setActiveViews([config.id]);

    return view;
  }

  /**
   * 设置激活的视图（支持单个，或两个分栏对照）
   */
  public setActiveViews(tabIds: string[]) {
    // 隐藏所有不在当前激活列表中的 View
    this.views.forEach((view, id) => {
      if (!tabIds.includes(id)) {
        if (this.mainWindow.contentView.children.includes(view)) {
          this.mainWindow.contentView.removeChildView(view);
        }
      }
    });

    this.activeTabIds = tabIds;
    this.relayout();
  }

  /**
   * 重新计算并布置 View 的像素矩形位置
   */
  public relayout() {
    if (this.activeTabIds.length === 0) return;

    const bounds = this.mainWindow.getContentBounds();
    const contentWidth = bounds.width - this.sidebarWidth;
    const contentHeight = bounds.height - this.topBarHeight;

    if (this.activeTabIds.length === 1) {
      // 单视口铺满
      const view = this.views.get(this.activeTabIds[0]);
      if (view) {
        if (!this.mainWindow.contentView.children.includes(view)) {
          this.mainWindow.contentView.addChildView(view);
        }
        view.setBounds({
          x: this.sidebarWidth,
          y: this.topBarHeight,
          width: Math.max(0, contentWidth),
          height: Math.max(0, contentHeight)
        });
      }
    } else if (this.activeTabIds.length === 2) {
      // 双视口 50/50 左右分栏
      const halfWidth = Math.floor(contentWidth / 2);
      this.activeTabIds.forEach((id, index) => {
        const view = this.views.get(id);
        if (view) {
          if (!this.mainWindow.contentView.children.includes(view)) {
            this.mainWindow.contentView.addChildView(view);
          }
          view.setBounds({
            x: this.sidebarWidth + (index * halfWidth),
            y: this.topBarHeight,
            width: halfWidth,
            height: Math.max(0, contentHeight)
          });
        }
      });
    }
  }

  /**
   * 拦截第三方登录与外部链接
   */
  private setupWindowOpenHandler(webContents: Electron.WebContents, partition: string) {
    webContents.setWindowOpenHandler((details) => {
      const url = details.url;

      const isAuthUrl = [
        'accounts.google.com',
        'appleid.apple.com',
        'github.com/login',
        'auth.openai.com',
        'auth0.com'
      ].some(domain => url.includes(domain));

      if (isAuthUrl) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 520,
            height: 680,
            webPreferences: {
              partition: partition, // 必须同分区以共享已写入的 Cookie
              contextIsolation: true,
              nodeIntegration: false
            }
          }
        };
      }

      // 普通外链调起系统默认浏览器
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private registerWindowResizeEvent() {
    this.mainWindow.on('resize', () => {
      this.relayout();
    });
  }
}
```

### 5.2 Preload 脚本与安全隔离配置

```javascript
// src/main/preload-embedded.js
// 抹除自动化驱动标记，保证 Cloudflare Turnstile 与 Google 校验无阻
try {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true
  });
} catch (e) {}

// 监听主进程注入 Prompt 消息
const { ipcRenderer } = require('electron');

ipcRenderer.on('noi:inject-prompt', (event, { platform, promptText, autoSend }) => {
  // 执行上文 4.2 节对应的各平台 DOM 查找与文本注入逻辑
  // ...
});
```

---

## 6. 总结与复刻避坑指南

| 关注维度 | 踩坑现象 | Noi 的解决准则 |
|---|---|---|
| **内嵌方式** | 使用 `<iframe>` 导致 CSP 拒绝连接、Cookie 丢失 | 必须使用 **`WebContentsView`**（或 OS 原生子窗口），脱离页面 DOM 树，享受独立顶层浏览上下文。 |
| **登录保持** | 软件重启后所有网站需重新登录 | Partition 参数必须严格携带 **`persist:`** 前缀，确保存储进入磁盘 SQLite 数据库。 |
| **多账号隔离** | 多个标签页会互相串号 | 为不同的 AI 站点或不同身份指定不同的 `persist:<key>`，利用物理文件隔离存储。 |
| **Google 登录** | 弹窗报错 `403: disallowed_useragent` | 请求头必须彻底剥除 `Electron` 标识，伪装为完整的真实 Chrome 桌面版 UA 与 Client Hints。 |
| **OAuth 闭环** | 点击登录弹窗在系统浏览器打开，客户端登录失败 | 在 `setWindowOpenHandler` 中捕获登录 URL，在内嵌弹窗中以**相同 partition** 打开，确保 Cookie 落地到同一数据库。 |
| **多视口性能** | 频繁销毁重建导致页面白屏与草稿丢失 | 采用 **Show/Hide 与 RemoveChildView 缓存池机制**，仅调整位置与可视状态，不杀后台渲染进程。 |
