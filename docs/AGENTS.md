# 项目级 Agent 入口

> 文件路径：`docs/AGENTS.md`
> 本文件告诉 AI Agent 读取哪些文档、当前处于 SDD 的哪个阶段。

---

## 概览

**项目**：AIMux — 跨平台桌面级多 AI 视角工作台  
**技术栈**：Go + Wails v3 + React + TypeScript  
**SDD 当前版本**：`v1`（见 `docs/spec/README.md`）

---

## Agent 必读文件（按顺序加载）

1. `docs/spec/README.md` — 确认当前活跃 version
2. `docs/spec/steering/project-rules.md` — 协作与测试门槛
3. `docs/spec/steering/tech-stack.md` — 锁定技术栈
4. `docs/spec/steering/style-guide.md` — 命名规范
5. `docs/spec/versions/v1/constitution.md` — 项目宪法

## 按需读取（根据当前任务）

| 任务类型 | 读取文件 |
|---------|---------|
| 需求澄清 | `docs/spec/versions/v1/requirements.md` |
| 技术设计 | `docs/spec/versions/v1/design.md`、`data.md` |
| 执行任务 | `docs/spec/versions/v1/tasks.md`、`traceability.md` |
| 验收测试 | `docs/spec/test_strategy.md`、`versions/v1/ac/TASK-XXX-AC.md` |
| 测试数据 | `docs/spec/info.md` |

---

## SDD 阶段状态

| 步骤 | 阶段 | 状态 |
|:---:|------|------|
| STEP 1 | 立规矩 | ✅ 完成 |
| STEP 2 | 需求文档 | ✅ 完成 |
| STEP 3 | 技术方案 | ✅ 完成 |
| STEP 4 | 规格审查 | ✅ 完成（内嵌审查，一致性已确认） |
| STEP 5 | 拆分任务 | ✅ 完成（23 项 TASK） |
| STEP 6 | 执行验收 | 🔜 下一步（从 TASK-001 开始） |
