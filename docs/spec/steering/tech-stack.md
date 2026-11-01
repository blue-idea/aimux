# 锁定技术栈（Tech Stack）

> 文件路径：`docs/spec/steering/tech-stack.md`
> ⚠️ 本文件**不随 version 变更**。技术栈变更属于重大决策，应升级 version 并记录原因

---

## 主语言

| 层级 | 语言 | 版本 |
|------|------|------|
| 后端 / 系统层 | Go | ≥ 1.22 |
| 前端 | TypeScript | 5.x（严格模式） |

## 桌面框架

- **框架**：Wails v3（多窗口为一等公民）
- **WebView 引擎**：
  - Windows：WebView2（Edge Chromium）
  - macOS：WKWebView
  - Linux：WebKitGTK

## 前端技术栈

| 工具 | 选型 | 版本要求 |
|------|------|---------|
| 框架 | React | 19.x |
| 构建工具 | Vite | 6.x |
| UI 组件库 | shadcn/ui + Tailwind CSS | v4 |
| 状态管理 | Zustand | 5.x |
| 路由 | React Router | v7 |
| 前端目录 | `ui/` | — |

## 包管理

- 前端包管理器：**pnpm**（统一，不混用 npm / yarn）
- 锁文件：`pnpm-lock.yaml` 必须提交到版本控制
- Go 模块：`go.sum` 必须提交，禁止使用 `replace` 绕过
- 禁止使用任何 beta / rc / alpha 版本

## TypeScript 规范

- 启用严格模式（`strict: true`）
- 禁止使用 `any` 和 `unknown` 类型
- 禁止使用 `as` 断言（除 DOM 类型转换，须注释说明）
- 任务完成后自动执行 `pnpm exec tsc --noEmit` 检查

## 数据库

| 工具 | 选型 | 备注 |
|------|------|------|
| 嵌入式数据库 | SQLite | 纯 Go 驱动：`modernc.org/sqlite`（无 CGO 依赖） |
| FTS 引擎 | SQLite FTS5 | 用于 Prompt 库全文检索 |
| 迁移工具 | `golang-migrate/migrate` | 版本化 SQL 迁移文件 |

## LLM API

- **接入协议**：OpenAI 兼容接口（`/v1/chat/completions`）
- **支持服务**：OpenAI / Groq / DeepSeek / 本地 Ollama / LM Studio / 任何兼容服务
- **密钥存储**：系统密钥链（Windows DPAPI / macOS Keychain）

## 测试框架

| 测试类型 | 框架 | 备注 |
|---------|------|------|
| Go 单元测试 | `go test` + `testify` | 输出覆盖率 |
| 前端单元 / 组件 | Vitest + React Testing Library | 覆盖率 ≥ 80% |
| E2E | Playwright MCP | 需截图留证 |
| API 接口 | `curl` / Go Integration Test | 展示实际返回值 |

## CI / CD

- 平台：GitHub Actions
- 阶段：`lint → type-check → go-test → fe-test → build`
- 强制检查：零 lint error，零 type error，所有测试通过

## 换行符

- 项目根目录 `.gitattributes` 配置：`* text=auto eol=lf`
- `.bat` / `.cmd` 文件保留 CRLF
- 所有源码文件（.go / .ts / .tsx / .json / .md）强制 LF

