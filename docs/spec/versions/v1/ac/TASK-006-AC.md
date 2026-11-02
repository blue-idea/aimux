# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-006-AC.md`
> 任务编号：TASK-006
> 执行日期：2026-11-02
> 执行人：AI Assistant (Antigravity)

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-006 | v1.REQ-002-AC-001 | E2E | 用户在 LayoutSwitcher 中选择 5 种布局模式（single/dual/grid/ultrawide/main-sub），视口在 100ms 内重排无闪烁，并通过 Playwright 截屏留证 | PASS | `docs/spec/versions/v1/reports/TASK-006/layout-*.png` | — |
| TASK-006 | v1.REQ-002-AC-002 | E2E | 拖拽视口间 Splitter 分割条实时计算更新 bounds 并显示尺寸提示气泡（如 "65% \| 1040px"） | PASS | `ui/src/components/Layout/Splitter.test.tsx`、`ui/src/stores/viewportStore.test.ts` | — |
| TASK-006 | TASK-006-STORE | Unit | Zustand `useViewportStore` 正确管理 activeViewports、layoutMode、containerSize 与 bounds 同步 | PASS | `ui/src/stores/viewportStore.test.ts` (5 用例全 PASS) | — |
| TASK-006 | TASK-006-SHELL | UI | 无边框 Glassmorphic 外壳结构渲染完整（Header、控制栏 260px、底栏 Dock 90px、主工作台区） | PASS | `ui/src/components/Layout/Shell.test.tsx` | — |

---

## 视觉回归留证（Playwright Screenshots）

- **Single 布局**：[`layout-single.png`](file:///Volumes/data/Nextcloud/coding/desktop/aimux/docs/spec/versions/v1/reports/TASK-006/layout-single.png)
- **Dual 布局**：[`layout-dual.png`](file:///Volumes/data/Nextcloud/coding/desktop/aimux/docs/spec/versions/v1/reports/TASK-006/layout-dual.png)
- **Grid 布局**：[`layout-grid.png`](file:///Volumes/data/Nextcloud/coding/desktop/aimux/docs/spec/versions/v1/reports/TASK-006/layout-grid.png)
- **Ultrawide 布局**：[`layout-ultrawide.png`](file:///Volumes/data/Nextcloud/coding/desktop/aimux/docs/spec/versions/v1/reports/TASK-006/layout-ultrawide.png)
- **Main-Sub 布局**：[`layout-main-sub.png`](file:///Volumes/data/Nextcloud/coding/desktop/aimux/docs/spec/versions/v1/reports/TASK-006/layout-main-sub.png)

---

## 质量指标汇总

- **React 单元与组件测试用例数**：10 个测试文件共 47 组测试用例全部执行通过（PASS）
- **类型检查**：`tsc --noEmit -p tsconfig.app.json` 零错误
- **代码规范**：`eslint .` 零错误零警告
- **生产构建**：`vite build` 零错误构建成功
