# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-005-AC.md`
> 任务编号：TASK-005
> 执行日期：2026-11-02
> 执行人：AI Assistant (Antigravity)

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-005 | v1.REQ-002-AC-001 | Unit | 成功切换 5 种布局模式（single/dual/grid/ultrawide/main-sub）并自动持久化至 config.json，异常模式校验拒绝 | PASS | `app/window/manager_test.go:TestWindowManager_SetLayout` | — |
| TASK-005 | v1.REQ-002-AC-002 | Unit | 动态下发物理像素坐标给指定视口并更新 WindowHandle 物理 Bounds，负尺寸防御性拦截 | PASS | `app/window/manager_test.go:TestWindowManager_SetViewportBounds` | — |
| TASK-005 | v1.REQ-002-AC-004 | Unit | 视口分离为独立桌面窗口并移出主工作台 LRU，重新附着恢复为 Visible 并加入 LRU | PASS | `app/window/manager_test.go:TestWindowManager_DetachAndAttachViewport` | — |
| TASK-005 | TASK-005-LAYOUT-CALC | Unit | 视口布局 Bounds 几何算法计算准确，奇数像素自动对齐消除接缝，非法模式与负尺寸安全防御 | PASS | `app/window/layout_test.go:TestComputeViewportBounds` | — |
| TASK-005 | TASK-005-LRU-CACHE | Unit | 视口访问 LRU 算法正确，超过 10 Tab 自动挂起并隐藏最旧视口，切回时恢复可见 | PASS | `app/window/lru_test.go:TestLRUCache`、`app/window/manager_test.go:TestWindowManager_LRUSuspension` | — |
| TASK-005 | TASK-005-SPOTLIGHT | Unit | Spotlight 悬浮窗 Show/Hide/Focus 状态受控切换，未注册时返回防御性错误 | PASS | `app/window/manager_test.go:TestWindowManager_ShowSpotlight` | — |

---

## 质量指标汇总

- **Go 单元测试用例数**：23 组测试用例全部执行通过（PASS）
- **Go 语句覆盖率**：`app/window` 模块整体达到 **98.9%**，`layout.go` 达到 **97.9%**，超出测试策略中 ≥95% 的质量门槛
- **静态检查**：`go vet` 零错误；前端 `tsc --noEmit`、`eslint` 零错误；`vite build` 构建成功
