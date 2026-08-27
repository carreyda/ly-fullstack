---
title: 文档与规则索引
description: 解释 README、website、docs、rules、AGENTS、CONTRIBUTING、ROADMAP、CHANGELOG 和 Release Notes 的职责与维护顺序。
---

# 文档与规则索引

仓库把不同受众和不同生命周期的内容分开维护，避免一份超长 README 同时承担使用手册、内部设计和编码规则。

## `README.md`：项目门面

README 回答：

- 项目是什么；
- 当前能做什么；
- 最短快速开始；
- 主要技术栈和边界；
- 应该去哪里继续阅读。

README 不展开每个页面、接口和部署细节。英文入口维护在 `README.en.md`。

## `website/`：官方使用文档

当前 Rspress 站点源码位于：

```text
website/
├── rspress.config.ts
├── tsconfig.json
├── docs/
│   ├── _nav.json
│   ├── public/
│   ├── guide/
│   ├── architecture/
│   ├── admin/
│   ├── server/
│   ├── operations/
│   └── reference/
└── doc_build/           # 生成产物，不提交
```

它回答“如何安装、运行、开发和部署”。每个公开页面都必须包含与正文同语言的 `title` 和 `description` frontmatter。

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

Rspress 构建同时生成 `llms.txt`、`llms-full.txt` 和各路由 Markdown，便于搜索和 AI 工具理解站点内容。

## `docs/`：工程专题真相源

| 文档                            | 主题                           |
| ------------------------------- | ------------------------------ |
| `docs/environment.md`           | 环境变量责任和 Setup 行为      |
| `docs/public-api.md`            | 默认 C 端 API 边界             |
| `docs/admin-theme.md`           | 多主题和 Element Plus 定制机制 |
| `docs/admin-design-system.md`   | Admin 视觉与页面验收规范       |
| `docs/admin-version-offline.md` | 版本检测和离线缓存             |
| `docs/deployment.md`            | 生产部署运行手册               |
| `docs/releases/`                | 版本 Release Notes             |

它们回答“系统内部为什么这样设计、维护时哪些约束不能破坏”。官方站点可以把这些内容重写成任务指南或链接到真相源，但不应复制两份内部机制后分别演化。

## `.rules/`：编码规范

按任务类型维护 Vue、TypeScript、服务端、Admin CRUD、Axios、Pinia、样式、目录、命名、工程和错误处理规范。代码修改必须先读对应规则。

## `AGENTS.md`：AI 协作入口

记录个人编码原则、技术栈、硬性架构边界和 `.rules/` 路由表。支持工作区说明的 AI 工具应从仓库根打开项目，以便自动读取统一约束。

## 其他维护文件

- `CONTRIBUTING.md`：贡献流程、分支、提交和 Pull Request 要求。
- `ROADMAP.md`：未来方向，不代表当前能力。
- `CHANGELOG.md`：版本之间的实际变化。
- `SECURITY.md`：漏洞报告和安全沟通方式。
- `LICENSE`：MIT 开源许可。

## 功能变更时更新什么

建议顺序：

1. 修改代码和测试。
2. 更新对应根 `docs/` 实现真相源。
3. 更新 `website/docs` 的使用流程和 frontmatter description。
4. 能力边界变化时更新 README。
5. 记录 CHANGELOG 或版本 Release Notes。
6. 运行 `pnpm check`，确保代码和文档同时可构建。
