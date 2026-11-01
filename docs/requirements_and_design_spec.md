# 桌面级多 AI 视角工作台（Modern AI Workspace）需求与设计规范文档

> 本文档基于对 Noi 项目架构与特性的深度分析，结合定制化的选型决策（**Go + Wails v3 + React + Modern UI + 混合存储**），为开发一款高性能、高颜值、轻量化、支持多窗口架构（主工作台 + 全局极速悬浮窗 + 独立分离窗）、支持全局快捷键唤出、具备完整皮肤/窗口尺寸定制与全分辨率自适应能力的多 AI 视角桌面工作台软件提供全方位的需求规格与系统设计路线。

---

## 目录

1. [项目概述与产品定位](#1-项目概述与产品定位)
   - 1.1 产品愿景
   - 1.2 核心价值主张
   - 1.3 核心交互形态（主工作台 + 全局悬浮窗 + 独立分离窗）
2. [技术选型决策：为什么选择 Wails v3 而非 Wails v2？](#2-技术选型决策为什么选择-wails-v3-而非-wails-v2)
3. [用户需求与核心功能规格 (PRD)](#3-用户需求与核心功能规格-prd)
   - 3.1 多视口同屏呈现规格（1 ~ 4 视口支持）
   - 3.2 全局与应用内快捷键系统规格（Hotkey System）
   - 3.3 窗口风格与个性化皮肤系统（Theme & Skin System）
   - 3.4 窗口大小设置与全分辨率兼容规格（Resolution & High-DPI Matrix）
   - 3.5 核心功能矩阵表
4. [系统技术架构与多窗口挂载设计](#4-系统技术架构与多窗口挂载设计)
   - 4.1 总体多窗口拓扑架构路线
   - 4.2 操作系统原生窗口挂载策略（Parent-Child Window Parenting）
   - 4.3 全局快捷键底层引擎与跨平台事件调度
5. [同屏布局算法与高分屏生命周期管理](#5-同屏布局算法与高分屏生命周期管理)
   - 5.1 同屏 1~4 视口布局算法与像素换算
   - 5.2 DPI 高分屏物理坐标映射与跨屏迁移（Per-Monitor DPI Aware v2）
   - 5.3 智能抗折叠动态缩放算法（Anti-Folding Dynamic Zoom）
   - 5.4 Tab 生命周期与 Show/Hide 内存缓存与 LRU 挂起防爆
6. [会话持久化、OAuth 弹窗与风控对抗规范](#6-会话持久化oauth-弹窗与风控对抗规范)
   - 6.1 基于独立 UserDataPath 的 Cookie 物理隔离与持久化
   - 6.2 第三方 OAuth 登录弹窗（Google/Apple）闭环拦截
   - 6.3 反爬虫与风控对抗（绕过 Google 403 与 Cloudflare 验证）
7. [Prompt 跨站点注入与一键广播机制](#7-prompt-跨站点注入与一键广播机制)
   - 7.1 主流 AI 厂商输入框适配与自动化注入
   - 7.2 一键广播并发执行策略
8. [数据持久化与配置模型设计](#8-数据持久化与配置模型设计)
   - 8.1 完整配置文件 Schema (`config.json`)
   - 8.2 本地 SQLite 数据库与 FTS5 检索引擎
9. [UI 设计系统与视觉交互路线](#9-ui-设计系统与视觉交互路线)
   - 9.1 Modern Glassmorphism 现代玻璃拟态视觉
   - 9.2 响应式拖拽分栏与实时光晕反馈
   - 9.3 右侧全局控制栏核心枢纽
10. [阶段实施路线与验收指标](#10-阶段实施路线与验收指标)
    - 10.1 阶段实施里程碑
    - 10.2 细粒度验收指标与测试矩阵

---

## 1. 项目概述与产品定位

### 1.1 产品愿景
打造一款**轻量化、高颜值、本地优先、支持 1~4 视口同屏并发与全局快捷呼出**的多 AI 厂商协同桌面工作台。解决用户在多个 AI 网页服务（如 ChatGPT, Claude, Gemini, DeepSeek, Perplexity, Kimi 等）之间频繁切换标签页、登录态冲突、提示词复用成本高、低分辨率下排版折叠错乱以及缺乏快速调用入口的问题。

### 1.2 核心价值主张
- **混合多窗口形态**：提供“主工作台（沉浸式 1~4 视口分栏）+ 全局快捷键呼出极速悬浮窗（Spotlight 风格随时提问/广播）+ 独立分离窗（副屏独立办公）”的完整多窗能力。
- **全局与应用内快捷键生态**：支持全局系统级热键后台极速唤出，支持应用内单手流快捷切换视口、新建/关闭 Tab 与一键四发广播。
- **高颜值 Modern 皮肤中心**：无边框设计、Windows Mica/Acrylic 材质融合、预设 6 款精选主题皮肤、强调色自定义与窗口透明度/模糊度自由调节。
- **全分辨率与高分屏无缝兼容**：内置 1080P/2K/4K/带鱼屏常见规格一键设置；搭载智能抗折叠动态缩放算法，彻底根除 4 宫格或小屏下 AI 页面自动变为手机窄屏抽屉的顽疾。
- **一键 Prompt 广播（Multi-Send）**：在底部或悬浮窗输入一段问题，同时并发派发给屏幕上可见的全部 1~4 个 AI 模型并自动触发提交。
- **物理级会话隔离与持久化登录**：每个 Tab 采用独立的原生 WebView 实例，使用独立的磁盘目录保存 Cookie/Session 与真实 Chrome UA 伪装，规避账号冲突与风控封禁。
- **极致轻量**：使用宿主系统原生 WebView2 / WKWebView，剥离打包 Chromium 的百兆体积与重型开销。

### 1.3 核心交互形态（三大窗口协同）

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. 主工作台 (Shell Window)                       │
│  - 沉浸式多 AI 协同面板，支持 1/2/4 视口网格布局与拖拽分栏                 │
│  - 右侧全局控制栏 + 底部 Prompt 广播栏 + 顶部多 Tab 管理                  │
└────────────────────────────────────────────────────────────────────────┘
          ▲                                       ▲
          │ 快捷键激活 / 转为主窗口                │ 视口分离 (Detach)
          ▼                                       ▼
┌──────────────────────────────────┐    ┌────────────────────────────────┐
│ 2. 全局极速悬浮窗 (Spotlight)     │    │ 3. 独立分离视口 (Detached)      │
│ - 全局快捷键 (Alt+Space) 居中唤出 │    │ - 支持将任一 AI 视口独立弹出    │
│ - 极简输入框 + 常用模型勾选      │    │ - 自由拖拽至副显示器或单独全屏 │
│ - 失焦自动隐藏 / Pin 锁定置顶     │    │ - 独立维护 Session 与 Zoom     │
└──────────────────────────────────┘    └────────────────────────────────┘
```

---

## 2. 技术选型决策：为什么选择 Wails v3 而非 Wails v2？

在框架选型初期，针对 **Wails v2** 与 **Wails v3** 进行了严谨的技术验证，**明确否定 Wails v2，全量选定 Wails v3**。决策依据如下：

| 对比维度 | Wails v2（不可行 ❌） | Wails v3（已选定方案 ✅） | 选型影响与结论 |
|---|---|---|---|
| **窗口体系** | **严格单窗口（Single Window）**，整个 App 仅允许一个 `options.App` 窗口。 | **多窗口（Multi-Window）为一等公民**，通过 `app.Window.NewWithOptions` 自由构建多窗。 | v2 无法挂载多个独立 Webview 与全局悬浮窗，架构直接受阻；v3 天然支持主窗+悬浮窗+分离窗。 |
| **网页嵌入方式** | 只能在 React 内使用 `<iframe>` 标签。 | 主窗只做透明外壳，每个业务 Webview 作为**独立的无边框子窗口（Child Window）**物理挂载。 | AI 网站均配置 `X-Frame-Options: DENY` 和 CSP `frame-ancestors 'none'`，在 `<iframe>` 中必然加载失败；v3 顶层容器可完美加载。 |
| **会话/登录隔离** | 全局共享单一默认 WebView2 数据目录，无法切分。 | 每个 `WebviewWindow` 支持独立配置 **`UserDataPath`**。 | v2 无法实现多账号登录隔离；v3 可以在物理磁盘上彻底隔离各 Tab 的 Cookie 与缓存。 |
| **User-Agent 设置** | 全局静态，无法按窗口定制。 | 支持每个窗口独立调用 **`SetUserAgent(ua)`**。 | 必须为不同站点动态伪装真实 Chrome 桌面 UA 以绕过 Google 403 封锁，v3 具备原生 API。 |
| **OAuth 弹窗拦截** | 弹窗跳转不受控，常抛给外部系统浏览器导致登录闭环断裂。 | 支持细粒度拦截与弹窗生命周期管理，继承相同 Session 分区。 | 登录 Google/Apple 账号时必须在内部同分区弹窗完成授权，v3 拥有完整的事件支持。 |
| **全局快捷键支持** | 无内置全局热键能力，需引入重量级外部 CGO 依赖。 | Wails v3 原生提供应用级与系统级快捷键注册接口。 | 支持轻量级原生全局热键唤起 Spotlight 悬浮窗与主窗口。 |

---

## 3. 用户需求与核心功能规格 (PRD)

### 3.1 多视角同屏呈现规格（1 ~ 4 视口支持）

系统必须支持在主工作区（Main Content Area）内动态挂载并同屏显示 **1 到 4 个** 原生 WebView 视口，并提供以下预设布局：

```
1. 单视角全屏 (1 View)           2. 双视角左右分栏 (2 Views, 50/50)
┌──────────────────────────────┐ ┌──────────────┬──────────────┐
│                              │ │              │              │
│       主工作区 100%          │ │  视口 A 50%  │  视口 B 50%  │
│                              │ │              │              │
└──────────────────────────────┘ └──────────────┴──────────────┘

3. 四宫格并排 (4 Views, 2x2)     4. 带鱼屏四列并排 (4 Views, 1x4)
┌──────────────┬──────────────┐ ┌──────┬──────┬──────┬──────┐
│  视口 1      │  视口 2      │ │ 视口 │ 视口 │ 视口 │ 视口 │
│  (左上)      │  (右上)      │ │  1   │  2   │  3   │  4   │
├──────────────┼──────────────┤ │ 25%  │ 25%  │ 25%  │ 25%  │
│  视口 3      │  视口 4      │ │      │      │      │      │
│  (左下)      │  (右下)      │ │      │      │      │      │
└──────────────┴──────────────┘ └──────┴──────┴──────┴──────┘

5. 主辅工作台 (4 Views, 1大+3小)
┌─────────────────────┬────────┐
│                     │ 视口 2 │
│                     ├────────┤
│     视口 1 (主力)   │ 视口 3 │
│     (占比 60% 宽)   ├────────┤
│                     │ 视口 4 │
└─────────────────────┴────────┘
```

#### 视口规格要求：
1. **灵活组合**：支持用户在右侧控制栏自由勾选当前同屏激活的 1~4 个 AI 模型（如：ChatGPT + Claude + DeepSeek + Gemini）；
2. **比例拖拽调宽**：多视口之间的分割线支持鼠标按住拖拽，实时动态重新计算各视口像素 Bounds；
3. **独立状态**：同屏显示的每个视口拥有独立的缩放比例（Zoom Factor）、独立刷新按钮、后退/前进导航控制以及独立的 User-Agent；
4. **一键视口分离**：视口右上角具备“分离”图标按钮，点击后即可将该视口从主窗口剥离为独立的桌面窗口，便于在副显示器全屏展示。

---

### 3.2 全局与应用内快捷键系统规格（Hotkey System）

系统提供两层快捷键架构：**操作系统级全局快捷键（Global Hotkeys）** 与 **应用窗口内上下文快捷键（In-App Shortcuts）**，并支持用户在设置中自定义热键组合。

#### 1. 全局系统级快捷键（后台/未聚焦时亦可触发）

| 默认全局快捷键 | 作用说明 | 行为逻辑 |
|---|---|---|
| `Alt + Space` (或 `Ctrl + Shift + Space`) | **唤出 / 隐藏 AI 极速悬浮窗 (Spotlight)** | 在当前鼠标所在屏幕中央弹出轻量悬浮输入框，自动获取焦点；若已显示则隐藏。 |
| `Ctrl + Shift + W` | **显示 / 最小化主工作台** | 无论应用处于后台何处，一键将主工作台置顶并恢复显示；若主工作台已处于最前则最小化。 |
| `Ctrl + Shift + B` | **快速一键广播剪贴板内容** | 自动读取系统剪贴板文本，向当前主工作台所有可见 AI 视口立即广播发送并提交。 |

#### 2. 应用内上下文快捷键（在应用激活聚焦时生效）

| 分类 | 默认快捷键 | 功能描述 |
|---|---|---|
| **视口布局** | `Ctrl + 1` | 切换为单视角全屏模式 (1 View) |
| | `Ctrl + 2` | 切换为左右双视口分栏模式 (2 Views, 50/50) |
| | `Ctrl + 3` | 切换为四宫格布局模式 (4 Views, 2×2) |
| | `Ctrl + 4` | 切换为超宽带鱼屏四列并排模式 (4 Views, 1×4) |
| | `Ctrl + 5` | 切换为主辅 1大+3小 布局模式 |
| **Tab 标签管理** | `Ctrl + T` | 在当前激活面板新建一个 AI 视口 Tab |
| | `Ctrl + W` | 关闭当前激活的 Tab |
| | `Ctrl + Tab` | 轮换激活下一个 Tab 视口 |
| | `Ctrl + Shift + Tab` | 轮换激活上一个 Tab 视口 |
| | `Ctrl + R` / `F5` | 刷新当前激活视口页面 |
| **Prompt 与广播** | `Ctrl + Enter` | 在底部输入框或悬浮窗触发**一键四发广播 (Multi-Send)** |
| | `Ctrl + Shift + P` | 唤出本地 Prompt 知识库抽屉与快速检索 |
| | `Esc` | 关闭当前抽屉 / 退出全屏 / 关闭非钉住悬浮窗 |
| **界面与设置** | `Ctrl + \` | 折叠 / 展开右侧全局控制栏 |
| | `Ctrl + ,` | 快速呼出系统设置中心（皮肤/快捷键/窗口预设/数据清理） |
| | `Ctrl + +` / `Ctrl + -` | 增大 / 减小当前激活视口的缩放比例 (Zoom In/Out) |
| | `Ctrl + 0` | 重置当前视口缩放比例至默认推荐值 |

#### 3. 快捷键冲突检测与录制组件
- 设置中心提供图形化 **Hotkey Recorder**（快捷键录制器）组件；
- 录制时自动校验修饰键（`Ctrl` / `Alt` / `Shift` / `Meta`）的有效性，并实时检测与操作系统保留键（如 `Ctrl+Alt+Del`）及已有热键的冲突。

---

### 3.3 窗口风格与个性化皮肤系统（Theme & Skin System）

软件采用 **Modern Glassmorphism（现代玻璃拟态）** 视觉语言，结合操作系统底层原生材质，打造轻透、现代、低审美疲劳的生产力工作台。

#### 1. 窗口外框风格（Window Frame Styles）
- **Frameless Modern（现代极简无边框）**：去除 OS 原生厚重标题栏，采用定制化轻量毛玻璃 Header，包含窗口拖拽区、自定义最小化/最大化/关闭按钮以及置顶 Pin 开关；
- **原生材质联动**：
  - **Windows 11**：自动启用 **Mica**（云母）或 **Acrylic**（亚克力）深层桌面材质，窗口边缘呈现微妙环境光反射；
  - **Windows 10**：采用基于 `DwmEnableBlurBehindWindow` 的高斯模糊背板与 `1px` 半透明浅色边框；
  - **macOS**：启用系统原生 `NSVisualEffectView`（Vibrancy）毛玻璃特效。

#### 2. 预设精选主题皮肤（Preset Themes）
系统内置 6 款高水准设计师调色皮肤，支持一键切换并自动联动各面板与 UI 控件：

| 主题名称 | 风格定位 | 背景底色与渐变 | 主强调色 (Accent) | 边框与发光样式 |
|---|---|---|---|---|
| **1. Dark Obsidian (经典黑曜)** | 专注深沉暗黑 | `rgba(18, 18, 24, 0.82)` | `#3B82F6` (科技蓝) | `rgba(255, 255, 255, 0.08)` 细腻微边框 |
| **2. Light Pure (轻灵纯白)** | 极简清新亮色 | `rgba(248, 250, 252, 0.85)` | `#2563EB` (深宝蓝) | `rgba(0, 0, 0, 0.06)` 柔和阴影 |
| **3. Cyberpunk Neon (赛博霓虹)** | 极客电竞酷炫 | `rgba(13, 10, 26, 0.88)` | `#06B6D4` (青) / `#EC4899` (粉) | 青粉双色渐变发光外轮廓 |
| **4. Midnight Blue (极夜深海)** | 商务优雅沉稳 | `rgba(15, 23, 42, 0.84)` | `#38BDF8` (天蓝色) | `rgba(56, 189, 248, 0.15)` 幽蓝弱光 |
| **5. Sunset Glow (暮色落日)** | 温暖艺术微光 | `rgba(28, 18, 24, 0.85)` | `#F97316` (珊瑚橘) | `rgba(249, 115, 22, 0.18)` 暖橘渐变 |
| **6. Forest Sage (深林苍翠)** | 护眼自然静谧 | `rgba(14, 24, 20, 0.85)` | `#10B981` (翡翠绿) | `rgba(16, 185, 129, 0.15)` 墨绿微光 |

#### 3. 皮肤个性化深度调节参数
除预设主题外，设置中心提供全量滑块与拾色器：
- **主题基色模式**：深色模式 (Dark) / 浅色模式 (Light) / 跟随操作系统 (Auto)；
- **强调色 (Accent Color)**：提供色板预设 + HEX/RGB 自由拾色器；
- **窗口透明度 (Window Opacity)**：`70% ~ 100%` 平滑可调；
- **毛玻璃模糊度 (Backdrop Blur)**：`0px ~ 40px` 可调（低性能设备可降至 `0px` 纯色以节省 GPU 开销）；
- **边框圆角弧度 (Border Radius)**：`4px ~ 16px` 可调，自由选择硬朗直角或圆润柔和风。

---

### 3.4 窗口大小设置与全分辨率兼容规格（Resolution & High-DPI Matrix）

桌面应用必须在从 **13 英寸 1080P 笔记本高缩放屏** 到 **4K 专业屏** 及 **32:9 超宽带鱼屏** 之间自适应，确保多视口排版整齐，不触发移动端抽屉折叠。

#### 1. 常用屏幕分辨率矩阵与标准预设窗口尺寸

| 目标分辨率规格 | 典型宽高 | 推荐常用窗口尺寸预设 (W × H) | 推荐多视口布局模式 |
|---|---|---|---|
| **1080P FHD** | 1920 × 1080 | 1) `1280 × 800` (便携紧凑)<br>2) `1440 × 900` (舒适居中)<br>3) `1920 × 1080` (全屏) | 单视角、双视角 (50/50)。<br>开启四宫格时自动启用视口 Zoom 0.78。 |
| **2K QHD** | 2560 × 1440 | 1) `1600 × 1000` (黄金比例)<br>2) `1920 × 1200` (宽屏视野)<br>3) `2560 × 1440` (全屏) | 黄金四宫格 (2×2)、主辅工作台 (1大+3小)。 |
| **4K UHD** | 3840 × 2160 | 1) `2560 × 1600` (Retina 视网膜预设)<br>2) `3200 × 1800` (超大工作区)<br>3) `3840 × 2160` (全屏) | 2×2 四宫格、1×4 并排超宽列，视野极其宽广。 |
| **21:9 超宽带鱼屏** | 2560 × 1080<br>3440 × 1440 | 1) `2560 × 1080` (沉浸横屏)<br>2) `3440 × 1200` (大带鱼居中)<br>3) 全屏 | **1×3 / 1×4 超宽列横向并排**，三到四个 AI 并行对话一览无余。 |
| **32:9 超级带鱼屏** | 5120 × 1440 | 1) `3840 × 1200` (主操作窗)<br>2) `5120 × 1440` (全景全屏) | **1×4 / 1×5 列**全景多模型并行对比。 |
| **便携小屏笔记本** | 1366 × 768<br>1920 × 1080 (150% 缩放) | 1) `1200 × 720`<br>2) 最大化铺满 | 单视角为主；双分栏时自动开启 Zoom 0.85。 |

#### 2. 窗口尺寸设置与记忆机制
- **快捷尺寸切换器**：在 Header 或设置面板中提供一键切换预设尺寸下拉菜单（如：“1080P 紧凑”、“2K 舒适”、“带鱼屏全景”）；
- **自定义尺寸配置**：支持用户手动输入指定宽、高像素并设为默认启动大小；
- **多显示器状态记忆与防幽灵窗口机制**：
  - 应用在关闭时自动保存当前所在屏幕标识 (`MonitorID`)、坐标 (`X`, `Y`)、尺寸 (`Width`, `Height`) 以及是否最大化 (`IsMaximized`)；
  - 下次启动时先枚举当前操作系统活跃显示器。若记录的原显示器已断开（例如笔记本拔掉外接拓展屏），系统自动优雅回退至主屏幕中央显示，**彻底杜绝窗口打开在不存在的屏幕区域外（“幽灵窗口”）的严重缺陷**。

#### 3. 智能抗折叠动态缩放算法（Anti-Folding Dynamic Zoom）
- **核心痛点**：ChatGPT、Claude、Gemini 等主流 AI 网页均有响应式 CSS 断点（通常为 `768px` 或 `800px`）。在 1080P 屏幕下四宫格并排时，每个视口的宽度仅约为 `800px - 控制栏 = 600~700px`，会导致 AI 页面自动变为移动端竖版布局，隐藏侧边栏与发送按钮，破坏体验。
- **算法规则**：
  根据视口当前分配的逻辑像素宽度 $W_{avail}$ 动态计算目标 Zoom Factor：
  $$\text{Zoom} = \begin{cases} 1.0 & \text{若 } W_{avail} \ge 850\text{px} \\ \max(0.75, \frac{W_{avail}}{850}) & \text{若 } W_{avail} < 850\text{px} \end{cases}$$
  当视口因拖拽变窄时，通过底层 WebView API 动态缩放页面，**使页面内的 CSS 视口等效宽度始终保持在 850px 以上**，从而百分之百维持桌面端完整排版！

---

### 3.5 核心功能矩阵表

| 模块名称 | 功能点 | 详细需求说明 |
|---|---|---|
| **多窗口体系** | 混合三窗口模型 | - **主工作台 (Shell)**：支持 1~4 视口分栏、Tab 管理、右侧控制枢纽与底栏广播；<br>- **极速悬浮窗 (Spotlight)**：全局热键唤出，极简输入框，支持一键广播、Pin 钉住或扩展为主工作台；<br>- **独立分离视口 (Detached)**：支持将任一视口一键 Detach 到副屏自由拖拽独立浏览。 |
| **快捷键系统** | 全局 + 应用内热键 | - 支持全局后台热键唤出悬浮窗与主窗；<br>- 支持应用内 `Ctrl+1~5` 切割布局、`Ctrl+Enter` 一键广播、`Ctrl+T/W` 管理标签；<br>- 提供可视化的快捷键冲突检测与自定义录制器。 |
| **窗口风格与皮肤** | Glassmorphic 材质 | - 支持 Windows Mica / Acrylic / macOS Vibrancy 原生系统材质联动；<br>- 内置黑曜石、纯白、赛博朋克、深海蓝、落日、苍翠等 6 套预设高颜值皮肤；<br>- 允许精细调节窗口透明度 (70%~100%)、高斯模糊度 (0~40px) 与强调色。 |
| **尺寸与全分辨率** | 预设与智能抗折叠 | - 提供针对 1080P/2K/4K/带鱼屏的一键预设尺寸与全屏自适应；<br>- 具备多显示器断开回退保护（防幽灵窗口）；<br>- 搭载 Anti-Folding 动态 Zoom 算法，多宫格下自动缩放 (0.75~0.85) 防手机端折叠。 |
| **一键广播 (Multi-Send)** | 并发分发驱动 | - 在底栏或悬浮窗输入 Prompt，点击“广播发送”或快捷键，向同屏全部可见视口自动填充并提交；<br>- 自动适配 ChatGPT、Claude、Gemini、DeepSeek 等各类非标准富文本输入框。 |
| **会话与持久化隔离** | 物理磁盘隔离 | - 每个 Tab 独立分配 `UserDataPath` 文件夹，Cookie、LocalStorage 重启不丢失；<br>- 彻底实现多账号同屏登录（如两个 ChatGPT 账号并存）。 |
| **OAuth 弹窗闭环** | 第三方授权支持 | - 拦截 Google/Apple/GitHub 登录弹窗，使用相同 Session 目录打开受控内嵌弹窗；<br>- 授权完成后自动关闭弹窗，主视口实时同步登录状态。 |
| **风控与反爬伪装** | 消除自动化特征 | - 动态抹除请求头中的框架标识，伪装为完整的真实 Chrome 桌面版 UA；<br>- 清除 `navigator.webdriver` 等特征，稳定通过 Cloudflare 5 秒盾与 Google 403 拦截。 |
| **本地混合存储** | 纯本地零上报 | - 界面状态、快捷键与皮肤偏好采用 JSON 文件读写；<br>- Prompt 库与书签采用本地 SQLite 嵌入式数据库，提供毫秒级 FTS 全文模糊检索。 |

---

## 4. 系统技术架构与多窗口挂载设计

### 4.1 总体多窗口拓扑架构路线

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Wails v3 应用程序核心 (Go Runtime)                │
│  - 全局快捷键管理器 (Global Hotkey Manager)                             │
│  - 窗口拓扑管理器 (Window Manager: Shell / Spotlight / Detached)        │
│  - 会话隔离与 UserDataPath 分发器                                       │
│  - 本地存储与 SQLite FTS5 引擎                                          │
└──────┬─────────────────────────┬──────────────────────────┬────────────┘
       │                         │                          │
       ▼                         ▼                          ▼
┌──────────────────┐    ┌──────────────────┐     ┌───────────────────────┐
│ 1. 主工作台 Shell │    │ 2. Spotlight 悬浮 │     │ 3. 独立分离窗 Detached │
│ (Frameless 玻璃壳)│    │ (轻量置顶无边框)  │     │ (自由移动副屏视口)     │
│ ┌──────────────┐ │    │ ┌──────────────┐ │     │ ┌───────────────────┐ │
│ │ React 导航与 │ │    │ │ 极速输入框与 │ │     │ │ 单独承载独立 Web  │ │
│ │ 控制栏 UI    │ │    │ │ 模型选择器   │ │     │ │ 视口 (保留独立会话)│ │
│ └──────────────┘ │    │ └──────────────┘ │     │ └───────────────────┘ │
│ ┌──────────────┐ │    └──────────────────┘     └───────────────────────┘
│ │ 1~4 个业务子 │ │
│ │ 窗口物理挂载 │ │
│ └──────────────┘ │
└──────────────────┘
```

### 4.2 操作系统原生窗口挂载策略（Parent-Child Window Parenting）

为了打破单窗口限制并避免使用被 CSP 拦截的 `iframe`，主工作台内的 1~4 个业务视口采取底层操作系统父子窗口嵌套技术：

- **Windows 路线**：
  1. 通过 Go 获取子窗口 `chwnd` 与主窗口 `shwnd`；
  2. 调用 Win32 API `SetParent(chwnd, shwnd)` 确立物理树级关系；
  3. 修改窗口样式：追加 `WS_CHILD | WS_CLIPCHILDREN`，并追加扩展样式 `WS_EX_NOACTIVATE`（避免点击内容区时导致主外壳失去标题栏激活状态）；
  4. 调用 `SetWindowPos` 刷新窗口样式与位置。
- **macOS 路线**：
  调用 Cocoa 运行时 API `[shellWindow addChildWindow:childWindow ordered:NSWindowAbove]`，子窗口天然跟随主外壳移动与最小化。
- **Linux 路线**：
  通过 GTK `gtk_window_set_transient_for(child, shell)`，并设置窗口无装饰（`undecorated`）。

### 4.3 全局快捷键底层引擎与跨平台事件调度

1. **Windows 平台**：
   - Go 后端利用 Win32 原生 API `RegisterHotKey(hWnd, id, fsModifiers, vk)` 注册全局系统热键；
   - 监听后台全局消息循环 `WM_HOTKEY`，当检测到触发时，投递内部事件调用 `SpotlightWindow.Show()` 或 `ShellWindow.RestoreAndFocus()`。
2. **macOS 平台**：
   - 借助 `NSEvent addGlobalMonitorForEventsMatchingMask:` 或 Carbon Event HotKey 注册全局按键监听。
3. **安全防冲突机制**：
   - 启动时尝试注册，若返回值指示已被其他系统软件占用（如 `Alt+Space` 已被 PowerToys Run 占用），系统自动产生告警通知并优雅降级为备选快捷键（如 `Ctrl+Shift+Space`），并在设置界面醒目标红提示。

---

## 5. 同屏布局算法与高分屏生命周期管理

### 5.1 同屏 1~4 视口布局算法与像素换算

由前端 React 监听主窗口 resize 与控制面板宽度，以 **2×2 四宫格** 布局计算为例：

```typescript
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function compute4GridLayout(
  startX: number, // 避开左侧/右侧控制栏
  startY: number, // 避开顶部 Tab 栏
  availW: number, 
  availH: number, 
  gap = 4
): Rect[] {
  const halfW = Math.floor((availW - gap) / 2);
  const halfH = Math.floor((availH - gap) / 2);

  return [
    // 视口 0: 左上
    { x: startX, y: startY, width: halfW, height: halfH },
    // 视口 1: 右上
    { x: startX + halfW + gap, y: startY, width: halfW, height: halfH },
    // 视口 2: 左下
    { x: startX, y: startY + halfH + gap, width: halfW, height: halfH },
    // 视口 3: 右下
    { x: startX + halfW + gap, y: startY + halfH + gap, width: halfW, height: halfH }
  ];
}
```

### 5.2 DPI 高分屏物理坐标映射与跨屏迁移（Per-Monitor DPI Aware v2）

1. **物理像素转换**：
   Windows 和 macOS 高分屏下，系统缩放比（DPR，如 125%、150%、200%）会导致逻辑像素与物理像素产生偏差。前端下发坐标前必须乘以设备像素比：
   $$\text{PhysicalX} = \text{Math.round}(\text{LogicalX} \times \text{DPR})$$
   $$\text{PhysicalW} = \text{Math.round}(\text{LogicalW} \times \text{DPR})$$
2. **跨显示器迁移（Per-Monitor DPI 切换）**：
   当用户把主工作台从 4K 200% 屏拖动到 1080P 100% 扩展屏时，Win32 派发 `WM_DPICHANGED`。Go 后端拦截该事件后，通知 React 重新抓取当前的 `window.devicePixelRatio` 并重新派发全量子窗口的物理矩形坐标，消除高分屏切换导致的错位与黑边。

### 5.3 智能抗折叠动态缩放算法（Anti-Folding Dynamic Zoom）

针对 1080P 分辨率下开启四宫格时单个视口宽度过窄的问题，前端与 Go 窗口管理器联动执行缩放计算：

```typescript
export function calculateAdaptiveZoom(viewportWidth: number): number {
  const BREAKPOINT = 850; // AI 页面折叠阈值
  if (viewportWidth >= BREAKPOINT) {
    return 1.0;
  }
  // 最小缩放至 75%，防止字号过小无法辨认
  const factor = viewportWidth / BREAKPOINT;
  return Math.max(0.75, Math.round(factor * 100) / 100);
}
```
缩放值经 Wails bindings 下发给 Go，在 WebView2 上调用 `Controller.SetZoomFactor(zoom)` 或在 Webkit 上执行 CSS 注入缩放，让页面逻辑排版始终保持桌面级。

### 5.4 Tab 生命周期与 Show/Hide 内存缓存与 LRU 挂起防爆

1. **Show/Hide 零丢弃缓存机制**：
   - 切换视口或标签时，仅调用 `Window.Hide()`，**严禁调用 Destroy()**。后台保留 DOM 上下文、未提交的 Prompt 草稿和 WebSocket 活跃连接；
   - 重新切入时，调用 `Window.SetPosition(...)` 定位并调用 `Window.Show()`。
2. **LRU 挂起防爆策略**：
   - 前台同屏展示 **1~4 个**，后台活跃缓存 **6~8 个**；
   - 当用户创建的 Tab 总数超过 **10 个** 时，将最近最少使用的后台窗口标记为挂起（在 Windows 上调用 WebView2 的 `Suspend()` 接口挂起渲染进程以释放内存，仅保留磁盘 Cookie）；再次切回时恢复。

---

## 6. 会话持久化、OAuth 弹窗与风控对抗规范

### 6.1 基于独立 UserDataPath 的 Cookie 物理隔离与持久化

1. **磁盘路径规划**：
   在系统 `%APPDATA%/Noi/sessions/<partition-id>/` 目录下为每个会话分配完全独立的物理路径：
   ```
   sessions/
   ├── default/              <-- 默认共享会话池
   ├── chatgpt-work/         <-- 账号 1 (独立 Cookies 数据库)
   ├── chatgpt-personal/     <-- 账号 2 (独立 Cookies 数据库)
   └── claude-main/          <-- Claude 专属目录
   ```
2. **持久化保障**：
   Wails v3 / WebView2 会自动将所有登录鉴权 Cookie、Token 以及 LocalStorage 写入该目录中的 SQLite 数据库中。只要文件夹未被清理，软件重启后永不掉线。

### 6.2 第三方 OAuth 登录弹窗（Google/Apple）闭环拦截

1. **痛点**：第三方 OAuth 登录（如 "Continue with Google"）会执行 `window.open(...)`。如果未做处理，通常会调用外部系统浏览器打开，导致授权回调无法写入应用内部。
2. **解决方案**：
   - 监听底层 WebView 的新窗口创建事件；
   - 匹配认证白名单域名（`accounts.google.com`、`appleid.apple.com`、`auth0.com` 等）；
   - 必须强制**使用与父视口完全相同的 UserDataPath 目录**打开内嵌模态窗口；
   - 授权完成并回调到目标站点后，弹窗触发 `window.close()` 自动关闭，主视口实时同步登录状态。

### 6.3 反爬虫与风控对抗（绕过 Google 403 与 Cloudflare 验证）

1. **User-Agent 清洗**：
   严禁携带任何 `Wails`、`Electron` 或自定义桌面标识，必须统一配置标准 Google Chrome 桌面版 UA：
   ```text
   Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36
   ```
2. **清除自动化指纹（Preload 注入）**：
   在每个视口初始化完成前注入脚本，抹除浏览器自动化特征：
   ```javascript
   Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
   ```
   确保顺利通过 Cloudflare Turnstile 5 秒盾与 Google `403: disallowed_useragent` 封锁。

---

## 7. Prompt 跨站点注入与一键广播机制

### 7.1 主流 AI 厂商输入框适配与自动化注入

针对主流 AI 厂商的不同受控富文本组件制定统一适配分发：

```javascript
// 核心注入分发逻辑
function injectAndSubmit(platform, text) {
  switch (platform) {
    case 'chatgpt': {
      const textarea = document.querySelector('form #prompt-textarea');
      if (!textarea) return;
      textarea.focus();
      textarea.innerHTML = '';
      text.split('\n').forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        textarea.appendChild(p);
      });
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      setTimeout(() => {
        const btn = document.querySelector('button[data-testid="send-button"]') 
                 || document.querySelector('form button:has(svg)');
        if (btn) btn.click();
      }, 120);
      break;
    }
    case 'claude': {
      const el = document.querySelector('div.ProseMirror');
      if (!el) return;
      el.focus();
      el.innerHTML = '';
      document.execCommand('insertText', false, text);
      setTimeout(() => {
        const btn = document.querySelector('button[aria-label*="send message" i]')
                 || document.querySelector('fieldset button:has(svg)');
        if (btn) btn.click();
      }, 120);
      break;
    }
    case 'gemini': {
      const el = document.querySelector('.ql-editor.textarea');
      if (!el) return;
      el.focus();
      el.value = text;
      el.querySelector('p').textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => {
        const btn = document.querySelector('button[aria-label*="Send message"]');
        if (btn) { btn.setAttribute('aria-disabled', 'false'); btn.click(); }
      }, 120);
      break;
    }
    case 'deepseek': {
      const textarea = document.querySelector('textarea');
      if (!textarea) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(textarea, text);
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      setTimeout(() => {
        const btns = document.querySelectorAll('div[role="button"]');
        const sendBtn = btns[btns.length - 1];
        if (sendBtn) sendBtn.click();
      }, 120);
      break;
    }
  }
}
```

### 7.2 一键广播并发执行策略
在主工作台底栏或 Spotlight 悬浮窗输入 Prompt 并触发 `Ctrl + Enter` 时：
1. 主进程获取当前所有处于可见状态（Visible）的 AI 视口列表；
2. 并发向每个视口调用 `ExecuteJavaScript(injectAndSubmitCode)`；
3. 执行后在底栏或悬浮窗展示成功反馈动画，并在悬浮窗模式下支持自动收起。

---

## 8. 数据持久化与配置模型设计

### 8.1 完整配置文件 Schema (`config.json`)

系统偏好配置文件保存在 `%APPDATA%/Noi/noi.config.json`：

```json
{
  "version": "1.0.0",
  "window": {
    "preset": "2K-Comfort",
    "width": 1600,
    "height": 1000,
    "x": -1,
    "y": -1,
    "isMaximized": false,
    "lastMonitorId": "DISPLAY1",
    "rememberBounds": true
  },
  "theme": {
    "current": "Dark Obsidian",
    "mode": "dark",
    "accentColor": "#3B82F6",
    "windowOpacity": 0.85,
    "backdropBlur": 20,
    "borderRadius": 10,
    "enableMica": true
  },
  "hotkeys": {
    "globalSpotlight": "Alt+Space",
    "globalToggleMain": "Ctrl+Shift+W",
    "globalSendClipboard": "Ctrl+Shift+B",
    "switchLayout1": "Ctrl+1",
    "switchLayout2": "Ctrl+2",
    "switchLayout4": "Ctrl+3",
    "switchLayout1x4": "Ctrl+4",
    "broadcastSend": "Ctrl+Enter",
    "toggleDrawer": "Ctrl+\\",
    "openSettings": "Ctrl+,"
  },
  "layout": {
    "activeLayout": "grid4",
    "rightBarWidth": 260,
    "bottomBarHeight": 90,
    "enableAutoZoom": true,
    "autoZoomMin": 0.75
  },
  "activeViewportIds": [
    "chatgpt-default",
    "claude-default",
    "deepseek-default",
    "gemini-default"
  ]
}
```

### 8.2 本地 SQLite 数据库与 FTS5 检索引擎

数据库文件保存在 `%APPDATA%/Noi/noi.db`：
1. `prompts` 表：存储本地 Prompt 标题、正文、分类、标签与快捷触发词；
2. `prompts_fts` 虚拟表：启用 SQLite FTS5 全文检索引擎，实现百毫秒级输入即搜；
3. `bookmarks` 表：管理预设与用户自定义的 AI 站点列表及其专属 UserData 分区名称；
4. `history` 表：本地审计与快速复用历史广播记录。

---

## 9. UI 设计系统与视觉交互路线

### 9.1 Modern Glassmorphism 现代玻璃拟态视觉
- 主窗口与悬浮窗统一基于 CSS 变量驱动主题系统；
- 玻璃容器背景采用 `backdrop-filter: blur(var(--blur-amount)) saturate(180%)`；
- 半透明细边框 `1px solid var(--border-glow)`，呈现轻奢通透质感。

### 9.2 响应式拖拽分栏与实时光晕反馈
- 双分栏模式具备垂直可拖拽分割条（Splitter），四宫格模式具备十字交叉拖拽锚点；
- 鼠标悬停时分割条微光变亮，拖拽过程中子窗口实时跟随重算 Bounds，并呈现尺寸提示气泡。

### 9.3 右侧全局控制栏核心枢纽
- **布局切换区**：单视角、双视角、四宫格、带鱼屏四列、主辅工作台一键切换图标；
- **AI 模型网格勾选器**：直接勾选哪些模型参与同屏竞技；
- **外观与皮肤抽屉**：6 款预设皮肤卡片实时切换，附带透明度与强调色滑块；
- **尺寸与分辨率预设**：1080P/2K/4K/带鱼屏常见尺寸一键缩放。

---

## 10. 阶段实施路线与验收指标

### 10.1 阶段实施里程碑

- **阶段一：工程骨架与基础 UI（Wails v3 + React + 皮肤系统）**
  - 初始化 Wails v3 + React + Vite + TypeScript 工程；
  - 实现现代化 Glassmorphic 无边框外壳、Header、右侧控制栏与底部输入 Dock；
  - 实现基于 CSS 变量的主题皮肤系统（内置 6 套主题、透明度与强调色可调）。
- **阶段二：多窗口挂载引擎与全分辨率布局计算**
  - 实现 Windows / macOS 原生父子窗口挂载（`SetParent` 与 `WS_CHILD`）；
  - 实现单视角、双分栏、四宫格、带鱼屏列排布的物理像素动态换算；
  - 接入全分辨率预设与智能抗折叠动态 Zoom 算法。
- **阶段三：全局快捷键与多窗口协同 (Spotlight + Detached)**
  - 实现 Go 原生全局热键注册（`Alt+Space` 等）与后台唤出；
  - 实现极速 Spotlight 悬浮窗；实现视口 Detach 分离独立窗口能力；
  - 实现多窗口状态与快捷键冲突检测。
- **阶段四：会话隔离、OAuth 闭环与 Prompt 广播**
  - 实现基于 `UserDataPath` 的独立会话持久化与 UA 伪装反爬；
  - 实现 Google/Apple OAuth 登录弹窗闭环拦截；
  - 实现 ChatGPT、Claude、Gemini、DeepSeek 的 DOM 自动化注入与一键四发广播。
- **阶段五：SQLite 提示词库、内存治理与收尾验收**
  - 集成嵌入式 SQLite FTS5 提示词库；
  - 接入 LRU 内存挂起防爆策略，跨分辨率兼容性实测与整包打包验证。

### 10.2 细粒度验收指标与测试矩阵

1. **多窗口与全局快捷键**：
   - 在桌面任何第三方软件或游戏全屏状态下，按下 `Alt+Space`，极速悬浮窗能在 150ms 内平滑居中弹出并聚焦；
   - 在主工作台按下 `Ctrl+1~4`，100ms 内瞬间完成 1~4 视口布局重排；
   - 快捷键在设置中可自由修改并即时生效，冲突时有明确警告。
2. **窗口皮肤与风格**：
   - 切换 6 款预设主题，所有外壳、抽屉、边框与按钮颜色 100% 同步切换，无闪烁；
   - 调节窗口透明度与模糊度滑块，背景实时呈现平滑毛玻璃变化。
3. **窗口大小与全分辨率兼容**：
   - 切换至 1080P、2K、4K、带鱼屏等预设尺寸，窗口平滑调整大小并居中；
   - 在 1080P 屏幕下开启 4 宫格模式，各视口自动调整 Zoom Factor 为 0.75~0.80，各个 AI 网站排版保持完整的桌面端视图，**不触发窄屏移动端抽屉**；
   - 在多显示器拔掉副屏后重启应用，窗口自动安全回退至主屏幕中央，无幽灵窗口。
4. **会话隔离与登录持久性**：
   - 重启软件后，所有已登录的 AI 站点 Cookie 依然有效，永不要求重新登录；
   - 两个 Tab 同时登录同一个 AI 服务的不同账号，互不干扰；
   - Google / Apple 账号登录弹窗在应用内正常完成鉴权闭环。
5. **并发广播成功率**：
   - 四宫格模式下在底栏输入 Prompt 并回车，4 个模型视口均在 300ms 内成功填充并自动点击发送开始应答。
