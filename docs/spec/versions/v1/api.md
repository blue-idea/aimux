# Go-前端接口设计（API / Wails Bindings）

> 文件路径：`docs/spec/versions/v1/api.md`
> 版本：v1 · 日期：2026-11-01
> 说明：本项目为纯桌面应用，无 HTTP 服务端。所有前后端通信通过 **Wails Bindings** 实现（Go 函数暴露给前端 JS 调用）。

---

## 接口总览

| 模块 | 函数名 | 方向 | 说明 |
|------|--------|------|------|
| 窗口管理 | `ShowSpotlight` | 前端→Go | 显示/隐藏 Spotlight 悬浮窗 |
| 窗口管理 | `SetLayout` | 前端→Go | 切换布局模式 |
| 窗口管理 | `DetachViewport` | 前端→Go | 视口分离为独立窗口 |
| 窗口管理 | `SetViewportBounds` | 前端→Go | 更新视口物理像素位置 |
| 广播 | `BroadcastPrompt` | 前端→Go | 向指定视口注入并提交 Prompt |
| LLM | `OptimizePrompt` | 前端→Go | 调用 LLM API 优化 Prompt |
| LLM | `TestLLMConnection` | 前端→Go | 测试 LLM 提供商连接 |
| LLM | `SaveLLMProvider` | 前端→Go | 保存 LLM 提供商配置和密钥 |
| LLM | `ListLLMProviders` | 前端→Go | 获取所有 LLM 提供商列表 |
| 内容保存 | `ExtractPageContent` | 前端→Go | 提取指定视口的页面对话内容 |
| 内容保存 | `SaveMarkdown` | 前端→Go | 打开保存对话框并写入 MD 文件 |
| 站点管理 | `ListBookmarks` | 前端→Go | 获取所有 AI 站点书签 |
| 站点管理 | `CreateBookmark` | 前端→Go | 新增 AI 站点 |
| 站点管理 | `UpdateBookmark` | 前端→Go | 修改 AI 站点信息 |
| 站点管理 | `DeleteBookmark` | 前端→Go | 删除 AI 站点 |
| 站点管理 | `ReorderBookmarks` | 前端→Go | 更新站点排序 |
| Prompt 库 | `ListPrompts` | 前端→Go | 获取 Prompt 列表（支持 FTS 搜索） |
| Prompt 库 | `CreatePrompt` | 前端→Go | 新增 Prompt |
| Prompt 库 | `DeletePrompt` | 前端→Go | 删除 Prompt |
| 配置 | `GetConfig` | 前端→Go | 读取完整配置 |
| 配置 | `SaveConfig` | 前端→Go | 保存完整配置 |
| 快捷键 | `RegisterHotkey` | 前端→Go | 注册/更新全局快捷键 |
| 事件 | `OnHotkeyTriggered` | Go→前端 | 快捷键触发事件通知 |
| 事件 | `OnWindowMoved` | Go→前端 | 窗口移动/DPI 变更事件 |

---

## 接口详细定义

### 窗口管理

#### `ShowSpotlight(visible bool) error`
```typescript
// 显示或隐藏 Spotlight 悬浮窗
// 参数：visible - true 显示，false 隐藏
// 返回：null 成功，string 错误消息
ShowSpotlight(visible: boolean): Promise<void>
```

#### `SetLayout(layout string) error`
```typescript
// 切换主工作台布局模式
// layout: "single" | "double" | "grid4" | "ultrawide" | "main-sub"
SetLayout(layout: LayoutMode): Promise<void>
```

#### `DetachViewport(viewportId string) error`
```typescript
// 将视口分离为独立窗口
// viewportId: 视口对应的 site_id
DetachViewport(viewportId: string): Promise<void>
```

#### `SetViewportBounds(viewportId string, bounds ViewportBounds) error`
```typescript
// 更新视口物理像素坐标（前端布局计算后调用）
interface ViewportBounds {
  x: number;      // 物理像素 X
  y: number;      // 物理像素 Y
  width: number;  // 物理像素宽
  height: number; // 物理像素高
}
SetViewportBounds(viewportId: string, bounds: ViewportBounds): Promise<void>
```

---

### 广播

#### `BroadcastPrompt(text string, viewportIds []string) BroadcastResult`
```typescript
interface BroadcastResult {
  successCount: number;         // 成功注入的视口数
  failedViewports: string[];    // 注入失败的 site_id 列表
}
BroadcastPrompt(text: string, viewportIds: string[]): Promise<BroadcastResult>
```

---

### LLM 接口

#### `OptimizePrompt(original string) OptimizeResult`
```typescript
interface OptimizeResult {
  optimized: string;   // 优化后的 Prompt 文本
  error?: string;      // 错误消息（失败时）
}
OptimizePrompt(original: string): Promise<OptimizeResult>
```

#### `TestLLMConnection(providerId string) ConnectionResult`
```typescript
interface ConnectionResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}
TestLLMConnection(providerId: string): Promise<ConnectionResult>
```

#### `SaveLLMProvider(provider LLMProviderInput) error`
```typescript
interface LLMProviderInput {
  id?: string;        // 更新时提供，新建时省略
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;    // 本地 Ollama 可为空
}
SaveLLMProvider(provider: LLMProviderInput): Promise<void>
```

#### `ListLLMProviders() LLMProvider[]`
```typescript
interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean; // 是否已配置 Key（不返回明文）
}
ListLLMProviders(): Promise<LLMProvider[]>
```

---

### 内容保存

#### `ExtractPageContent(viewportId string) ExtractResult`
```typescript
interface ExtractResult {
  markdown: string;    // 提取到的 Markdown 内容
  fallback: boolean;   // true 表示降级为剪贴板内容
  error?: string;
}
ExtractPageContent(viewportId: string): Promise<ExtractResult>
```

#### `SaveMarkdown(content string, defaultName string) error`
```typescript
// 打开系统文件保存对话框，写入 Markdown 文件
// defaultName: 建议文件名，如 "2026-11-01-chatgpt.md"
SaveMarkdown(content: string, defaultName: string): Promise<void>
```

---

### 站点书签

#### `ListBookmarks() Bookmark[]`
```typescript
interface Bookmark {
  id: number;
  siteId: string;
  name: string;
  url: string;
  iconUrl?: string;
  sortOrder: number;
  sessionKey: string;
}
ListBookmarks(): Promise<Bookmark[]>
```

#### `CreateBookmark(input BookmarkInput) Bookmark`
```typescript
interface BookmarkInput {
  name: string;
  url: string;
  iconUrl?: string;
}
CreateBookmark(input: BookmarkInput): Promise<Bookmark>
```

#### `UpdateBookmark(id number, input BookmarkInput) error`
```typescript
UpdateBookmark(id: number, input: BookmarkInput): Promise<void>
```

#### `DeleteBookmark(id number) error`
```typescript
DeleteBookmark(id: number): Promise<void>
```

#### `ReorderBookmarks(orderedIds []int) error`
```typescript
// 传入按新顺序排列的书签 ID 数组
ReorderBookmarks(orderedIds: number[]): Promise<void>
```

---

### Prompt 知识库

#### `ListPrompts(query string) Prompt[]`
```typescript
interface Prompt {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number; // Unix 时间戳
}
// query 为空时返回全部；非空时执行 FTS5 搜索
ListPrompts(query: string): Promise<Prompt[]>
```

#### `CreatePrompt(input PromptInput) Prompt`
```typescript
interface PromptInput {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}
CreatePrompt(input: PromptInput): Promise<Prompt>
```

#### `DeletePrompt(id number) error`
```typescript
DeletePrompt(id: number): Promise<void>
```

---

### 配置

#### `GetConfig() AppConfig`
```typescript
// 返回 config.json 的内容（不含明文 API Key）
GetConfig(): Promise<AppConfig>
```

#### `SaveConfig(config AppConfig) error`
```typescript
SaveConfig(config: AppConfig): Promise<void>
```

---

### 快捷键

#### `RegisterHotkey(action string, combo string) HotkeyResult`
```typescript
interface HotkeyResult {
  success: boolean;
  conflict?: string;  // 冲突的软件名或已注册的组合键
  fallback?: string;  // 系统建议的备选组合键
}
RegisterHotkey(action: string, combo: string): Promise<HotkeyResult>
```

---

### Go → 前端事件（Wails Events）

```typescript
// 全局快捷键触发
Events.On('hotkey:triggered', (action: string) => { ... })

// 窗口 DPI 变更或跨屏移动
Events.On('window:dpi-changed', (dpr: number) => { ... })

// 视口重新附加到主窗口
Events.On('viewport:reattached', (viewportId: string) => { ... })
```

