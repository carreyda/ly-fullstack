# Changelog

本文件记录 LY Fullstack 各公开版本的重要变化，格式参考 Keep a Changelog，版本号遵循 Semantic Versioning。

## [Unreleased]

### Added

- 管理端登录接口增加单实例服务端限流，默认按来源 IP 与账号限制为每分钟 5 次。
- Admin API 接入 Fastify Helmet，为响应增加常见浏览器安全头。
- 增加 `SECURITY.md`、私密漏洞报告入口以及缺陷和功能建议 Issue 模板。

### Changed

- `pnpm setup` 不再使用通用默认管理员密码，交互模式要求用户输入并确认密码，CI 通过 `SETUP_ADMIN_PASSWORD` 注入。
- 在尚未形成外部升级负担的早期阶段，将当前数据库结构合并为单一初始化 migration，新用户首次 Setup 一次完成建表。

### Security

- JWT 增加账号会话版本校验；修改密码或后台重置密码后，此前签发的 Token 会立即失效。

## [0.1.0] - 2026-08-23

### Added

- Vue 3 + Rsbuild + Element Plus 管理后台，提供深浅主题、响应式布局、Dashboard 和统一设计系统。
- NestJS + Fastify 管理 API，提供 JWT 登录、会话恢复、修改密码和全局输入校验。
- 用户、角色、菜单以及用户角色、角色菜单五表 RBAC，并提供数据库动态导航。
- PostgreSQL 17 + Prisma 7 migration、幂等 Seed 和 `pnpm setup` 本地初始化流程。
- pnpm workspace + Turborepo Monorepo、服务生成器、架构边界检查和统一质量门禁。
- Rstest 单元测试、Playwright 登录与权限关键流程冒烟测试。
- Linux + PostgreSQL 环境下的 Setup CI 验证。
- Admin 版本检测、更新提示、离线缓存和旧静态资源恢复机制。
- MIT License、贡献指南、Roadmap、生产部署文档和完整 v0.1.0 Release Notes。

### Security

- 登录页只通过 Cookie 记住管理员账号，不保存明文密码，并主动清理历史明文凭据 Cookie。
- 服务端秘密配置不进入 Git；生产数据库连接和 JWT 密钥由部署环境注入。

### Known limitations

- 当前是模块化单体与多应用 Monorepo，不是微服务架构，也不包含 API 网关和服务治理。
- 公开只读 Demo 因部署资源尚未准备而延期。
- 当前提供生产部署操作方案，自动化 CD 尚未落地。
- 不预置具体 C 端业务和客户端技术栈。

[Unreleased]: https://github.com/liangy0323/ly-fullstack/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/liangy0323/ly-fullstack/releases/tag/v0.1.0
