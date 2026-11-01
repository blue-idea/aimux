# 桌面级多 AI 视角工作台实现设计文档

> 基于 **Go + Wails v3 + React + TypeScript** 实现具备「原生 WebView 内嵌 + 混合多窗口体系（主工作台 + 全局极速悬浮窗 + 独立分离窗）+ 全局/应用内快捷键生态 + 现代玻璃拟态皮肤中心 + 全分辨率/DPI 自适应抗折叠引擎」的生产力桌面工作台。
>
> 本文档是项目实施的技术架构与系统设计落地指南。

---

## 目录

1. [设计目标与核心特性](#1-设计目标与核心特性)
2. [能力边界与架构路径选择](#2-能力边界与架构路径选择)
3. [技术选型与核心依赖](#3-技术选型与核心依赖)
4. [总体架构与三大窗口模型](#4-总体架构与三大窗口模型)
   - 4.1 窗口角色定义（Shell / Spotlight / Detached）
   - 4.2 窗口层级与跨窗通信总线
5. [多窗口树与生命周期状态机](#5-多窗口树与生命周期状态机)
   - 5.1 窗口唯一标识与路由表
   - 5.2 子窗口 Show/Hide 缓存池与 LRU 挂起
   - 5.3 Spotlight 悬浮窗唤出与自动收起
   - 5.4 视口分离 (Detach) 与合并 (Re-attach)
6. [全局与应用内快捷键底层实现](#6-全局与应用内快捷键底层实现)
   - 6.1 Win32 / macOS 全局系统热键注册管道
   - 6.2 前端上下文快捷键分发调度器
   - 6.3 快捷键冲突排查与防穿透
7. [窗口风格与现代皮肤定制系统](#7-窗口风格与现代皮肤定制系统)
   - 7.1 无边框外壳与 OS 原生材质融合 (Mica / Acrylic / Vibrancy)
   - 7.2 6 款预设皮肤主题 Token 与 CSS 变量映射
   - 7.3 透明度、模糊度与强调色动态注入管道
8. [窗口尺寸预设与全分辨率兼容引擎](#8-窗口尺寸预设与全分辨率兼容引擎)
   - 8.1 常用分辨率预设规格矩阵 (1080P / 2K / 4K / 带鱼屏)
   - 8.2 智能抗折叠动态缩放算法 (Anti-Folding Dynamic Zoom)
   - 8.3 高分屏 DPI 转换与跨显示器切换 (Per-Monitor DPI Aware v2)
   - 8.4 多显示器边界校验与防幽灵窗口机制
9. [平台原生窗口挂载实现](#9-平台原生窗口挂载实现)
   - 9.1 Windows (SetParent + WS_CHILD + WS_EX_NOACTIVATE)
   - 9.2 macOS (addChildWindow:ordered:)
   - 9.3 Linux (Transient For 降级)
10. [会话持久化与反风控伪装](#10-会话持久化与反风控伪装)
11. [Prompt 跨站点注入与一键广播引擎](#11-prompt-跨站点注入与一键广播引擎)
12. [工程目录与关键源文件骨架](#12-工程目录与关键源文件骨架)
13. [风险应对与已知坑降级策略](#13-风险应对与已知坑降级策略)
14. [工程验收指标与验证流程](#14-工程验收指标与验证流程)

---

## 1. 设计目标与核心特性

打造一个跨平台、高性能、轻量级、专注于多 AI 协作的桌面客户端，核心技术指标：

1. **原生 WebView 轻量内嵌**：使用 Windows WebView2、macOS WKWebView、Linux WebKitGTK，零打包 Chromium 核心，内存占用小、冷启动快；
2. **混合多窗口系统 (Hybrid Multi-Window)**：
   - **Shell 主工作台**：单窗多面板 (Main / Right / Bottom)，主区支持 1~4 视口（单窗、双视口、四宫格、带鱼屏四列、主辅 1+3）同屏呈现；
   - **Spotlight 极速悬浮窗**：轻量无边框置顶窗，支持全局热键 `Alt+Space` 居中呼出，用于快速提问、模型勾选与一键四发广播；
   - **Detached 独立分离视口**：主工作台内任一视口均可一键弹出为独立桌面顶层窗口，满足副显示器或多屏分工需求；
3. **全局与应用内快捷键生态**：原生注册系统级热键，支持单手流快捷切换 1~4 视口布局、快速广播与标签管理；
4. **Modern Glassmorphic 皮肤中心**：6 套高水准设计师预设皮肤，支持窗口透明度 (70%~100%)、毛玻璃虚化度 (0~40px) 及强调色自由调节；
5. **全分辨率智能抗折叠兼容**：针对 1080P/2K/4K/带鱼屏常见尺寸预设一键切换；搭载智能动态缩放算法，四宫格或窄屏时自动缩放 (0.75~0.85)，杜绝 AI 网页自动折叠为移动端抽屉；
6. **物理级会话隔离与反风控伪装**：每个视口分配独立磁盘 `UserDataPath`，持久保存 Cookie/LocalStorage；统一伪装真实 Chrome 桌面版 UA，抹除 `navigator.webdriver` 特征。

---

## 2. 能力边界与架构路径选择

### 为什么不能采用传统单一窗口 iframe？
各大 AI 商业网站（ChatGPT、Claude、Gemini 等）设置了严格的安全标头：
```http
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```
前端使用 `<iframe>` 会直接被浏览器内核拦截；同时 `<iframe>` 会造成第三方 Cookie 与 LocalStorage 隔离失效，无法实现同一站点的多账号并存。

### 路径选择：路径 A（多无边框子 WebviewWindow 物理父子嵌入）
Wails v3 的最小窗口单元是 `WebviewWindow`。因此本方案采用**分层物理嵌套机制**：
- **主 Shell 窗口**：仅承载 React 打造的轻量 UI 框架（Header、Tab 栏、右侧控制栏、底栏输入区），工作内容区域开透“视觉开洞”；
- **业务 AI 视口**：均为独立的 `WebviewWindow`，由 Go 窗口管理器精准计算其相对于主窗的逻辑与物理坐标；
- **平台嵌入**：在 Windows 上通过 Win32 API `SetParent` 将子窗口句柄挂载到主窗客户区，并配置 `WS_CHILD | WS_CLIPCHILDREN | WS_EX_NOACTIVATE` 样式，子窗口随主窗口平滑移动、缩放与最小化，视觉上等同于一个完整的统一单窗。

---

## 3. 技术选型与核心依赖

| 模块 | 技术选型 | 说明 |
|---|---|---|
| **桌面框架** | **Wails v3** (`github.com/wailsapp/wails/v3`) | 原生支持多窗口创建、独立 UserDataPath 与事件绑定 |
| **后端语言** | **Go (>= 1.22)** | 跨平台系统调用、窗口树管理、SQLite 存储与全局热键监听 |
| **前端框架** | **React 18 + TypeScript + Vite 5** | 高性能组件化 UI、虚拟 DOM 与响应式状态管理 |
| **样式与动效** | **Tailwind CSS + CSS Variables + Lucide React** | 现代玻璃拟态设计系统、动态主题变量与精美图标库 |
| **Windows API** | `golang.org/x/sys/windows` | 窗口父子挂载 (`SetParent`)、样式变换与全局热键注册 |
| **本地数据库** | `modernc.org/sqlite` (纯 Go，无需 CGO) | 存储 Prompt 库、书签与系统配置，启用 FTS5 全文检索 |

---

## 4. 总体架构与三大窗口模型

### 4.1 窗口角色定义

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Wails v3 核心应用进程 (Go)                       │
│  - WindowManager (窗口树、坐标同步、父子挂载)                           │
│  - HotkeyService (全局热键监听与冲突检测)                               │
│  - ThemeService (材质与外观配置)                                       │
│  - StorageService (SQLite + JSON 配置)                                 │
└──────┬─────────────────────────┬──────────────────────────┬────────────┘
       │                         │                          │
       ▼                         ▼                          ▼
┌──────────────────┐    ┌──────────────────┐     ┌───────────────────────┐
│ 1. 主工作台 Shell │    │ 2. Spotlight 悬浮 │     │ 3. 独立分离窗 Detached │
│ (Frameless 玻璃壳)│    │ (轻量置顶无边框)  │     │ (独立顶层桌面窗口)     │
│ ┌──────────────┐ │    │ ┌──────────────┐ │     │ ┌───────────────────┐ │
│ │ React 外壳 UI│ │    │ │ 极简输入框与 │ │     │ │ 单独承载独立 Web  │ │
│ └──────────────┘ │    │ │ 模型快捷广播 │ │     │ │ 视口 (保留会话/UA)│ │
│ ┌──────────────┐ │    │ └──────────────┘ │     │ └───────────────────┘ │
│ │ 1~4 个业务子 │ │    └──────────────────┘     └───────────────────────┘
│ │ 视口嵌入挂载 │ │
│ └──────────────┘ │
└──────────────────┘
```

1. **`shell` (主工作台)**：
   - 无边框透明外壳窗口，承载 React UI；
   - 包含主工作区（挂载 1~4 个子视口）、右侧全局控制栏、底部 Quick 广播栏与顶部多 Tab；
   - 监听窗口移动与尺寸变化，向子视口同步最新物理坐标。
2. **`spotlight` (极速 AI 悬浮窗)**：
   - 默认尺寸 `720 × 420`，无边框、无任务栏图标、始终置顶（`AlwaysOnTop: true`）；
   - 按全局热键 `Alt+Space` 居中唤出并聚焦；
   - 支持一键广播 Prompt，支持 Pin 钉住，支持一键切换并激活主工作台。
3. **`detached-{id}` (独立分离视口)**：
   - 拥有独立标准或自定义标题栏的桌面顶层窗口；
   - 当用户在主工作台点击“分离视口”时，解除父子挂载关系，将子视口提升为独立窗口，可自由拖曳至副显示器。

### 4.2 窗口间跨窗事件通信总线
采用 Wails v3 的事件系统 `application.Get().Events.Emit(...)` 实现跨窗通信：
- `event:hotkey:spotlight-toggle`：通知悬浮窗显隐；
- `event:theme:change`：向所有已打开的窗口下发主题配色与透明度配置；
- `event:broadcast:send`：从悬浮窗将 Prompt 广播至主工作台所有可见子视口。

---

## 5. 多窗口树与生命周期状态机

### 5.1 窗口唯一标识与路由表

| 窗口标识规则 | 窗口类型 | 生命周期触发 |
|---|---|---|
| `"shell"` | 主工作台 Shell 窗口 | 应用启动时创建，关闭时退出整个应用 |
| `"spotlight"` | 全局极速悬浮窗 | 启动期预建（保持 Hidden），全局热键触发 Show / Hide |
| `"vp-main-{partitionId}"` | 主工作区内嵌视口 | 用户在控制栏添加或切换模型时创建并挂载 |
| `"detached-{partitionId}"` | 独立弹出分离视口 | 用户点击“分离”按钮时从主窗脱离并重构属性 |

### 5.2 子窗口 Show/Hide 缓存池与 LRU 挂起

```
      Create(partitionId, url, rect, ua)
                    │
                    ▼
          ┌───► [ Visible ] ──── 切走/隐藏 ───► [ Hidden 缓存中 ]
          │          │                              │
          │          │ (超过10个 Tab 触发 LRU)        │ 切回
          │          ▼                              ▼
          │    [ Suspended ] ───────────────────────┘
          │    (调用 WebView2 Suspend 释放内存)
          │
          └── 销毁 (用户明确点击关闭 Tab) ──► Destroy() 回收句柄
```

- **页面现场零丢失**：Tab 切换与布局重排只调用 `Window.Hide()`，严禁随意 `Destroy`，后台保留页面滚动位置与未发送草稿；
- **防内存溢出机制**：当打开的 AI 视口累计超过 10 个时，自动将最近最少访问的后台视口调用 WebView2 的 `Suspend()` 接口挂起渲染进程，释放 80% 以上内存，重新切入时瞬间 `Resume()` 唤醒。

### 5.3 Spotlight 悬浮窗唤出与自动收起
- 用户在全局任意处按下 `Alt+Space`：
  1. Go 收到系统热键消息，计算当前鼠标所在显示器的中心坐标；
  2. 调用 `spotlight.SetPosition(centerX, centerY)` 并调用 `spotlight.Show()`、`spotlight.Focus()`；
  3. 前端输入框自动聚焦；
- 失焦自动收起：悬浮窗监听 `WindowUnfocus` 事件。若未处于 Pin（钉住）模式，自动触发 `spotlight.Hide()`。

---

## 6. 全局与应用内快捷键底层实现

### 6.1 Win32 / macOS 全局系统热键注册管道

在 Windows 上通过 Win32 API 注册全局热键并在独立消息循环中监听：

```go
// internal/hotkey/hotkey_windows.go
package hotkey

import (
    "syscall"
    "unsafe"
    "golang.org/x/sys/windows"
)

var (
    user32           = windows.NewLazySystemDLL("user32.dll")
    procRegisterHotKey   = user32.NewProc("RegisterHotKey")
    procUnregisterHotKey = user32.NewProc("UnregisterHotKey")
    procGetMessageW      = user32.NewProc("GetMessageW")
)

const (
    MOD_ALT     = 0x0001
    MOD_CONTROL = 0x0002
    MOD_SHIFT   = 0x0004
    MOD_NOREPEAT= 0x4000
    WM_HOTKEY   = 0x0312
    HOTKEY_SPOTLIGHT_ID = 1001
    HOTKEY_TOGGLE_MAIN  = 1002
)

type HotkeyManager struct {
    hwnd windows.Handle
    handlers map[int]func()
}

func (h *HotkeyManager) RegisterGlobal(id int, mod uint32, vk uint32, callback func()) error {
    r1, _, err := procRegisterHotKey.Call(
        uintptr(h.hwnd),
        uintptr(id),
        uintptr(mod|MOD_NOREPEAT),
        uintptr(vk),
    )
    if r1 == 0 {
        return err // 热键可能已被占用
    }
    h.handlers[id] = callback
    return nil
}

func (h *HotkeyManager) StartEventLoop() {
    go func() {
        var msg struct {
            Hwnd    syscall.Handle
            Message uint32
            Wparam  uintptr
            Lparam  uintptr
            Time    uint32
            Pt      struct{ X, Y int32 }
        }
        for {
            ret, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&msg)), 0, 0, 0)
            if int32(ret) <= 0 {
                break
            }
            if msg.Message == WM_HOTKEY {
                id := int(msg.Wparam)
                if fn, ok := h.handlers[id]; ok {
                    fn()
                }
            }
        }
    }()
}
```

### 6.2 前端上下文快捷键分发调度器

在 React 根层挂载全局键盘监听事件（`window.addEventListener('keydown')`）：

```typescript
// frontend/src/keyboard.ts
export function registerInAppShortcuts(handlers: {
  onLayoutSwitch: (layout: string) => void;
  onBroadcastSend: () => void;
  onNewTab: () => void;
  onCloseTab: () => void;
  onToggleDrawer: () => void;
  onOpenSettings: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent) => {
    // 忽略原生输入框内部正在编辑文字时的特定按键
    const inInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
    
    if (e.ctrlKey && !e.shiftKey && !e.altKey) {
      switch (e.key) {
        case '1': e.preventDefault(); handlers.onLayoutSwitch('single'); break;
        case '2': e.preventDefault(); handlers.onLayoutSwitch('split2'); break;
        case '3': e.preventDefault(); handlers.onLayoutSwitch('grid4'); break;
        case '4': e.preventDefault(); handlers.onLayoutSwitch('col4'); break;
        case 't': case 'T': e.preventDefault(); handlers.onNewTab(); break;
        case 'w': case 'W': e.preventDefault(); handlers.onCloseTab(); break;
        case '\\': e.preventDefault(); handlers.onToggleDrawer(); break;
        case ',': e.preventDefault(); handlers.onOpenSettings(); break;
        case 'Enter':
          e.preventDefault();
          handlers.onBroadcastSend();
          break;
      }
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
```

---

## 7. 窗口风格与现代皮肤定制系统

### 7.1 无边框外壳与 OS 原生材质融合

- **Windows 11 Mica / Acrylic 支持**：
  在 Go 侧调用 `DwmSetWindowAttribute` 开启深层材质：
  ```go
  const (
      DWMWA_SYSTEMBACKDROP_TYPE = 38
      DWMSBT_TRANSIENTWINDOW    = 3 // Acrylic
      DWMSBT_TABBEDWINDOW       = 4 // Mica Alt
  )
  ```
- **CSS 变量驱动的高性能主题引擎**：
  React 壳通过给根节点注入 `data-theme` 属性与内联 Style 变量，所有边框、文字、阴影和背景全量响应。

### 7.2 6 款预设皮肤主题 Token 与 CSS 变量映射

```css
/* frontend/src/styles/theme.css */
:root {
  --window-opacity: 0.85;
  --blur-amount: 20px;
  --radius-window: 10px;
}

[data-theme="Dark Obsidian"] {
  --bg-primary: rgba(18, 18, 24, var(--window-opacity));
  --bg-panel: rgba(26, 26, 36, 0.75);
  --border-glow: rgba(255, 255, 255, 0.08);
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --accent: #3b82f6;
}

[data-theme="Light Pure"] {
  --bg-primary: rgba(248, 250, 252, var(--window-opacity));
  --bg-panel: rgba(255, 255, 255, 0.8);
  --border-glow: rgba(0, 0, 0, 0.06);
  --text-main: #0f172a;
  --text-muted: #64748b;
  --accent: #2563eb;
}

[data-theme="Cyberpunk Neon"] {
  --bg-primary: rgba(13, 10, 26, var(--window-opacity));
  --bg-panel: rgba(23, 18, 43, 0.75);
  --border-glow: rgba(6, 182, 212, 0.3);
  --text-main: #ec4899;
  --text-muted: #06b6d4;
  --accent: #06b6d4;
}

[data-theme="Midnight Blue"] {
  --bg-primary: rgba(15, 23, 42, var(--window-opacity));
  --bg-panel: rgba(30, 41, 59, 0.75);
  --border-glow: rgba(56, 189, 248, 0.15);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent: #38bdf8;
}

[data-theme="Sunset Glow"] {
  --bg-primary: rgba(28, 18, 24, var(--window-opacity));
  --bg-panel: rgba(43, 27, 36, 0.75);
  --border-glow: rgba(249, 115, 22, 0.18);
  --text-main: #fff7ed;
  --text-muted: #fdba74;
  --accent: #f97316;
}

[data-theme="Forest Sage"] {
  --bg-primary: rgba(14, 24, 20, var(--window-opacity));
  --bg-panel: rgba(22, 38, 31, 0.75);
  --border-glow: rgba(16, 185, 129, 0.15);
  --text-main: #ecfdf5;
  --text-muted: #6ee7b7;
  --accent: #10b981;
}
```

---

## 8. 窗口尺寸预设与全分辨率兼容引擎

### 8.1 常用分辨率预设规格矩阵

```typescript
export interface WindowPreset {
  key: string;
  name: string;
  category: '1080P' | '2K' | '4K' | 'Ultrawide' | 'Laptop';
  width: number;
  height: number;
  defaultLayout: 'single' | 'split2' | 'grid4' | 'col4';
}

export const RESOLUTION_PRESETS: WindowPreset[] = [
  // 1080P 体系
  { key: '1080p-compact', name: '1080P 紧凑便携 (1280×800)', category: '1080P', width: 1280, height: 800, defaultLayout: 'split2' },
  { key: '1080p-standard', name: '1080P 标准舒适 (1440×900)', category: '1080P', width: 1440, height: 900, defaultLayout: 'split2' },
  { key: '1080p-fullscreen', name: '1080P 全屏铺满 (1920×1080)', category: '1080P', width: 1920, height: 1080, defaultLayout: 'grid4' },

  // 2K 体系
  { key: '2k-golden', name: '2K 黄金比例 (1600×1000)', category: '2K', width: 1600, height: 1000, defaultLayout: 'grid4' },
  { key: '2k-wide', name: '2K 宽屏视野 (1920×1200)', category: '2K', width: 1920, height: 1200, defaultLayout: 'grid4' },
  { key: '2k-fullscreen', name: '2K 全屏沉浸 (2560×1440)', category: '2K', width: 2560, height: 1440, defaultLayout: 'grid4' },

  // 4K 体系
  { key: '4k-retina', name: '4K 视网膜预设 (2560×1600)', category: '4K', width: 2560, height: 1600, defaultLayout: 'grid4' },
  { key: '4k-fullscreen', name: '4K 终极全屏 (3840×2160)', category: '4K', width: 3840, height: 2160, defaultLayout: 'col4' },

  // 21:9 & 32:9 超宽带鱼屏
  { key: 'ultrawide-standard', name: '21:9 带鱼宽列 (2560×1080)', category: 'Ultrawide', width: 2560, height: 1080, defaultLayout: 'col4' },
  { key: 'ultrawide-3440', name: '21:9 大带鱼超宽 (3440×1200)', category: 'Ultrawide', width: 3440, height: 1200, defaultLayout: 'col4' },
  { key: 'super-ultrawide-5120', name: '32:9 全景超级带鱼 (5120×1440)', category: 'Ultrawide', width: 5120, height: 1440, defaultLayout: 'col4' },

  // 笔记本小屏
  { key: 'laptop-small', name: '笔记本便携 (1200×720)', category: 'Laptop', width: 1200, height: 720, defaultLayout: 'single' }
];
```

### 8.2 智能抗折叠动态缩放算法 (Anti-Folding Dynamic Zoom)

针对窄屏/四宫格下 AI 页面识别为手机端折叠的问题，React 布局引擎自动计算并下发动态缩放因子：

```typescript
// frontend/src/layout.ts
export function calculateZoomFactor(logicalViewportWidth: number): number {
  const DESKTOP_MIN_WIDTH = 850; // AI 站点桌面级排版警戒线
  if (logicalViewportWidth >= DESKTOP_MIN_WIDTH) {
    return 1.0;
  }
  // 线性压缩页面比例，下限锁定 0.75 防止文字过小
  const computedZoom = logicalViewportWidth / DESKTOP_MIN_WIDTH;
  return Math.max(0.75, Math.round(computedZoom * 100) / 100);
}
```

前端将 `zoomFactor` 随矩形 Bounds 一并同步至 Go 侧，Go 在 WebView2 控制器上执行动态缩放：
```go
// Windows 侧调用 ICoreWebView2Controller::put_ZoomFactor
child.Window.SetZoom(zoomFactor)
```

### 8.3 高分屏 DPI 转换与跨显示器切换 (Per-Monitor DPI Aware v2)

1. **逻辑转物理像素**：
   $$\text{PhysicalX} = \text{Math.round}(\text{LogicalX} \times \text{DPR})$$
   $$\text{PhysicalW} = \text{Math.round}(\text{LogicalW} \times \text{DPR})$$
2. **`WM_DPICHANGED` 事件校准**：
   当主窗口被用户跨屏拖动到拥有不同缩放比例（例如 150% -> 100%）的显示器时：
   - Win32 拦截 `WM_DPICHANGED`；
   - 通知前端重新提取 `window.devicePixelRatio`；
   - 前端触发 `ResizeObserver` 回调，下发最新物理像素 Bounds，子窗口无缝重排，彻底根除高分屏漂移与黑边。

### 8.4 多显示器边界校验与防幽灵窗口机制

在应用初始化与恢复窗口尺寸时，Go 后端调用 Win32 `EnumDisplayMonitors` 枚举当前有效物理显示器矩形：
```go
func ValidateAndClampBounds(savedX, savedY, savedW, savedH int) (int, int, int, int) {
    monitors := GetAllActiveMonitors()
    isInsideAnyMonitor := false
    for _, m := range monitors {
        if savedX >= m.Left && savedX < m.Right && savedY >= m.Top && savedY < m.Bottom {
            isInsideAnyMonitor = true
            break
        }
    }
    // 若原显示器已断开（如拔掉外接屏），自动回退至主屏幕中央
    if !isInsideAnyMonitor {
        primary := GetPrimaryMonitor()
        targetW := min(savedW, primary.Width-100)
        targetH := min(savedH, primary.Height-100)
        centerX := primary.Left + (primary.Width-targetW)/2
        centerY := primary.Top + (primary.Height-targetH)/2
        return centerX, centerY, targetW, targetH
    }
    return savedX, savedY, savedW, savedH
}
```

---

## 9. 平台原生窗口挂载实现

### 9.1 Windows 实现
通过 Win32 API 完成父子窗口挂载：
```go
// internal/windowmanager/platform_windows.go
func attachToShell(child, shell *application.WebviewWindow) error {
    chwnd := windows.Handle(child.HWND())
    shwnd := windows.Handle(shell.HWND())

    // 1. 设置主窗口为父级
    procSetParent.Call(uintptr(chwnd), uintptr(shwnd))

    // 2. 注入 WS_CHILD 样式与 WS_CLIPCHILDREN
    style, _, _ := procGetWindowLongW.Call(uintptr(chwnd), gwlStyle)
    style |= wsCHILD | wsCLIPCHILDREN
    procSetWindowLongW.Call(uintptr(chwnd), gwlStyle, style)

    // 3. 注入 WS_EX_NOACTIVATE 避免点击内容区导致主窗失去外框焦点
    exStyle, _, _ := procGetWindowLongW.Call(uintptr(chwnd), gwlExstyle)
    exStyle |= wsEXNOACTIVATE
    procSetWindowLongW.Call(uintptr(chwnd), gwlExstyle, exStyle)

    // 4. 应用样式并刷新
    procSetWindowPos.Call(
        uintptr(chwnd), 0,
        0, 0, 0, 0,
        swpNOMOVE | swpNOSIZE | swpNOZORDER | swpFRAMECHANGE | swpSHOWWINDOW,
    )
    return nil
}
```

### 9.2 macOS 实现
借助 Cocoa 运行时 API 建立子窗口关联：
```go
// internal/windowmanager/platform_darwin.go
func attachToShell(child, shell *application.WebviewWindow) error {
    cs := cocoa.NSWindow{Ptr: shell.NSWindowPtr()}
    cc := cocoa.NSWindow{Ptr: child.NSWindowPtr()}
    cs.AddChildWindow(cc, cocoa.NSWindowAbove)
    return nil
}
```

---

## 10. 会话持久化与反风控伪装

1. **会话物理隔离**：
   为每个 Tab 分配独立的 `UserDataPath` 文件夹：
   `%APPDATA%/Noi/sessions/<partition-id>/`
   确保 ChatGPT、Claude 等站点的多账号同屏登录互不冲突，重启后 Cookie 永久有效。
2. **反风控与 UA 清洗**：
   统一伪装标准 Chrome 桌面版 UA，并在 Preload 中抹除自动化测试特征：
   ```javascript
   Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
   ```
   稳定通过 Cloudflare 5 秒盾与 Google 403 拦截。
3. **OAuth 授权弹窗闭环**：
   拦截第三方 OAuth 弹窗（Google / Apple），在同分区内弹出受控模态窗口，授权完成后自动关闭，主视口实时同步登录状态。

---

## 11. Prompt 跨站点注入与一键广播引擎

通过 Go 遍历当前可见子视口，并发调用 `ExecuteJavaScript(injectScript)`：
- 适配各类非标准富文本编辑器（ChatGPT ContentEditable / Claude ProseMirror / Gemini Quill / DeepSeek Textarea）；
- 自动触发合成键盘与 Input 事件并自动点击发送按钮；
- 悬浮窗与主底栏一键联动广播。

---

## 12. 工程目录与关键源文件骨架

```
aimux/
├─ main.go                             # Wails v3 应用入口，装配服务与全局热键
├─ go.mod / wails.json
├─ docs/                               # 完整设计与规范文档
│  ├─ requirements_and_design_spec.md
│  ├─ implementation.md
│  └─ implementation_plan.md
├─ internal/
│  ├─ config/                          # noi.config.json 读写管理
│  │  └─ config.go
│  ├─ hotkey/                          # 全局系统热键注册与事件循环
│  │  ├─ hotkey.go
│  │  ├─ hotkey_windows.go
│  │  └─ hotkey_darwin.go
│  ├─ resolution/                      # 显示器枚举、防幽灵窗口与分辨率预设
│  │  ├─ dpi.go
│  │  └─ dpi_windows.go
│  ├─ theme/                           # Mica / Acrylic 材质与主题配置
│  │  └─ theme.go
│  ├─ windowmanager/                   # Shell / Spotlight / Detached 窗口树管理
│  │  ├─ manager.go
│  │  ├─ platform_windows.go
│  │  └─ platform_darwin.go
│  ├─ storage/                         # SQLite 嵌入式存储与 FTS5 引擎
│  │  └─ db.go
│  └─ services/                        # Wails 暴露给前端的业务服务
│     ├─ tab_service.go
│     ├─ config_service.go
│     └─ prompt_service.go
└─ frontend/                           # React + Vite + TypeScript 前端
   ├─ package.json / vite.config.ts / tailwind.config.js
   └─ src/
      ├─ main.tsx
      ├─ App.tsx                       # 主工作台 Shell 根组件
      ├─ SpotlightApp.tsx              # Spotlight 极速悬浮窗根组件
      ├─ keyboard.ts                   # 应用内快捷键监听与调度器
      ├─ layout.ts                     # 1~4 视口网格布局与 Anti-Folding Zoom 计算
      ├─ bridge.ts                     # Wails Go Bindings 封装
      ├─ styles/
      │  ├─ index.css
      │  └─ theme.css                  # 6 款预设皮肤与 CSS 变量 Token
      └─ components/
         ├─ Header.tsx                 # 标题栏、窗口拖拽区、尺寸预设下拉
         ├─ TabBar.tsx                 # 视口 Tab 管理
         ├─ ViewportGrid.tsx           # 1~4 视口开洞占位与可拖拽 Splitter
         ├─ RightControlBar.tsx        # 核心枢纽：布局模式、AI 组合、皮肤换色
         ├─ BottomBroadcastBar.tsx     # 一键 Prompt 四发广播栏
         ├─ SettingsModal.tsx          # 综合设置中心（快捷键录制、皮肤、数据清理）
         └─ Spotlight.tsx              # 悬浮窗快速输入组件
```

---

## 13. 风险应对与已知坑降级策略

| 风险场景 | 现象表现 | 解决方案与降级策略 |
|---|---|---|
| **全局热键被抢占** | 注册 `Alt+Space` 返回已被占用 | 启动时检测注册结果；若失败自动回退至 `Ctrl+Shift+Space`，并在状态栏显示黄色警告引导用户去设置中心重设。 |
| **小屏 4 宫格排版折叠** | AI 页面宽度 < 768px 变为手机端窄排版 | 启用 **Anti-Folding Zoom** 动态缩放（0.75~0.85），强制页面内部可视等效宽度 $\ge 850\text{px}$。 |
| **拔掉外接显示器** | 窗口在新启动时出现在黑屏区域（幽灵窗口） | 启动时调用 `ValidateAndClampBounds`，若原坐标不在当前有效显示器矩形内，强制安全回退至主屏居中。 |
| **Windows 输入法浮窗偏移** | `WS_CHILD` 下某些第三方输入法候选框定位偏移 | 备选降级方案：子窗不挂 `SetParent`，保持原生顶层无边框窗口，由 Go 在主窗移动/激活时通过 `SetWindowPos` 严格同步位置与 Z 序。 |

---

## 14. 工程验收指标与验证流程

1. **快捷键与悬浮窗**：
   - 按下 `Alt+Space`，极速悬浮窗能在 150ms 内平滑居中弹出并聚焦输入框；
   - 按下 `Ctrl+1~4`，主工作区在 100ms 内瞬间完成 1~4 视口布局平铺切换；
   - 快捷键在设置中心支持自由录制并即刻生效。
2. **皮肤与视觉效果**：
   - 6 套预设主题自由切换，背景、边框、按钮颜色同步响应，无闪烁；
   - 调节透明度与模糊度滑块，毛玻璃效果平滑过渡。
3. **全分辨率与尺寸兼容**：
   - 切换 1080P/2K/4K/带鱼屏常见预设尺寸，窗口平滑居中调整；
   - 1080P 屏幕下开启四宫格，各 AI 视口排版保持桌面端完整呈现，不发生手机端抽屉折叠。
4. **会话持久化与一键广播**：
   - 关闭应用重启后，所有已登录的 AI 站点 Cookie 依然有效，免重复登录；
   - 在底栏或悬浮窗输入 Prompt 并按 `Ctrl+Enter`，同屏所有活跃视口均自动填充并提交应答。
