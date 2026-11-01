# 项目宪法（Constitution）

> 文件路径：`docs/spec/versions/v1/constitution.md`
> 版本：v1 · 日期：2026-11-01
> ⚠️ 本文件定稿后禁止修改，变更须显式通知并记录原因

---

## 项目说明

**AIMux** 是一款跨平台桌面级多 AI 视角工作台，基于 Go + Wails v3 + React + TypeScript 构建。

核心特性：
- **多视口同屏**：支持 1~4 个 AI 站点原生 WebView 同屏并发，多布局模式（单视角/双分栏/四宫格/带鱼屏列排/主辅工作台）
- **全局快捷键**：后台唤出 Spotlight 极速悬浮窗，应用内布局切换与 Prompt 广播
- **AI 站点源管理**：用户自由添加、编辑、排序 AI 站点，支持自定义图标与独立会话分区
- **一键广播（Multi-Send）**：底栏/悬浮窗输入 Prompt，并发派发至所有可见 AI 视口
- **Prompt 优化**：调用配置的 LLM API 自动改写/扩展 Prompt，支持 OpenAI 兼容接口（OpenAI / Groq / DeepSeek / 本地 Ollama / LM Studio 等）
- **保存为 Markdown**：将当前 AI 对话内容（页面文本/截图 OCR/剪贴板）提取并保存为本地 Markdown 文件
- **玻璃拟态皮肤**：6 款预设主题 + 透明度/模糊度/强调色自定义，支持 Windows Mica/Acrylic + macOS Vibrancy
- **会话物理隔离**：每个 Tab 独立 UserDataPath，Cookie 重启持久，多账号同屏互不干扰

**应用数据路径**：`%APPDATA%/AIMux/`（Windows） / `~/Library/Application Support/AIMux/`（macOS）

---

## 技术栈

- **后端主语言**：Go（版本：≥ 1.22）
- **桌面框架**：Wails v3（多窗口架构，原生 WebView）
- **前端框架**：React 19 + TypeScript 5（严格模式）
- **构建工具**：Vite 6
- **包管理器**：pnpm（统一，禁止混用 npm / yarn）
- **UI 组件库**：shadcn/ui + Tailwind CSS v4
- **数据库**：SQLite（通过 `modernc.org/sqlite` 纯 Go 驱动，无 CGO）
- **状态管理**：Zustand
- **前端目录**：`ui/`

### TypeScript 规范

- 启用严格模式（`strict: true`）
- 禁止使用 `any` 和 `unknown` 类型（除第三方类型缺失场景，须加注释说明）
- 禁止使用 `as` 断言（除 DOM 事件类型转换）
- 任务完成后自动执行 `pnpm exec tsc --noEmit` 检查，零 error

---

## 包管理规范

1. 使用**稳定版**包版本，禁止使用任何 beta / rc / alpha 版本。
2. 锁文件（`pnpm-lock.yaml`）必须提交到版本控制。
3. Go 模块：`go.sum` 必须提交，依赖版本在 `go.mod` 中锁定。
4. 禁止在未更新锁文件的情况下提交依赖变更。

---

## 编码安全

### 本地数据安全

- 所有用户数据（会话、配置、Prompt 库）仅存储在本地，零上报
- 用户配置文件（`%APPDATA%/AIMux/config.json`）禁止明文存储 API 密钥，须使用系统密钥链（Windows DPAPI / macOS Keychain）加密后存储
- API 密钥在日志、错误消息中必须脱敏（显示为 `sk-****`）

### API 密钥管理

- 开发时密钥存储在 `.env` / `.env.local` 文件中（已加入 `.gitignore`）
- 生产时通过系统密钥链管理，禁止写入配置文件明文

### Rate Limiting（LLM API 调用）

- Prompt 优化功能：前端防抖 500ms，避免频繁触发 API 调用
- 连续调用失败 3 次时，展示错误提示并暂停重试

---

## 质量基线

- 代码无明显 Lint 错误和编译错误（ESLint + `go vet`）
- Git Hooks：使用 Husky + lint-staged 在提交前强制检查前端代码
- Go：提交前执行 `go build ./...` 零 error
- 测试框架：Vitest + React Testing Library（单元/组件）/ Playwright（E2E）/ `go test`（Go 后端）

---

## 文档结构

```
docs/
├── AGENTS.md                       # 项目级 Agent 入口
└── spec/
    ├── README.md                   # 版本索引（含 current_version 字段）
    ├── test_strategy.md            # 测试策略简报（项目级）
    ├── info.md                     # 测试账号与环境信息（gitignore）
    ├── steering/                   # 项目级恒定规则（不随 version 变更）
    │   ├── project-rules.md        # 协作 / Git / 测试门槛
    │   ├── tech-stack.md           # 锁定技术栈
    │   └── style-guide.md          # 命名 / 错误格式 / 日志
    └── versions/
        └── v1/
            ├── constitution.md     # 本文件（项目宪法）
            ├── requirements.md     # 需求与 EARS 验收标准
            ├── design.md           # 技术设计概览
            ├── data.md             # 数据库设计
            ├── tasks.md            # 任务拆分清单
            ├── traceability.md     # 可追溯性矩阵
            ├── ac/                 # 各任务 AC 验收矩阵
            └── reports/            # 测试报告
```

