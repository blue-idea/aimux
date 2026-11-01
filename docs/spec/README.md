# 规格文档版本索引

```yaml
current_version: v1
versions:
  - v1
```

## 版本状态

| Version | 状态 | 说明 |
|---------|------|------|
| v1 | 🟢 活跃 | 初始完整版本，涵盖核心功能全量规格 |

## 目录结构

```
docs/spec/
├── README.md                   # 本文件：版本索引
├── test_strategy.md            # 测试策略简报（项目级）
├── info.md                     # 测试账号与环境信息（gitignore）
├── steering/                   # 项目级恒定规则
│   ├── project-rules.md
│   ├── tech-stack.md
│   └── style-guide.md
└── versions/
    └── v1/                     # 当前活跃版本
        ├── constitution.md
        ├── requirements.md
        ├── design.md
        ├── data.md
        ├── tasks.md
        ├── traceability.md
        ├── ac/
        └── reports/
```

