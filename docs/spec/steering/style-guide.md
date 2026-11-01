# 命名规范 / 错误格式 / 日志（Style Guide）

> 文件路径：`docs/spec/steering/style-guide.md`
> ⚠️ 本文件**不随 version 变更**

---

## 命名规范

### Go（后端）

| 类型 | 规范 | 示例 |
|------|------|------|
| 包名 | 小写单词，无下划线 | `hotkey`, `session`, `llm` |
| 接口名 | 动词或名词 + 后缀 `-er` | `Injector`, `Provider` |
| 结构体 | PascalCase | `WindowManager`, `LLMClient` |
| 函数/方法 | PascalCase（导出）/ camelCase（非导出） | `RegisterHotkey()`, `buildPayload()` |
| 常量 | 全大写下划线（枚举）/ PascalCase | `MAX_VIEWPORTS = 4`, `ThemeDark` |
| 错误变量 | `Err` 前缀 | `ErrAPIKeyMissing` |

### TypeScript / React（前端）

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `ViewportPanel`, `PromptBar` |
| Hooks | `use` 前缀 + PascalCase | `useHotkey`, `useViewportLayout` |
| 类型 / 接口 | PascalCase | `ViewportConfig`, `LLMProvider` |
| 常量 | 全大写下划线 | `DEFAULT_ZOOM_BREAKPOINT` |
| 工具函数 | camelCase | `calculateAdaptiveZoom()` |
| CSS 变量 | `--kebab-case` | `--accent-color`, `--blur-amount` |
| Zustand Store | `use` 前缀 + `Store` 后缀 | `useViewportStore`, `useThemeStore` |

---

## 目录结构规范

```
aimux/
├── main.go                     # Wails 应用入口
├── app/                        # Go 业务逻辑层
│   ├── window/                 # 窗口管理
│   ├── hotkey/                 # 全局快捷键
│   ├── session/                # 会话隔离
│   ├── llm/                    # LLM API 客户端
│   └── storage/                # SQLite + 配置持久化
├── config/                     # 全局常量与配置
├── ui/                         # 前端源码（React + Vite）
│   ├── src/
│   │   ├── components/         # 通用 UI 组件
│   │   ├── features/           # 功能模块（viewport / prompt / theme 等）
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── stores/             # Zustand Stores
│   │   ├── types/              # TypeScript 类型定义
│   │   └── utils/              # 工具函数
│   └── wailsjs/                # Wails 自动生成的 Go bindings
└── docs/                       # 开发文档（含 spec/）
```

---

## 错误格式

### Go 错误

- 使用 `fmt.Errorf("操作说明: %w", err)` 链式包装
- 错误消息使用英文，小写开头，不加标点符号结尾
- 自定义错误类型实现 `error` 接口，结构体名以 `Error` 结尾

```go
// 正确示例
return fmt.Errorf("register hotkey %s: %w", combo, ErrHotkeyConflict)

// 错误示例（中文错误、大写开头）
return fmt.Errorf("注册快捷键失败")
```

### 前端错误

- 用户可见错误消息使用英文
- 错误对象格式：`{ code: string; message: string; detail?: unknown }`
- API 调用失败时，在 UI 层展示友好提示，不暴露原始错误

---

## 日志规范

### Go 日志

- 使用 `log/slog`（Go 标准库结构化日志）
- 日志级别：`Debug`（开发调试）/ `Info`（业务流程）/ `Warn`（降级/重试）/ `Error`（异常）
- 日志消息使用英文，键值对用驼峰命名
- API 密钥等敏感信息必须脱敏后记录

```go
slog.Info("hotkey registered", "combo", combo, "windowID", wid)
slog.Error("llm api call failed", "provider", provider, "err", err)
```

### 前端日志

- 使用 `console.info` / `console.warn` / `console.error`
- 生产构建禁止 `console.log`（ESLint 规则强制）

---

## 配置管理

- 所有常量统一在 `config/` 目录下定义，按模块拆分文件
- 前端常量使用 `const` + 全大写，放在 `ui/src/config/` 目录下
- 禁止在业务逻辑代码中直接使用魔法数字，必须引用具名常量

```typescript
// 正确
import { DEFAULT_ZOOM_BREAKPOINT } from '@/config/viewport';
const zoom = calculateAdaptiveZoom(width, DEFAULT_ZOOM_BREAKPOINT);

// 错误（魔法数字）
const zoom = width < 850 ? width / 850 : 1.0;
```

