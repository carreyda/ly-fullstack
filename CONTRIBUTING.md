# 贡献指南

感谢参与 LY Fullstack。项目优先接受能够解决真实问题、保持现有架构边界并附带验证的贡献，不鼓励只为了增加技术栈或抽象层而修改核心结构。

## 开始之前

请先阅读：

- [`README.md`](README.md)：项目定位、能力边界和快速开始。
- [`AGENTS.md`](AGENTS.md)：项目编程思想和规则索引。
- [`.rules/`](.rules/)：目录、Vue、NestJS、类型、测试、样式和工程规范。
- [`ROADMAP.md`](ROADMAP.md)：已确认方向与非目标。

较大的功能、架构调整或依赖替换应先创建 Issue，说明真实问题、候选方案、影响范围和验证方式。修复明确 Bug、补充测试和更正文档可以直接提交 Pull Request。

## 本地环境

要求：

- Node.js >= 22.19.0。
- pnpm >= 11 且 < 12。
- PostgreSQL 17，或可以运行 Docker Compose。

```bash
pnpm install
pnpm setup
pnpm dev
```

首次初始化会创建本地数据库、执行 migration 与 Seed，并生成被 Git 忽略的 Admin API development 环境文件。不要提交数据库密码、JWT 密钥或任何本地 `.env`。

## 选择改动位置

- Admin 页面和交互：`apps/admin`。
- Admin API 业务模块：`apps/admin-api`。
- Prisma Schema、migration 和 Seed：`packages/database`。
- 跨应用安全类型和纯工具：`packages/shared`。
- 无框架图表能力：`packages/charts`。
- 开发启动、Setup 和服务模板：`scripts`。
- 规范与运维说明：`.rules` 和 `docs`。

应用之间禁止直接导入源码。浏览器应用禁止依赖 Prisma 类型，服务端禁止从 Shared 浏览器工具入口导入能力。

## 开发原则

1. 只解决 Pull Request 声明的问题，不顺手重构无关代码。
2. 优先复用平台能力和现有模块，不为单次使用创建通用抽象。
3. 公共类型只定义一次，并放在正确的应用或共享边界。
4. Admin 不手动导入 Element Plus 运行时组件和预编译样式。
5. 新增功能同时处理空数据、网络失败、重复提交、资源释放和权限边界。
6. 注释使用中文并解释职责、原因和副作用，不能只复述代码。
7. AI 辅助生成的代码必须由贡献者本人理解、审查和运行验证，不能把 AI 输出原样当作完成依据。

## 测试与质量门禁

根据改动补充最接近源码的测试：

- 纯逻辑、Store、Service：Rstest 单元测试。
- 数据库、HTTP 或多个模块协作：集成测试。
- 登录、权限、路由和关键页面链路：Playwright 冒烟测试。
- 服务生成器：模板冒烟测试。

提交前必须执行：

```bash
pnpm check
```

涉及浏览器关键流程时，在已经执行 `pnpm setup` 的环境中额外运行：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

CI 失败的 Pull Request 不能合并。不得跳过失败步骤、降低断言或用静默 catch 掩盖错误。

## Commit 与 Pull Request

Commit 遵循 Conventional Commits：

```text
feat(auth): 增加管理员登录限制
fix(setup): 修复 Linux 下 pnpm 子进程启动失败
test(e2e): 覆盖登录后会话恢复
docs(deploy): 补充 Nginx 缓存策略
```

Pull Request 需要包含：

- 问题背景与改动目标。
- 关键实现和架构选择。
- 测试命令与实际结果。
- 环境变量、数据库 migration 和兼容性影响。
- UI 改动前后截图；深浅主题都受影响时必须同时提供。
- 尚未解决的限制或后续工作。

## 数据库变更

修改 Prisma Schema 时必须提交对应 migration，并说明：

- 新旧应用版本是否兼容。
- 是否需要数据回填。
- migration 失败后的停止条件。
- 生产回滚是否会造成数据丢失。

禁止修改已经公开使用的历史 migration，禁止让业务应用跨服务直接读取其他服务的数据表。

## 安全问题

登录绕过、权限提升、密钥泄露和可造成数据破坏的问题不要提交公开 Issue。请优先通过 GitHub 仓库的私有 Security Advisory 联系维护者，并提供复现条件、影响范围和建议修复方式。普通 Bug 和功能建议继续使用公开 Issue。

## 许可

提交贡献即表示你有权提供相关代码和文档，并同意贡献内容按照项目的 [MIT License](LICENSE) 发布。禁止复制许可证不兼容或来源不清晰的代码、图片和设计资产。

LY Fullstack 项目组
