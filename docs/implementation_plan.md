# 全新桌面级多 AI 视角工作台软件开发实施计划

> 本实施计划基于已完成的深度访谈与需求设计规范文档 (`requirements_and_design_spec.md`) 及实现技术文档 (`implementation.md`)，为创建一款基于 **Go + Wails v3 + React + TypeScript + Modern Glassmorphic UI**、具备**混合多窗口系统（主工作台 + 全局极速悬浮窗 + 独立分离窗）**、**全局与应用内快捷键生态**、**6套预设皮肤与外观定制中心**、以及**全分辨率自适应与智能抗折叠引擎**的多 AI 视角桌面工作台制定详尽的阶段性工程落地路线与交付验证方案。

---

## 核心设计定位与实施前提

1. **技术路线选择**：采用 **Wails v3 + Go + React 18 + Vite 5 + TypeScript** 架构。明确否定 Wails v2（受单窗口架构与 iframe CSP 限制），全量选用具备多窗口一等公民支持、具备独立 `UserDataPath` 的 Wails v3。
2. **混合多窗口系统**：
   - **主工作台 (Shell)**：支持 1~4 视口同屏分栏、Tab 管理、右侧全局控制栏与底栏一键广播；
   - **极速 AI 悬浮窗 (Spotlight)**：全局快捷键 `Alt+Space` 居中随时唤出，极简输入框，支持一键广播、Pin 锁定置顶或一键转为主工作台；
   - **独立分离视口 (Detached)**：支持将任一 AI 视口独立剥离为桌面窗口，自由拖拽至副屏或单独全屏。
3. **全局与应用内快捷键生态**：原生注册系统级全局热键（`Alt+Space` 唤出悬浮窗、`Ctrl+Shift+W` 切换主窗），应用内支持 `Ctrl+1~5` 切换布局、`Ctrl+Enter` 一键广播、`Ctrl+T/W` 管理标签，并配备可视化热键录制器。
4. **高颜值 Modern 皮肤中心**：支持 Windows 11 Mica / Acrylic 原生材质联动；内置 6 款精选主题皮肤（经典黑曜、轻灵纯白、赛博霓虹、极夜深海、暮色落日、深林苍翠），支持透明度 (70%~100%)、毛玻璃模糊度 (0~40px) 与强调色深度定制。
5. **窗口尺寸预设与全分辨率兼容**：内置 1080P/2K/4K/带鱼屏常见尺寸一键切换；搭载智能抗折叠动态缩放算法（Anti-Folding Dynamic Zoom），四宫格或窄屏时自动缩放 (0.75~0.85)，杜绝 AI 网页自动折叠为移动端抽屉；具备拔出副屏后的防幽灵窗口回退机制。
6. **物理级会话隔离与反风控伪装**：基于独立 `UserDataPath` 目录隔离各 Tab，保证多账号同存与重启永不掉线；伪装真实 Chrome 桌面 UA 并抹除自动化测试指纹。

---

## 阶段拆解与实施路线 (Implementation Roadmap)

### 阶段一：项目工程骨架、现代玻璃拟态皮肤系统与 Shell UI

#### 1.1 项目脚手架与基础工程搭建
- 初始化 Wails v3 + React + Vite + TypeScript 工程；
- 配置 Tailwind CSS 与 CSS Variables 主题引擎；
- 搭建基础目录结构（`internal/config`, `internal/windowmanager`, `internal/hotkey`, `internal/theme`, `internal/resolution`, `frontend/src/components`）；
- 配置前端构建流程与 TypeScript 类型检查。

#### 1.2 现代玻璃拟态皮肤系统开发
- 定义 CSS 变量主题规范（`--bg-primary`, `--border-glow`, `--accent`, `--blur-amount`, `--window-opacity`）；
- 实现 6 款预设皮肤主题的配置与一键切换；
- 实现前端 ThemeProvider 状态机，提供暗黑/亮色/自动模式以及强调色、透明度、模糊度滑块组件；
- 接入 Go 后端材质 API（Windows 11 Mica / Acrylic 联动）。

#### 1.3 Shell 主工作台外壳开发
- 构建无边框 (Frameless) 窗口 Shell 根布局；
- 开发 Header 区域（窗口拖拽条、预设尺寸快捷下拉菜单、置顶 Pin、窗口控制按钮）；
- 开发 Main 主内容区（支持 1~4 视口四宫格/双分栏/单视角动态切换）/ Right 侧边全局控制栏 / Bottom Quick 广播发送栏三面板 Flex/Grid 布局与可拖拽分割条 (Resizer Dividers)；
- 开发 Right 侧边全局控制栏（布局模式调节、AI 组合勾选器、皮肤主题抽屉、尺寸设置）；
- 开发 Tab 栏组件（支持 Tab 新增、切换、拖拽排序、关闭与独立图标/标题展示）。

---

### 阶段二：Go 核心后端、原生子窗口挂载与全分辨率抗折叠引擎

#### 2.1 Go 窗口管理器与原生句柄挂载
- 实现 Go 侧 `WindowManager`：负责管理无边框子窗口（包含 1~4 个同屏视口）创建、销毁、显示、隐藏与置顶；
- 实现 Windows 原生父子窗口挂载：
  - 调用 Win32 `SetParent` 确立父子关系；
  - 注入 `WS_CHILD | WS_CLIPCHILDREN | WS_EX_NOACTIVATE` 样式，消除焦点抢占与主外壳失焦闪烁；
- 实现 macOS `addChildWindow:ordered:` 挂载路线与 Linux 降级机制。

#### 2.2 全分辨率预设与防幽灵窗口保护
- 实现常用分辨率尺寸矩阵（1080P 紧凑/标准/全屏、2K 黄金/宽屏/全屏、4K 视网膜/全屏、21:9/32:9 带鱼屏）；
- 实现 Go 侧 `resolution.ValidateAndClampBounds`：启动时枚举系统有效物理显示器，若原记录显示器已断开，自动安全回退至主屏幕中央，杜绝“幽灵窗口”。

#### 2.3 矩形坐标实时同步与智能抗折叠动态缩放 (Anti-Folding Dynamic Zoom)
- 前端 React 监听窗口 resize、分栏拖拽及布局切换，结合 `window.devicePixelRatio` 精确计算物理像素 Bounds；
- 实现智能抗折叠算法：当分配给单个视口的宽度 $< 850\text{px}$ 时，自动计算缩放比例 $\text{Zoom} = \max(0.75, W/850)$，并下发给 Go 在 WebView2 控制器上执行 `SetZoomFactor`，确保 AI 网页始终保持桌面级完整排版；
- 拦截 Win32 `WM_DPICHANGED` 事件，处理高分屏跨屏拖动时的坐标平滑校准。

---

### 阶段三：全局与应用内快捷键生态、Spotlight 悬浮窗与视口分离

#### 3.1 Go 原生全局系统热键管理器
- 封装 Win32 `RegisterHotKey` / `UnregisterHotKey` 与消息循环 goroutine；
- 注册默认全局热键：`Alt+Space` 唤出极速悬浮窗、`Ctrl+Shift+W` 切换主工作台；
- 实现热键被其他软件占用时的冲突检测与优雅降级（如自动降级为 `Ctrl+Shift+Space` 并弹窗告警）。

#### 3.2 Spotlight 极速 AI 悬浮窗开发
- 独立构建 `SpotlightApp.tsx` 页面，预建轻量级无边框置顶窗口；
- 实现居中呼出、输入框自动聚焦、失焦自动收起（Pin 锁定状态下常驻）；
- 悬浮窗内置常用 AI 模型勾选器与快速一键广播输入框；
- 支持点击按钮一键将当前会话转为主工作台展开。

#### 3.3 应用内快捷键分发器与设置录制器
- 前端实现 `keyboard.ts` 监听器，捕获 `Ctrl+1~5`（布局切换）、`Ctrl+Enter`（一键广播）、`Ctrl+T/W`（Tab 管理）、`Ctrl+\`（控制栏折叠）、`Ctrl+,`（设置）；
- 开发设置中心中的图形化 **Hotkey Recorder** 组件，支持用户按下键盘自定义热键组合并校验冲突。

#### 3.4 独立分离视口 (Detached Window) 支持
- 在每个子视口右上角增加“分离”操作按钮；
- 用户点击后，解除 Win32 `SetParent` 父子关联，重新赋予顶层窗口标题栏与独立任务栏图标，使其成为独立的桌面窗口，可自由拖拽到副显示器。

---

### 阶段四：物理会话隔离、反风控伪装与一键四发广播

#### 4.1 会话物理隔离与 User-Agent 伪装
- 为每个 Tab 动态创建唯一的本地物理数据隔离目录（`%APPDATA%/Noi/sessions/<id>`），保证持久化登录不掉线，实现多账号同屏并存；
- 统一伪装真实 Google Chrome 桌面版 UA，并在视口初始化时注入 Preload 脚本抹除 `navigator.webdriver` 自动化特征，通过 Cloudflare 5 秒盾与 Google 403 拦截。

#### 4.2 第三方 OAuth 登录弹窗闭环
- 监听底层 WebView 的新窗口创建事件，识别 Google/Apple 认证域名；
- 强制使用同分区 `UserDataPath` 弹出内嵌模态窗口完成鉴权；
- 鉴权成功后自动关闭弹窗，主视口实时同步登录状态。

#### 4.3 多模型富文本注入适配与一键四发广播
- 针对 ChatGPT (ContentEditable)、Claude (ProseMirror)、Gemini (Quill)、DeepSeek (Textarea) 编写跨平台 DOM 注入适配器；
- 在主工作台底栏或 Spotlight 悬浮窗按下 `Ctrl+Enter`，Go 后端向当前同屏可见的全部 1~4 个活动视口并发调用 `ExecuteJavaScript` 注入内容并自动点击提交。

---

### 阶段五：SQLite FTS5 提示词库、LRU 内存防爆与综合验收

#### 5.1 本地存储与 SQLite FTS5 提示词引擎
- 集成纯 Go `modernc.org/sqlite` 嵌入式数据库与 JSON 配置文件模块；
- 实现 Prompt 库表、预设书签表与 FTS5 虚拟表，支持毫秒级全文模糊检索；
- 开发右侧控制栏 Prompt 抽屉界面，支持一键将提示词填入输入框。

#### 5.2 LRU 内存挂起防爆机制
- 实现 Tab 生命周期治理：同屏可见 1~4 个，后台活跃缓存 6~8 个；
- 当打开视口超过 10 个时，对最久未访问的后台视口调用 WebView2 `Suspend()` 挂起休眠，释放内存；切入时瞬间 `Resume()`。

#### 5.3 现代视觉磨皮与全分辨率验收
- 微调玻璃拟态视觉、阴影发光效果与主题过渡动画；
- 执行跨分辨率实机测试（1080P/2K/4K/带鱼屏/多显示器拔插）；
- 运行整包构建验证，输出可执行分发物。

---

## 验证计划与测试方法

### 1. 编译与工程构建验证
- **Go 后端测试**：运行 `go test ./...`，覆盖窗口管理器坐标换算、快捷键冲突校验、分辨率预设防幽灵屏幕算法与 SQLite 增删改查；
- **前端类型与打包检查**：运行 `npm run build`，确保 TypeScript 零错误、Vite 打包产物完整；
- **整包跨平台构建**：运行 Wails 打包命令，生成 Windows 安装包/独立免安装 exe。

### 2. 核心业务功能验证矩阵

| 验证项 | 测试步骤 | 预期合格标准 |
|---|---|---|
| **全局快捷键** | 在后台其他全屏软件中按下 `Alt+Space` | 150ms 内平滑居中弹出 Spotlight 悬浮窗，焦点自动置于输入框内；再次按下平滑隐藏。 |
| **应用内快捷键** | 在主工作台按下 `Ctrl+1` 到 `Ctrl+4` | 100ms 内瞬间切换单视角、双分栏、四宫格与超宽列布局，子窗口平滑重排无黑边。 |
| **热键自定义** | 在设置中心将唤出热键修改为 `Ctrl+Alt+K` 并保存 | 新热键立即生效，旧热键安全注销，冲突按键有醒目红色提示。 |
| **窗口皮肤定制** | 在控制栏依次切换 6 款预设主题，拖动透明度滑块 | 背景与控件色彩瞬时切换无卡顿；透明度与高斯模糊平滑过渡。 |
| **常用分辨率预设** | 在 Header 下拉菜单分别点击 1080P/2K/4K/带鱼屏预设 | 窗口尺寸与位置平滑变更，居中呈现，无显示器溢出。 |
| **抗折叠动态缩放** | 在 1080P 屏幕下开启 4 宫格模式 | 各视口自动启用 Zoom 0.78 缩放，ChatGPT、Claude 等页面保持完整桌面排版，**不触发移动端抽屉折叠**。 |
| **拔屏防幽灵窗口** | 在外接副屏关闭应用，拔出副屏后重新启动应用 | 窗口检测到副屏失效，自动在笔记本主屏居中打开，无界面隐匿黑屏。 |
| **一键四发广播** | 四宫格模式下在底栏输入 Prompt 并按 `Ctrl+Enter` | 4 个模型视口同时被填充文字并自动触发发送，各模型同时开始作答。 |
| **登录态持久化** | 登录 ChatGPT 与 Claude 账号后完全退出并重启应用 | 重启后仍保持已登录状态，Cookie 与 LocalStorage 零丢失。 |
| **账号物理隔离** | 在两个 Tab 分别登录同一个 AI 服务的两个不同账号 | 两个账号同时在线、互不踢出、数据完全物理隔离。 |
| **OAuth 弹窗闭环** | 在视口内点击 "Continue with Google" 登录 | 授权弹窗在应用内正常打开并在授权完成后自动关闭，主视口实时变为已登录状态。 |
