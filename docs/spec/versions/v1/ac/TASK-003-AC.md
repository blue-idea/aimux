# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-003-AC.md`
> 任务编号：TASK-003
> 执行日期：2026-11-02
> 执行人：AI Assistant (Antigravity)

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-003 | REQ-009-AC-001 | Unit | 主题配置（Current, Mode, AccentColor, Opacity, Blur）成功序列化并持久化至 config.json，重载数据一致 | PASS | `app/storage/config_test.go:TestConfig_ThemePersistence` | — |
| TASK-003 | REQ-010-AC-002 | Unit | 窗口尺寸、分辨率预设、位置坐标与多屏状态成功序列化持久化并可正确回读 | PASS | `app/storage/config_test.go:TestConfig_WindowPresetPersistence` | — |
| TASK-003 | TASK-003-PATHS | Unit | 跨平台应用数据路径解析正确，支持 Windows/macOS/Linux 自动适配对应应用目录与 session 目录 | PASS | `config/paths_test.go:TestPaths_*` | — |
| TASK-003 | TASK-003-DEFAULTS | Unit | 配置文件不存在或部分缺省时自动补齐全量默认值，损坏 JSON 返回错误 | PASS | `app/storage/config_test.go:TestConfig_LoadDefaultWhenNotExist` | — |
| TASK-003 | TASK-003-ATOMIC | Unit | 配置文件写入使用临时文件加原子 Rename，防止并发截断或损坏 | PASS | `app/storage/config_test.go:TestConfig_SaveAndLoad` | — |
| TASK-003 | TASK-003-COVERAGE | Unit | `app/storage/` 覆盖率保持 85.5%（≥ 85%），全部 20 组测试通过 | PASS | `go test ./app/storage/... -cover` -> 85.5% | — |

---

## 质量指标汇总

- **测试用例数**：7 组配置读写用例 + 4 组路径解析用例（全 PASS）
- **覆盖率**：`app/storage/` 达 85.5%，`config/` 达 75.0%
- **安全性**：无明文密钥存储于配置，支持原子写入
