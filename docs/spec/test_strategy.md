# 测试策略简报（Test Strategy）

> 文件路径：`docs/spec/test_strategy.md`
> 版本：v1 · 日期：2026-11-01
> 项目级文件，v2+ 继承本文件，不重复创建

---

## 1. 风险概况

| 维度 | 评级 | 说明 |
|------|------|------|
| 数据敏感性 | 中 | 本地存储用户 AI 会话和 LLM API Key，需加密保护 |
| 用户影响 | 高 | 核心功能（广播、Prompt 优化）失效会严重影响使用体验 |
| 法规合规 | 低 | 纯本地应用，无数据上报，无需 GDPR/隐私合规审计 |

---

## 2. 测试范围

### 纳入范围（In Scope）

- AI 站点源的增删改查和排序
- 多视口布局切换和 Splitter 拖拽
- 自适应 Zoom 算法（单元测试）
- LLM API 配置保存、连接测试和密钥加密
- Prompt 优化调用流程（含防抖、错误处理）
- 广播注入逻辑（单元测试：ChatGPT、Claude、Gemini、DeepSeek）
- 页面内容提取和 Markdown 保存
- SQLite CRUD 和 FTS5 搜索
- 主题切换和 CSS 变量注入
- 全局快捷键注册和冲突检测

### 排除范围（Out of Scope）

- 各 AI 站点本身的 UI 变更兼容性（站点可能随时更新 DOM）
- Wails v3 框架内部 WebView 渲染（框架责任）
- 操作系统 DPI 感知 API 正确性（OS 责任）
- 性能基准测试（v2 阶段补充）

---

## 3. 测试类型决策

| 功能模块 | 测试类型 | 优先级 |
|---------|---------|-------|
| 自适应 Zoom 算法 | Unit | P0 |
| 广播注入逻辑（各平台适配器） | Unit | P0 |
| SQLite CRUD + FTS5 | Unit | P0 |
| LLM API 客户端（HTTP 调用） | Unit（Mock HTTP） | P0 |
| 密钥链读写 | Unit | P0 |
| Prompt 防抖逻辑 | Unit | P1 |
| 页面内容提取（Markdown 格式化） | Unit | P1 |
| AI 站点管理 UI | E2E | P1 |
| 布局切换 + Splitter 拖拽 | E2E | P1 |
| Prompt 优化 UI 流程（预览/确认/取消） | E2E | P1 |
| 主题切换无闪烁 | E2E | P2 |
| 全局快捷键唤出（悬浮窗） | Manual | P1 |
| 会话持久化（重启不掉线） | Manual | P1 |
| 幽灵窗口防护（副屏断开后重启） | Manual | P2 |
| Windows Mica 材质 | Manual | P2 |

---

## 4. 测试金字塔目标比例

```
     /\
    /E2E\        ~15%（关键用户旅程）
   /------\
  /集成测试\      ~20%（Store + DB 层）
 /----------\
/ 单元测试   \   ~65%（算法、工具函数、适配器）
/____________\
```

---

## 5. 覆盖率目标

| 模块 | 行覆盖率目标 | 分支覆盖率目标 |
|------|------------|--------------|
| `app/llm/` | ≥ 90% | ≥ 85% |
| `app/window/layout.go` | ≥ 95% | ≥ 90% |
| `app/storage/` | ≥ 85% | ≥ 80% |
| `app/content/` | ≥ 80% | ≥ 75% |
| `ui/src/utils/` | ≥ 90% | ≥ 85% |
| `ui/src/features/` | ≥ 75% | ≥ 70% |

---

## 6. 环境配置

| 环境 | 说明 |
|------|------|
| 开发 | 本地 `wails dev`，使用本地 Ollama 作为 LLM 测试端点 |
| 测试 | 同开发环境，测试账号从 `docs/spec/info.md` 获取 |
| 生产打包 | `wails build -clean`，验证 Windows/macOS 打包产物 |

---

## 7. 测试工具

| 测试类型 | 框架 |
|---------|------|
| Go 单元测试 | `go test` + `testify/assert` |
| 前端单元/组件 | Vitest + React Testing Library |
| E2E | Playwright MCP（需截图留证） |
| API 接口 | `curl` |

