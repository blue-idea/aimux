# 可追溯性矩阵（Traceability）

> 文件路径：`docs/spec/versions/v1/traceability.md`
> 版本：v1 · 日期：2026-11-01

---

## TASK → REQ → AC 追溯矩阵

| TASK ID | TASK 名称 | 关联 REQ | 关联 AC | 测试类型 | 状态 |
|---------|----------|---------|---------|---------|------|
| TASK-001 | 初始化项目工程骨架 | — | — | Manual | ✅ 已完成 |
| TASK-002 | SQLite 数据库层初始化 | REQ-001, REQ-011 | REQ-001-AC-001, REQ-011-AC-001, REQ-011-AC-002 | Unit | ⬜ 待开始 |
| TASK-003 | 应用配置读写模块 | REQ-009, REQ-010 | REQ-009-AC-001, REQ-010-AC-002 | Unit | ⬜ 待开始 |
| TASK-004 | 自适应 Zoom 算法 | REQ-002 | REQ-002-AC-003 | Unit | ⬜ 待开始 |
| TASK-005 | Go 窗口管理器 | REQ-002 | REQ-002-AC-001, REQ-002-AC-002, REQ-002-AC-004 | Unit+E2E | ⬜ 待开始 |
| TASK-006 | 前端布局 UI | REQ-002 | REQ-002-AC-001, REQ-002-AC-002 | E2E | ⬜ 待开始 |
| TASK-007 | 全局快捷键管理器 | REQ-003 | REQ-003-AC-001, REQ-003-AC-003, REQ-003-AC-004 | Unit+Manual | ⬜ 待开始 |
| TASK-008 | Spotlight 悬浮窗 | REQ-003 | REQ-003-AC-001 | E2E+Manual | ⬜ 待开始 |
| TASK-009 | AI 站点书签 CRUD | REQ-001 | REQ-001-AC-001~005 | Unit | ⬜ 待开始 |
| TASK-010 | AI 站点管理 UI | REQ-001 | REQ-001-AC-001~004 | E2E | ⬜ 待开始 |
| TASK-011 | 会话分区管理器 | REQ-008 | REQ-008-AC-001, REQ-008-AC-002, REQ-008-AC-003 | Unit+Manual | ⬜ 待开始 |
| TASK-012 | Prompt 注入适配器 | REQ-004 | REQ-004-AC-001, REQ-004-AC-002, REQ-004-AC-003 | Unit | ⬜ 待开始 |
| TASK-013 | 底栏 Prompt 输入区 | REQ-004 | REQ-004-AC-001, REQ-004-AC-003 | E2E | ⬜ 待开始 |
| TASK-014 | LLM API 客户端 | REQ-005 | REQ-005-AC-001~005 | Unit | ⬜ 待开始 |
| TASK-015 | LLM 设置 UI | REQ-005 | REQ-005-AC-001, REQ-005-AC-002, REQ-005-AC-004, REQ-005-AC-005 | E2E | ⬜ 待开始 |
| TASK-016 | Prompt 优化 Go 服务 | REQ-006 | REQ-006-AC-004, REQ-006-AC-005 | Unit | ⬜ 待开始 |
| TASK-017 | Prompt 优化 UI | REQ-006 | REQ-006-AC-001~005 | Unit+E2E | ⬜ 待开始 |
| TASK-018 | 页面内容提取器 | REQ-007 | REQ-007-AC-003, REQ-007-AC-004 | Unit | ⬜ 待开始 |
| TASK-019 | 保存为 Markdown UI | REQ-007 | REQ-007-AC-001, REQ-007-AC-002, REQ-007-AC-003 | E2E | ⬜ 待开始 |
| TASK-020 | 主题皮肤系统 | REQ-009 | REQ-009-AC-001, REQ-009-AC-002, REQ-009-AC-003 | E2E+Manual | ⬜ 待开始 |
| TASK-021 | 窗口预设与防幽灵窗口 | REQ-010 | REQ-010-AC-001, REQ-010-AC-002 | Unit+Manual | ⬜ 待开始 |
| TASK-022 | Prompt 知识库 UI | REQ-011 | REQ-011-AC-001, REQ-011-AC-002 | E2E | ⬜ 待开始 |
| TASK-023 | 打包与跨平台验证 | 全量 | 全量 | Manual | ⬜ 待开始 |

---

## REQ → TASK 反向追溯

| REQ ID | 需求名称 | 覆盖 TASK |
|--------|---------|----------|
| REQ-001 | AI 站点源管理 | TASK-002, TASK-009, TASK-010 |
| REQ-002 | 多视口同屏布局 | TASK-004, TASK-005, TASK-006 |
| REQ-003 | 全局与应用内快捷键 | TASK-007, TASK-008 |
| REQ-004 | 一键 Prompt 广播 | TASK-012, TASK-013 |
| REQ-005 | LLM API 配置 | TASK-014, TASK-015 |
| REQ-006 | Prompt 优化与补充 | TASK-016, TASK-017 |
| REQ-007 | 保存内容为 Markdown | TASK-018, TASK-019 |
| REQ-008 | 会话物理隔离与持久化 | TASK-011 |
| REQ-009 | 皮肤主题与个性化 | TASK-003, TASK-020 |
| REQ-010 | 全分辨率兼容与窗口管理 | TASK-021 |
| REQ-011 | Prompt 知识库 | TASK-002, TASK-022 |

