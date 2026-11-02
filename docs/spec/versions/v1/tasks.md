# 实施计划（Tasks）

> 文件路径：`docs/spec/versions/v1/tasks.md`
> 版本：v1 · 日期：2026-11-01
> 状态：已定稿，待执行

执行时须严格遵循 `docs/spec/versions/v1/requirements.md` 中对应需求的验收标准。
每项任务通过 `_需求:` 引用相关需求编号，通过 `_测试类型:` 关联 QA 执行章节。

---

## 阶段一：工程骨架与基础设施

---

- [x] **TASK-001 · 初始化项目工程骨架**

  > 依赖：无

  - [x] 在根目录初始化 Wails v3 项目配置（`wails.yaml` / `main.go` / `app.go`），前端目录指定为 `ui/`
  - [x] 配置 `.gitattributes`（`* text=auto eol=lf`）
  - [x] 初始化 Go 模块并集成 Wails v3（`v3.1.0`）
  - [x] 初始化前端（`cd ui && pnpm install`），确认 Vite + React + TypeScript 配置正常
  - [x] 配置 ESLint + Prettier + TypeScript strict mode
  - [x] 配置 Husky + lint-staged（前端提交前检查）
  - [x] 执行验证确认前端静态检查、单元测试与 Go 构建正常通过

  **验证方式：**
  ```bash
  cd e:\Nextcloud\coding\desktop\aimux
  wails dev
  # 确认前端页面在 WebView 中正常渲染
  pnpm exec tsc --noEmit
  go build ./...
  ```

  **验收证据：** `wails dev` 启动无报错，前端页面渲染，截图留证

  _需求：无直接需求，工程基础
  _测试类型: Manual

---

- [x] **TASK-002 · SQLite 数据库层初始化**

  > 依赖：TASK-001

  - [x] 添加 `modernc.org/sqlite` 和 `golang-migrate/migrate` 依赖
  - [x] 创建 `app/storage/db.go`：连接管理、WAL 模式、迁移自动执行
  - [x] 创建首个迁移文件 `app/storage/migrations/000001_init_schema.up.sql`（bookmarks/prompts/prompts_fts/history 表）
  - [x] 为 bookmarks、prompts、history 编写 CRUD 函数
  - [x] 为 FTS5 搜索编写 `SearchPrompts(query string) []Prompt` 函数
  - [x] **先写测试**：`app/storage/db_test.go` 覆盖 CRUD 和 FTS 搜索（Red → Green → Refactor）

  **验证方式：**
  ```bash
  go test ./app/storage/... -v -cover
  # 期望：覆盖率 ≥ 85%，所有测试通过
  ```

  **验收证据：** `go test` 输出 PASS，覆盖率报告截图

  _需求: `v1.REQ-001-AC-001`（站点书签持久化），`v1.REQ-011-AC-001`, `v1.REQ-011-AC-002`（Prompt FTS）
  _测试类型: Unit

---

- [ ] **TASK-003 · 应用配置读写模块**

  > 依赖：TASK-001

  - [ ] 创建 `config/paths.go`：获取 `%APPDATA%/AIMux/` 路径（跨平台）
  - [ ] 创建 `config/defaults.go`：默认窗口尺寸、Zoom 阈值、默认主题等常量
  - [ ] 实现 `app/storage/config.go`：`LoadConfig() AppConfig` 和 `SaveConfig(AppConfig) error`（JSON 序列化）
  - [ ] **先写测试**：config 读写的单元测试，覆盖默认值填充场景

  **验证方式：**
  ```bash
  go test ./config/... ./app/storage/... -run TestConfig -v
  ```

  **验收证据：** 测试全 PASS，配置文件可正确序列化/反序列化

  _需求: `v1.REQ-009-AC-001`（主题持久化），`v1.REQ-010-AC-002`（窗口预设持久化）
  _测试类型: Unit

---

## 阶段二：多视口布局引擎

---

- [ ] **TASK-004 · 自适应 Zoom 算法实现**

  > 依赖：TASK-001

  - [ ] 创建 `ui/src/utils/viewport.ts`：实现 `calculateAdaptiveZoom(width, breakpoint)` 函数
  - [ ] 创建 `ui/src/config/viewport.ts`：`DEFAULT_ZOOM_BREAKPOINT = 850`, `MIN_ZOOM = 0.75`
  - [ ] **先写测试**：`ui/src/utils/viewport.test.ts`，覆盖边界值（width=850, 849, 600, 300）
  - [ ] 实现 `computeViewportBounds`：根据布局模式和可用尺寸计算各视口 Rect

  **验证方式：**
  ```bash
  cd ui && pnpm test --run --reporter=verbose
  # 期望：所有 viewport utils 测试通过
  ```

  **验收证据：** 单元测试截图，边界值验证全 PASS

  _需求: `v1.REQ-002-AC-003`（Zoom ≥ 0.75 防折叠）
  _测试类型: Unit

---

- [ ] **TASK-005 · Go 窗口管理器（WindowManager）**

  > 依赖：TASK-003

  - [ ] 创建 `app/window/manager.go`：Shell/Spotlight/Detached 窗口生命周期管理
  - [ ] 实现 `SetLayout(layout string) error`：布局模式切换，计算子窗口 Bounds
  - [ ] 实现 `SetViewportBounds(id string, bounds Rect) error`：下发物理像素坐标给 WebView 子窗口
  - [ ] 实现 `DetachViewport(id string) error`：视口分离为独立窗口
  - [ ] 实现 LRU Show/Hide 缓存（10 Tab 后挂起最旧窗口）
  - [ ] **先写测试**：Layout 计算、LRU 策略的单元测试

  **验证方式：**
  ```bash
  go test ./app/window/... -v -cover
  ```

  **验收证据：** 测试全 PASS，`wails dev` 下手动验证布局切换

  _需求: `v1.REQ-002-AC-001`, `v1.REQ-002-AC-002`, `v1.REQ-002-AC-004`
  _测试类型: Unit + E2E

---

- [ ] **TASK-006 · 前端布局 UI（主工作台框架）**

  > 依赖：TASK-004, TASK-005

  - [ ] 创建无边框 Glassmorphic 外壳（Header + 右侧控制栏 + 底栏 Dock + 主内容区）
  - [ ] 实现布局切换控件（5 种布局图标按钮）
  - [ ] 实现 Splitter 拖拽组件（`ui/src/components/Layout/Splitter.tsx`）
  - [ ] 前端监听窗口 resize，重新计算 Bounds 并调用 `SetViewportBounds` Wails API
  - [ ] 实现 `useViewportStore`（Zustand）管理活跃视口列表和布局状态

  **验证方式：**
  ```bash
  cd ui && pnpm test --run
  # E2E：Playwright 截图验证布局切换
  ```

  **验收证据：** Playwright 截图，5 种布局正确切换，无闪烁

  _需求: `v1.REQ-002-AC-001`, `v1.REQ-002-AC-002`
  _测试类型: E2E

---

## 阶段三：全局快捷键

---

- [ ] **TASK-007 · Go 全局快捷键管理器**

  > 依赖：TASK-005

  - [ ] 创建 `app/hotkey/manager.go`：跨平台全局热键注册（Windows: Win32 `RegisterHotKey` / macOS: Carbon HotKey）
  - [ ] 实现 `app/hotkey/conflict.go`：注册失败时返回冲突信息和建议降级组合键
  - [ ] 暴露 Wails Binding：`RegisterHotkey(action, combo string) HotkeyResult`
  - [ ] 注册成功后触发 Wails 事件 `hotkey:triggered` 通知前端
  - [ ] **先写测试**：冲突检测逻辑的单元测试（Mock Win32 调用）

  **验证方式：**
  ```bash
  go test ./app/hotkey/... -v
  # Manual：在应用运行时按 Alt+Space 确认悬浮窗弹出
  ```

  **验收证据：** 冲突检测单元测试 PASS；Manual 测试记录截图

  _需求: `v1.REQ-003-AC-001`, `v1.REQ-003-AC-003`, `v1.REQ-003-AC-004`
  _测试类型: Unit + Manual

---

- [ ] **TASK-008 · Spotlight 悬浮窗**

  > 依赖：TASK-006, TASK-007

  - [ ] 创建 `ui/src/components/Spotlight/` 组件（极简输入框 + 模型选择器）
  - [ ] 实现 `ShowSpotlight(visible bool)` Wails Binding
  - [ ] 悬浮窗全局热键触发后，在当前鼠标所在屏幕中央弹出
  - [ ] 实现失焦自动隐藏和 Pin 钉住功能
  - [ ] Spotlight 支持直接触发 Prompt 广播

  **验证方式：**
  ```bash
  # E2E：Playwright 截图验证弹出位置和动画
  # Manual：Alt+Space 测试在各前台应用下触发
  ```

  **验收证据：** Playwright 截图 + Manual 测试记录

  _需求: `v1.REQ-003-AC-001`
  _测试类型: E2E + Manual

---

## 阶段四：AI 站点源管理

---

- [ ] **TASK-009 · AI 站点书签 CRUD（Go 侧）**

  > 依赖：TASK-002

  - [ ] 在 `app/storage/bookmark.go` 实现：`ListBookmarks`, `CreateBookmark`, `UpdateBookmark`, `DeleteBookmark`, `ReorderBookmarks`
  - [ ] 实现 favicon 自动获取：尝试从 `<url>/favicon.ico` 获取，失败时使用默认图标
  - [ ] 暴露所有函数为 Wails Bindings
  - [ ] **先写测试**：CRUD 和排序的单元测试（测试数据库使用内存 SQLite）

  **验证方式：**
  ```bash
  go test ./app/storage/... -run TestBookmark -v -cover
  ```

  **验收证据：** 所有书签测试 PASS，覆盖率 ≥ 85%

  _需求: `v1.REQ-001-AC-001` ~ `v1.REQ-001-AC-005`
  _测试类型: Unit

---

- [ ] **TASK-010 · AI 站点管理 UI**

  > 依赖：TASK-006, TASK-009

  - [ ] 创建 `ui/src/features/sites/SiteManager.tsx`：站点列表、添加/编辑表单、删除确认
  - [ ] 实现拖拽排序（使用 `@dnd-kit/core`）
  - [ ] 站点管理面板集成到右侧控制栏
  - [ ] 实现 `useSitesStore`（Zustand）与 `ListBookmarks` / `CreateBookmark` 等 API 对接

  **验证方式：**
  ```bash
  cd ui && pnpm test --run -- --reporter=verbose
  # E2E：Playwright 截图验证添加/删除/排序流程
  ```

  **验收证据：** Playwright 截图完整流程（添加→排序→删除）

  _需求: `v1.REQ-001-AC-001`, `v1.REQ-001-AC-002`, `v1.REQ-001-AC-003`, `v1.REQ-001-AC-004`
  _测试类型: E2E

---

## 阶段五：会话隔离与 WebView 管理

---

- [ ] **TASK-011 · 会话分区管理器**

  > 依赖：TASK-003, TASK-009

  - [ ] 创建 `app/session/partition.go`：`AllocateUserDataPath(siteId string) string` - 生成并创建独立 UserDataPath 目录
  - [ ] 实现 Preload 脚本注入（清除 `navigator.webdriver`，设置真实 Chrome UA）
  - [ ] 集成到 WindowManager，每个视口创建时自动分配会话分区
  - [ ] **先写测试**：路径生成算法的单元测试（确保不同 siteId 路径唯一）

  **验证方式：**
  ```bash
  go test ./app/session/... -v -cover
  # Manual：重启应用后验证 ChatGPT 不需要重新登录
  ```

  **验收证据：** 单元测试 PASS；Manual 测试记录（重启持久登录）

  _需求: `v1.REQ-008-AC-001`, `v1.REQ-008-AC-002`, `v1.REQ-008-AC-003`
  _测试类型: Unit + Manual

---

## 阶段六：Prompt 广播

---

- [ ] **TASK-012 · Prompt 注入适配器（各 AI 平台）**

  > 依赖：TASK-011

  - [ ] 创建 `app/broadcast/injector.go`：`InjectAndSubmit(platform string, text string) error`
  - [ ] 实现各平台注入脚本（ChatGPT / Claude / Gemini / DeepSeek），封装为 Go 常量字符串
  - [ ] 创建 `app/broadcast/broadcaster.go`：并发向所有可见视口调用 `ExecuteJavaScript`
  - [ ] 暴露 Wails Binding：`BroadcastPrompt(text string, ids []string) BroadcastResult`
  - [ ] **先写测试**：注入脚本生成逻辑的单元测试（验证脚本字符串包含正确选择器）

  **验证方式：**
  ```bash
  go test ./app/broadcast/... -v -cover
  ```

  **验收证据：** 单元测试 PASS，覆盖 4 个平台适配器

  _需求: `v1.REQ-004-AC-001`, `v1.REQ-004-AC-002`, `v1.REQ-004-AC-003`
  _测试类型: Unit

---

- [ ] **TASK-013 · 底栏 Prompt 输入区 + 广播 UI**

  > 依赖：TASK-006, TASK-012

  - [ ] 创建 `ui/src/components/PromptBar/` 组件：输入框 + 广播按钮 + 优化按钮
  - [ ] 实现 `Ctrl+Enter` 触发广播的快捷键绑定
  - [ ] 广播成功后显示动画反馈；失败时显示错误提示
  - [ ] 输入框为空时点击广播，显示抖动提示（不发送）
  - [ ] 编写组件测试（空输入验证、广播成功状态）

  **验证方式：**
  ```bash
  cd ui && pnpm test --run -- features/broadcast
  # E2E：Playwright 截图验证广播流程（输入→广播→成功动画）
  ```

  **验收证据：** Playwright 截图，4 视口同时填充截图

  _需求: `v1.REQ-004-AC-001`, `v1.REQ-004-AC-003`
  _测试类型: E2E

---

## 阶段七：LLM API 配置

---

- [ ] **TASK-014 · LLM API 客户端（Go 侧）**

  > 依赖：TASK-003

  - [ ] 创建 `app/llm/client.go`：OpenAI 兼容 HTTP 客户端（`/v1/chat/completions`）
  - [ ] 实现 `app/llm/keychain.go`：`SaveAPIKey(id, key string) error` 和 `GetAPIKey(id string) (string, error)`（跨平台密钥链）
  - [ ] 实现 `TestConnection(providerId string) ConnectionResult`：发送最小测试请求
  - [ ] 确保日志中 API Key 脱敏
  - [ ] 添加 `zalando/go-keyring` 依赖
  - [ ] **先写测试**：HTTP 客户端（Mock HTTP Server）、密钥脱敏逻辑

  **验证方式：**
  ```bash
  go test ./app/llm/... -v -cover
  # 期望：覆盖率 ≥ 90%
  ```

  **验收证据：** 测试全 PASS，密钥脱敏单元测试截图

  _需求: `v1.REQ-005-AC-001` ~ `v1.REQ-005-AC-005`
  _测试类型: Unit

---

- [ ] **TASK-015 · LLM 设置 UI**

  > 依赖：TASK-006, TASK-014

  - [ ] 创建 `ui/src/features/llm/LLMSettings.tsx`：提供商列表 + 添加/编辑表单
  - [ ] 实现连接测试按钮（绿色/红色状态反馈）
  - [ ] 本地 Ollama 场景：API Key 字段可为空
  - [ ] 实现激活提供商切换下拉

  **验证方式：**
  ```bash
  # E2E：Playwright 截图验证完整设置流程
  ```

  **验收证据：** Playwright 截图（配置→测试连接→成功徽章）

  _需求: `v1.REQ-005-AC-001`, `v1.REQ-005-AC-002`, `v1.REQ-005-AC-004`, `v1.REQ-005-AC-005`
  _测试类型: E2E

---

## 阶段八：Prompt 优化

---

- [ ] **TASK-016 · Prompt 优化 Go 服务**

  > 依赖：TASK-014

  - [ ] 创建 `app/llm/optimizer.go`：`OptimizePrompt(original string) OptimizeResult`
  - [ ] 编写 system prompt 模板（指导 LLM 优化用户 Prompt，返回改写后文本）
  - [ ] 实现错误处理：API 超时（30s）、连接失败等
  - [ ] 暴露 Wails Binding：`OptimizePrompt`
  - [ ] **先写测试**：系统 Prompt 构建、错误场景处理

  **验证方式：**
  ```bash
  go test ./app/llm/... -run TestOptimizer -v
  ```

  **验收证据：** 单元测试 PASS（Mock LLM 响应）

  _需求: `v1.REQ-006-AC-004`, `v1.REQ-006-AC-005`
  _测试类型: Unit

---

- [ ] **TASK-017 · Prompt 优化 UI（Diff 预览面板）**

  > 依赖：TASK-013, TASK-016

  - [ ] 在 PromptBar 添加「✨ Optimize」按钮（500ms 防抖）
  - [ ] 创建 `ui/src/features/llm/OptimizePreview.tsx`：Diff 对比面板（原文 vs 优化后）
  - [ ] 实现确认/取消逻辑（确认替换底栏内容，取消还原）
  - [ ] LLM 调用中显示 Loading 状态；失败显示错误 Toast
  - [ ] 编写防抖单元测试

  **验证方式：**
  ```bash
  cd ui && pnpm test --run -- features/llm
  # E2E：Playwright 截图（输入→优化→Diff预览→确认）
  ```

  **验收证据：** Playwright 截图完整流程，防抖单元测试 PASS

  _需求: `v1.REQ-006-AC-001` ~ `v1.REQ-006-AC-005`
  _测试类型: Unit + E2E

---

## 阶段九：保存为 Markdown

---

- [ ] **TASK-018 · 页面内容提取器**

  > 依赖：TASK-011

  - [ ] 创建 `app/content/extractor.go`：向指定视口注入 JS 提取对话内容
  - [ ] 为 ChatGPT / Claude / Gemini / DeepSeek 分别实现 DOM 选择器提取规则
  - [ ] 创建 `app/content/markdown.go`：将提取结果格式化为 Markdown（`## User / ## Assistant` 段落）
  - [ ] 实现降级：提取失败时返回 `fallback: true`，提示用户手动复制
  - [ ] **先写测试**：Markdown 格式化函数的单元测试（给定 HTML → 期望 MD 字符串）

  **验证方式：**
  ```bash
  go test ./app/content/... -v -cover
  ```

  **验收证据：** 格式化单元测试全 PASS，覆盖 4 个平台

  _需求: `v1.REQ-007-AC-003`, `v1.REQ-007-AC-004`
  _测试类型: Unit

---

- [ ] **TASK-019 · 保存为 Markdown UI + 文件写入**

  > 依赖：TASK-006, TASK-018

  - [ ] 在视口工具栏添加「Save as MD」按钮
  - [ ] 实现 `SaveMarkdown(content, defaultName string)` Wails Binding（调用 Wails 文件对话框 API）
  - [ ] 默认文件名格式：`YYYY-MM-DD-HH-mm-<sitename>.md`
  - [ ] 保存成功后底部显示成功通知；失败显示错误 Toast

  **验证方式：**
  ```bash
  # E2E：Playwright 截图验证保存流程
  # 验证写入的 .md 文件内容格式正确
  ```

  **验收证据：** Playwright 截图（触发→对话框→保存成功通知）；写入文件内容截图

  _需求: `v1.REQ-007-AC-001`, `v1.REQ-007-AC-002`, `v1.REQ-007-AC-003`
  _测试类型: E2E

---

## 阶段十：主题皮肤系统

---

- [ ] **TASK-020 · 主题 Token 系统与 6 款预设皮肤**

  > 依赖：TASK-001

  - [ ] 创建 `ui/src/config/themes.ts`：定义 6 款预设主题的颜色 Token（`Dark Obsidian` / `Light Pure` / `Cyberpunk Neon` / `Midnight Blue` / `Sunset Glow` / `Forest Sage`）
  - [ ] 创建 `ui/src/components/ThemeProvider/ThemeProvider.tsx`：将 Token 注入 CSS 变量
  - [ ] 实现 `useThemeStore`（Zustand）管理当前主题和个性化参数
  - [ ] 实现主题切换时无闪烁（CSS 变量过渡）
  - [ ] Windows 11：通过 Wails API 启用 Mica 材质

  **验证方式：**
  ```bash
  cd ui && pnpm test --run -- components/ThemeProvider
  # E2E：Playwright 截图验证 6 款主题切换无闪烁
  ```

  **验收证据：** Playwright 截图（每款主题截图一张，共 6 张）

  _需求: `v1.REQ-009-AC-001`, `v1.REQ-009-AC-002`, `v1.REQ-009-AC-003`
  _测试类型: E2E + Manual

---

## 阶段十一：全分辨率兼容与收尾

---

- [ ] **TASK-021 · 窗口尺寸预设与防幽灵窗口**

  > 依赖：TASK-005

  - [ ] 实现 `app/window/dpi.go`：多显示器枚举、上次使用显示器检测、幽灵窗口回退逻辑
  - [ ] 实现窗口尺寸预设切换（1080P/2K/4K/带鱼屏），对应 `SetLayout` + `SetWindowSize`
  - [ ] 实现窗口位置/尺寸记忆（应用退出时写入 config.json）
  - [ ] **先写测试**：显示器枚举和回退逻辑的单元测试

  **验证方式：**
  ```bash
  go test ./app/window/... -run TestDPI -v
  # Manual：拔掉副屏后重启验证不出现幽灵窗口
  ```

  **验收证据：** 单元测试 PASS；Manual 幽灵窗口测试记录

  _需求: `v1.REQ-010-AC-001`, `v1.REQ-010-AC-002`
  _测试类型: Unit + Manual

---

- [ ] **TASK-022 · Prompt 知识库 UI**

  > 依赖：TASK-002, TASK-006

  - [ ] 创建 `ui/src/features/prompt-library/PromptLibrary.tsx`：列表 + 搜索 + 添加/删除
  - [ ] `Ctrl+Shift+P` 快捷键唤出知识库抽屉
  - [ ] 实现 FTS 搜索（输入 debounce 300ms）
  - [ ] 点击 Prompt 直接填入底栏输入框

  **验证方式：**
  ```bash
  # E2E：Playwright 截图验证搜索和填入流程
  ```

  **验收证据：** Playwright 截图（搜索→选择→填入底栏）

  _需求: `v1.REQ-011-AC-001`, `v1.REQ-011-AC-002`
  _测试类型: E2E

---

- [ ] **TASK-023 · 打包与跨平台验证**

  > 依赖：所有前置任务完成

  - [ ] Windows：执行 `wails build -clean`，验证 `.exe` 打包产物
  - [ ] macOS：执行 `wails build -clean`，验证 `.app` 打包产物
  - [ ] 验证打包后应用数据路径正确（`%APPDATA%/AIMux/`）
  - [ ] 回归测试：所有 Manual 验收项再执行一遍
  - [ ] 整理所有测试报告，写入 `docs/spec/versions/v1/reports/`

  **验证方式：**
  ```bash
  wails build -clean
  # 安装打包产物，手动测试全部 Manual 验收项
  ```

  **验收证据：** Windows + macOS 打包截图；全量 Manual 测试记录

  _需求：全量 REQ
  _测试类型: Manual

---

## 进度汇总

| TASK ID | 名称 | 测试类型 | 状态 | 关联需求 |
|---------|------|:-------:|:----:|---------:|
| TASK-001 | 初始化项目工程骨架 | Manual | ⬜ 待开始 | 无 |
| TASK-002 | SQLite 数据库层初始化 | Unit | ⬜ 待开始 | REQ-001, REQ-011 |
| TASK-003 | 应用配置读写模块 | Unit | ⬜ 待开始 | REQ-009, REQ-010 |
| TASK-004 | 自适应 Zoom 算法 | Unit | ⬜ 待开始 | REQ-002 |
| TASK-005 | Go 窗口管理器 | Unit+E2E | ⬜ 待开始 | REQ-002 |
| TASK-006 | 前端布局 UI | E2E | ⬜ 待开始 | REQ-002 |
| TASK-007 | 全局快捷键管理器 | Unit+Manual | ⬜ 待开始 | REQ-003 |
| TASK-008 | Spotlight 悬浮窗 | E2E+Manual | ⬜ 待开始 | REQ-003 |
| TASK-009 | AI 站点书签 CRUD | Unit | ⬜ 待开始 | REQ-001 |
| TASK-010 | AI 站点管理 UI | E2E | ⬜ 待开始 | REQ-001 |
| TASK-011 | 会话分区管理器 | Unit+Manual | ⬜ 待开始 | REQ-008 |
| TASK-012 | Prompt 注入适配器 | Unit | ⬜ 待开始 | REQ-004 |
| TASK-013 | 底栏 Prompt 输入区 | E2E | ⬜ 待开始 | REQ-004 |
| TASK-014 | LLM API 客户端 | Unit | ⬜ 待开始 | REQ-005 |
| TASK-015 | LLM 设置 UI | E2E | ⬜ 待开始 | REQ-005 |
| TASK-016 | Prompt 优化 Go 服务 | Unit | ⬜ 待开始 | REQ-006 |
| TASK-017 | Prompt 优化 UI | Unit+E2E | ⬜ 待开始 | REQ-006 |
| TASK-018 | 页面内容提取器 | Unit | ⬜ 待开始 | REQ-007 |
| TASK-019 | 保存为 Markdown UI | E2E | ⬜ 待开始 | REQ-007 |
| TASK-020 | 主题皮肤系统 | E2E+Manual | ⬜ 待开始 | REQ-009 |
| TASK-021 | 窗口预设与防幽灵窗口 | Unit+Manual | ⬜ 待开始 | REQ-010 |
| TASK-022 | Prompt 知识库 UI | E2E | ⬜ 待开始 | REQ-011 |
| TASK-023 | 打包与跨平台验证 | Manual | ⬜ 待开始 | 全量 |

