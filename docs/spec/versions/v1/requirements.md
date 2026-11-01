# 需求文档（Requirements）

> 文件路径：`docs/spec/versions/v1/requirements.md`
> 版本：v1 · 日期：2026-11-01
> 状态：已定稿

---

## 介绍

**AIMux** 是一款跨平台桌面级多 AI 视角工作台，基于 Go + Wails v3 + React + TypeScript 构建。

核心目标：解决用户在多个 AI 网页服务之间频繁切换、登录态冲突、提示词复用成本高、缺乏快速调用入口等问题。提供统一的多视口工作台、一键广播、Prompt 优化、AI 站点源管理、内容保存为 Markdown 等能力。

---

## 需求列表

---

### 需求 REQ-001 · AI 站点源管理

**用户故事：** 作为用户，我希望能够添加、编辑、排序和删除 AI 站点源，以便自由定制我的工作台使用哪些 AI 服务。

#### 验收标准

```yaml
- id: REQ-001-AC-001
  ears: >
    When the user opens the site manager panel and adds a new AI site with a name and URL,
    the system shall save the site configuration and display it in the site list.
  test_type: E2E
  expected:
    ui_state: "新站点出现在站点列表中，显示站点名称和图标"
    side_effects:
      - "站点信息持久化到 SQLite bookmarks 表"
      - "站点可在视口选择器中被选择激活"

- id: REQ-001-AC-002
  ears: >
    When the user edits an existing AI site's name, URL, or icon,
    the system shall update the site configuration and refresh all related viewports.
  test_type: E2E
  expected:
    ui_state: "站点列表显示更新后的信息"
    side_effects:
      - "SQLite bookmarks 表记录已更新"

- id: REQ-001-AC-003
  ears: >
    When the user deletes an AI site,
    the system shall remove it from the site list and close any active viewport using that site.
  test_type: E2E
  expected:
    ui_state: "站点从列表中消失，相关视口关闭"
    side_effects:
      - "SQLite bookmarks 表记录已删除"

- id: REQ-001-AC-004
  ears: >
    When the user drags and drops a site in the list to reorder,
    the system shall persist the new order.
  test_type: E2E
  expected:
    ui_state: "列表按新顺序排列"
    side_effects:
      - "新排列顺序持久化到数据库"

- id: REQ-001-AC-005
  ears: >
    When the system saves a new AI site with a URL,
    the site manager shall attempt to fetch and cache the site's favicon as the icon.
  test_type: Unit
  expected:
    return_value: "favicon URL 字符串或默认图标 URL"
    side_effects: []
```

---

### 需求 REQ-002 · 多视口同屏布局

**用户故事：** 作为用户，我希望在主工作台同屏显示 1~4 个 AI 网站视口，并支持多种布局模式，以便同时对比多个 AI 的回答。

#### 验收标准

```yaml
- id: REQ-002-AC-001
  ears: >
    When the user selects a layout mode (1/2/4-grid/ultrawide/main-sub),
    the system shall arrange active viewports according to the selected layout within 100ms.
  test_type: E2E
  expected:
    ui_state: "视口按选定布局模式排列，无闪烁"
    side_effects:
      - "布局模式持久化到 config.json"

- id: REQ-002-AC-002
  ears: >
    When the user drags the splitter between viewports,
    the system shall dynamically recalculate and update viewport bounds in real time.
  test_type: E2E
  expected:
    ui_state: "分割条拖拽时视口实时调整大小，显示尺寸提示气泡"
    side_effects: []

- id: REQ-002-AC-003
  ears: >
    When the available viewport width falls below 850px,
    the adaptive zoom module shall calculate a zoom factor ≥ 0.75 to prevent mobile layout collapse.
  test_type: Unit
  expected:
    return_value: "number，满足：width < 850 时 zoom = max(0.75, width/850)；width ≥ 850 时 zoom = 1.0"
    throws: null
    side_effects: []

- id: REQ-002-AC-004
  ears: >
    When a viewport is detached by the user,
    the system shall open it as an independent desktop window maintaining its session.
  test_type: E2E
  expected:
    ui_state: "分离后的视口以独立窗口显示，与主工作台并行"
    side_effects:
      - "分离窗口保留原有会话和 UserDataPath"
```

---

### 需求 REQ-003 · 全局与应用内快捷键

**用户故事：** 作为用户，我希望通过全局快捷键随时唤出 AI 悬浮窗，以及使用应用内快捷键切换布局和广播 Prompt，以便提高操作效率。

#### 验收标准

```yaml
- id: REQ-003-AC-001
  ears: >
    When the user presses the global spotlight hotkey (default: Alt+Space) from any application,
    the system shall display the Spotlight floating window at the center of the current screen within 150ms.
  test_type: Manual
  expected:
    checklist:
      - "Alt+Space 在任何前台应用（包括全屏游戏）下均可触发"
      - "悬浮窗在 150ms 内弹出并居中于当前鼠标所在屏幕"
      - "悬浮窗自动获取输入焦点"

- id: REQ-003-AC-002
  ears: >
    When the user presses Ctrl+1 through Ctrl+5 within the application,
    the system shall switch to the corresponding layout mode immediately.
  test_type: E2E
  expected:
    ui_state: "布局在 100ms 内切换完毕"
    side_effects: []

- id: REQ-003-AC-003
  ears: >
    When a hotkey conflict is detected during registration,
    the system shall display a warning and fall back to an alternative key combination.
  test_type: Unit
  expected:
    return_value: "{ success: false, conflict: string, fallback: string }"
    throws: null
    side_effects:
      - "设置界面醒目标红提示冲突快捷键"

- id: REQ-003-AC-004
  ears: >
    When the user modifies a hotkey in the settings,
    the system shall immediately apply the new hotkey without requiring restart.
  test_type: E2E
  expected:
    ui_state: "新快捷键立即生效，旧快捷键失效"
    side_effects:
      - "新快捷键配置持久化到 config.json"
```

---

### 需求 REQ-004 · 一键 Prompt 广播（Multi-Send）

**用户故事：** 作为用户，我希望在底栏或悬浮窗输入一段 Prompt 后，一键并发发送给所有可见 AI 视口，以便同时获取多个 AI 的回答。

#### 验收标准

```yaml
- id: REQ-004-AC-001
  ears: >
    When the user triggers broadcast (Ctrl+Enter or click) with text in the prompt bar,
    the system shall inject and submit the prompt to all visible viewports within 300ms.
  test_type: E2E
  expected:
    ui_state: "所有可见视口在 300ms 内开始填充并提交 Prompt，底栏显示成功动画"
    side_effects:
      - "广播记录写入 SQLite history 表"

- id: REQ-004-AC-002
  ears: >
    When broadcasting to a ChatGPT viewport,
    the injection module shall locate the ProseMirror/textarea input and trigger a native input event.
  test_type: Unit
  expected:
    return_value: "boolean true（注入成功）"
    throws: null
    side_effects:
      - "ChatGPT 输入框显示 Prompt 文本，发送按钮可点击"

- id: REQ-004-AC-003
  ears: >
    When the broadcast prompt bar is empty and the user triggers broadcast,
    the system shall not send and display a hint message.
  test_type: E2E
  expected:
    ui_state: "输入框抖动提示，不发送"
    side_effects: []
```

---

### 需求 REQ-005 · LLM API 配置

**用户故事：** 作为用户，我希望配置 LLM API（支持 OpenAI 兼容接口和本地 Ollama/LM Studio），以便在应用内使用 AI 能力（如 Prompt 优化）。

#### 验收标准

```yaml
- id: REQ-005-AC-001
  ears: >
    When the user opens LLM settings and enters a provider name, base URL, API key, and model name,
    the system shall save the configuration and display a connection test button.
  test_type: E2E
  expected:
    ui_state: "配置保存成功，显示「Test Connection」按钮"
    side_effects:
      - "API Key 加密后存储到系统密钥链（Windows DPAPI / macOS Keychain）"
      - "其他配置项持久化到 config.json（不含明文 Key）"

- id: REQ-005-AC-002
  ears: >
    When the user clicks the connection test button,
    the system shall send a minimal test request to the configured endpoint and display the result within 10s.
  test_type: E2E
  expected:
    ui_state: "测试成功显示绿色「Connected」徽章；失败显示红色错误提示"
    side_effects: []

- id: REQ-005-AC-003
  ears: >
    When the LLM client sends a request,
    the system shall never log or expose the API key in plain text.
  test_type: Unit
  expected:
    return_value: "请求头中 Authorization 字段存在且值以 Bearer sk- 开头"
    throws: null
    side_effects:
      - "日志中 API Key 显示为 sk-****"

- id: REQ-005-AC-004
  ears: >
    When the user configures a local Ollama endpoint (e.g., http://localhost:11434/v1),
    the system shall support it without requiring an API key.
  test_type: E2E
  expected:
    ui_state: "API Key 字段可为空，连接测试成功"
    side_effects: []

- id: REQ-005-AC-005
  ears: >
    When multiple LLM providers are configured,
    the system shall allow the user to select the active provider for Prompt optimization.
  test_type: E2E
  expected:
    ui_state: "设置页面显示提供商列表，可切换当前激活的提供商"
    side_effects:
      - "激活提供商选择持久化到 config.json"
```

---

### 需求 REQ-006 · Prompt 优化与补充

**用户故事：** 作为用户，我希望在底栏输入 Prompt 草稿后，点击「✨ 优化」按钮由 LLM 自动改写和扩展 Prompt，确认后再广播发送，以便提升提问质量。

#### 验收标准

```yaml
- id: REQ-006-AC-001
  ears: >
    When the user clicks the optimize button with text in the prompt bar,
    the system shall call the configured LLM API and display a diff preview of the optimized prompt within 30s.
  test_type: E2E
  expected:
    ui_state: "弹出预览面板，显示原始 Prompt 与优化后 Prompt 的对比（diff 高亮）"
    side_effects: []

- id: REQ-006-AC-002
  ears: >
    When the user confirms the optimized prompt in the preview panel,
    the system shall replace the prompt bar content with the optimized version.
  test_type: E2E
  expected:
    ui_state: "底栏 Prompt 被替换为优化后内容，预览面板关闭"
    side_effects: []

- id: REQ-006-AC-003
  ears: >
    When the user cancels or discards the optimized prompt,
    the system shall restore the original prompt bar content unchanged.
  test_type: E2E
  expected:
    ui_state: "底栏 Prompt 保持原始内容不变"
    side_effects: []

- id: REQ-006-AC-004
  ears: >
    When the LLM API call fails during optimization,
    the system shall display an error message and keep the original prompt intact.
  test_type: E2E
  expected:
    ui_state: "显示错误提示（如 API 连接失败），底栏内容不变"
    side_effects: []

- id: REQ-006-AC-005
  ears: >
    When the optimize button is clicked,
    the system shall debounce repeated clicks within 500ms to avoid duplicate API calls.
  test_type: Unit
  expected:
    return_value: "500ms 内多次点击只触发一次 API 调用"
    throws: null
    side_effects: []
```

---

### 需求 REQ-007 · 保存内容为 Markdown

**用户故事：** 作为用户，我希望将当前 AI 对话内容（页面文本/截图 OCR/剪贴板）提取并保存为本地 Markdown 文件，以便归档和复用 AI 的输出。

#### 验收标准

```yaml
- id: REQ-007-AC-001
  ears: >
    When the user clicks "Save as Markdown" on an active viewport,
    the system shall extract the visible conversation text from the page and open a save file dialog.
  test_type: E2E
  expected:
    ui_state: "系统文件保存对话框打开，默认文件名格式为 YYYY-MM-DD-HH-mm-<sitename>.md"
    side_effects: []

- id: REQ-007-AC-002
  ears: >
    When the user confirms the save location,
    the system shall write a valid Markdown file containing the extracted conversation content.
  test_type: E2E
  expected:
    ui_state: "文件保存成功，底部显示成功通知"
    side_effects:
      - "Markdown 文件已写入用户指定路径"
      - "文件内容包含：AI 站点名称、提取时间戳、对话内容（用户消息/AI 回复格式化为 Markdown）"

- id: REQ-007-AC-003
  ears: >
    When the page text extraction fails (e.g., content is inside a canvas or heavy JS framework),
    the system shall fall back to clipboard content or show a manual copy prompt.
  test_type: E2E
  expected:
    ui_state: "降级提示弹出，提示用户手动复制内容后使用剪贴板保存选项"
    side_effects: []

- id: REQ-007-AC-004
  ears: >
    When extracting conversation content from a supported AI site (ChatGPT, Claude, Gemini, DeepSeek),
    the extraction module shall correctly identify user messages and AI responses and format them as Markdown.
  test_type: Unit
  expected:
    return_value: "string，格式为 Markdown，包含 ## User 和 ## Assistant 段落"
    throws: null
    side_effects: []
```

---

### 需求 REQ-008 · 会话物理隔离与持久化

**用户故事：** 作为用户，我希望每个 AI 视口拥有独立的登录会话，重启应用后不需要重新登录，以便持续使用多个 AI 账号。

#### 验收标准

```yaml
- id: REQ-008-AC-001
  ears: >
    When a new viewport is created for an AI site,
    the system shall assign a unique UserDataPath directory for that viewport's session.
  test_type: Unit
  expected:
    return_value: "string 路径，格式为 %APPDATA%/AIMux/sessions/<site-id>-<hash>/"
    throws: null
    side_effects:
      - "目录在首次创建时自动生成"

- id: REQ-008-AC-002
  ears: >
    When the application restarts after a user has logged into an AI site,
    the system shall restore the session without requiring re-login.
  test_type: Manual
  expected:
    checklist:
      - "重启应用后，已登录的 ChatGPT / Claude / Gemini 视口无需重新登录"
      - "页面直接显示已登录状态和历史对话"

- id: REQ-008-AC-003
  ears: >
    When two viewports for the same AI site are active simultaneously,
    the system shall maintain independent sessions for each viewport.
  test_type: Manual
  expected:
    checklist:
      - "两个 ChatGPT 视口可以使用不同账号同时登录，互不干扰"
```

---

### 需求 REQ-009 · 皮肤主题与个性化

**用户故事：** 作为用户，我希望从 6 款预设主题中选择外观风格，并自定义透明度、模糊度和强调色，以便获得个性化的工作台体验。

#### 验收标准

```yaml
- id: REQ-009-AC-001
  ears: >
    When the user switches between preset themes,
    the system shall apply the new theme to all UI elements within 200ms without flickering.
  test_type: E2E
  expected:
    ui_state: "所有外壳、抽屉、边框与按钮颜色 100% 同步切换，无白屏/闪烁"
    side_effects:
      - "主题选择持久化到 config.json"

- id: REQ-009-AC-002
  ears: >
    When the user adjusts the window opacity slider (70%~100%),
    the system shall update the window transparency in real time.
  test_type: E2E
  expected:
    ui_state: "窗口透明度实时变化，平滑过渡"
    side_effects: []

- id: REQ-009-AC-003
  ears: >
    When the application launches on Windows 11,
    the system shall enable Mica material for the main window background.
  test_type: Manual
  expected:
    checklist:
      - "Windows 11 下主窗口背景显示 Mica 材质（云母效果，可透过桌面壁纸）"
```

---

### 需求 REQ-010 · 全分辨率兼容与窗口管理

**用户故事：** 作为用户，我希望应用能在 1080P 到 4K 等各种分辨率和多显示器环境下正常显示，并记忆窗口位置，以便在任何设备上获得一致体验。

#### 验收标准

```yaml
- id: REQ-010-AC-001
  ears: >
    When the application starts after the previously used monitor has been disconnected,
    the system shall reposition the window to the center of the primary monitor.
  test_type: Manual
  expected:
    checklist:
      - "拔掉副屏后重启应用，窗口出现在主屏幕中央，不出现在屏幕外（幽灵窗口）"

- id: REQ-010-AC-002
  ears: >
    When the user selects a resolution preset (e.g., 2K Comfort),
    the system shall resize and center the window to the preset dimensions within 200ms.
  test_type: E2E
  expected:
    ui_state: "窗口平滑调整到预设尺寸并居中"
    side_effects:
      - "预设选择持久化到 config.json"
```

---

### 需求 REQ-011 · Prompt 知识库（本地存储与检索）

**用户故事：** 作为用户，我希望保存常用 Prompt 到本地知识库，并能快速搜索和复用，以便减少重复输入。

#### 验收标准

```yaml
- id: REQ-011-AC-001
  ears: >
    When the user saves a prompt with a title and content,
    the system shall store it in SQLite and make it searchable.
  test_type: Unit
  expected:
    return_value: "{ id: number, title: string, content: string, createdAt: string }"
    throws: null
    side_effects:
      - "记录插入 SQLite prompts 表和 prompts_fts 全文检索表"

- id: REQ-011-AC-002
  ears: >
    When the user types in the prompt search box,
    the system shall return matching results from the FTS index within 100ms.
  test_type: Unit
  expected:
    return_value: "Prompt[] 数组，按相关性排序"
    throws: null
    side_effects: []
```

