# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-001-AC.md`
> 任务编号：TASK-001
> 执行日期：2026-11-02
> 执行人：AI Assistant (Antigravity)

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-001 | TASK-001-ENV | Manual | Wails v3 CLI (v3.1.0) 安装成功，Go 1.26 与 Node v24/pnpm v10 环境就绪 | PASS | `wails3 version` -> v3.1.0 | — |
| TASK-001 | TASK-001-GITATTR | Manual | `.gitattributes` 配置 LF 换行归一化（`* text=auto eol=lf`） | PASS | 根目录 `.gitattributes` | — |
| TASK-001 | TASK-001-GOMOD | Manual | Go 模块引入 Wails v3.1.0，`go build ./...` 成功编译主程序 | PASS | `go build -o /dev/null ./...` exit 0 | — |
| TASK-001 | TASK-001-FE-INSTALL | Manual | 前端 `pnpm install` 依赖安装完成，Vite 7 + React 18/19 配置正常 | PASS | `ui/pnpm-lock.yaml` | — |
| TASK-001 | TASK-001-LINT-TYPE | Manual | ESLint 0 warning/error，Prettier 格式化配置生效，TypeScript strict 0 error | PASS | `pnpm exec tsc --noEmit` exit 0, `pnpm exec eslint src` exit 0 | — |
| TASK-001 | TASK-001-TESTS | Unit | Vitest 单元测试套件全部通过 (5/5 files, 24/24 tests) | PASS | `pnpm test --run` exit 0 | — |
| TASK-001 | TASK-001-HOOKS | Manual | Husky 与 core.hooksPath 已配置，pre-commit 自动运行前端检查 | PASS | `.husky/pre-commit` | — |
| TASK-001 | TASK-001-FE-BUILD | Manual | Vite 构建前端生产 bundle 成功 | PASS | `ui/dist/index.html` 0.70kB | — |
