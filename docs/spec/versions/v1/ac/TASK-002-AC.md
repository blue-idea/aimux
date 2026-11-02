# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-002-AC.md`
> 任务编号：TASK-002
> 执行日期：2026-11-02
> 执行人：AI Assistant (Antigravity)

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-002 | REQ-001-AC-001 | Unit | 站点书签完成完整 CRUD，支持排序、唯一约束检查与空值边界处理 | PASS | `app/storage/db_test.go:TestBookmarks_CRUD` | — |
| TASK-002 | REQ-011-AC-001 | Unit | Prompt 成功持久化到 prompts 表，并通过触发器同步写入 prompts_fts | PASS | `app/storage/db_test.go:TestPrompts_CRUD_And_FTS` | — |
| TASK-002 | REQ-011-AC-002 | Unit | FTS5 全文搜索支持标题与内容关键字毫秒级匹配，更新与删除实时同步索引 | PASS | `app/storage/db_test.go:TestPrompts_CRUD_And_FTS` | — |
| TASK-002 | TASK-002-MIGRATE | Unit | SQLite WAL 模式自动开启，`golang-migrate/migrate` 成功执行版本化迁移 | PASS | `app/storage/migrations/000001_init_schema.up.sql` | — |
| TASK-002 | TASK-002-COVERAGE | Unit | `app/storage/` 语句覆盖率达 85.3%（目标 ≥ 85%），9 组单元测试全通过 | PASS | `go test ./app/storage/... -cover` -> 85.3% | — |

---

## 质量指标汇总

- **测试用例总数**：9 组测试（覆盖 CRUD、FTS 全文检索、历史记录、边界异常处理）
- **通过率**：100% PASS
- **覆盖率**：85.3% of statements（高于目标 85%）
- **驱动选型**：`modernc.org/sqlite`（纯 Go，零 CGO 依赖）
