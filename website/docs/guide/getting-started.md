---
title: 快速开始
description: 从安装 Node.js、pnpm 和 PostgreSQL 开始，完成依赖安装、数据库初始化、应用启动、管理员登录与本地环境验收。
---

# 快速开始

本页从一台没有运行过 LY Fullstack 的电脑开始，最终目标是成功登录管理后台，并确认两个 API 的健康检查可用。

## 1. 准备运行环境

| 依赖       | 版本         | 是否必需 | 作用                                       |
| ---------- | ------------ | -------- | ------------------------------------------ |
| Node.js    | `>= 22.19.0` | 是       | 运行前端构建、NestJS 服务和工程脚本        |
| pnpm       | `>= 11 < 12` | 是       | 安装 workspace 依赖并运行根命令            |
| PostgreSQL | 17.x         | 二选一   | 本机直接提供数据库                         |
| Docker     | 稳定版       | 二选一   | 本机没有 PostgreSQL 时启动仓库内数据库容器 |

Node 22 自带 Corepack。安装 Node 后执行：

```bash
corepack enable
node --version
pnpm --version
```

版本不符合根目录 `package.json` 的 `engines` 时，请先升级。仓库通过 `packageManager` 固定 pnpm 11，开启 Corepack 后会自动使用正确的大版本。

:::warning PostgreSQL 与 Docker 至少准备一个
`pnpm setup` 会先检查 `127.0.0.1:5432`。已有 PostgreSQL 就直接复用；端口没有服务且 Docker Compose 可用时，脚本才启动 `compose.yaml` 中的 PostgreSQL 17。
:::

## 2. 获取代码并安装依赖

```bash
git clone https://github.com/liangy0323/ly-fullstack.git
cd ly-fullstack
pnpm install
```

安装阶段会为 `@repo/database` 生成 Prisma Client，但不会连接数据库，也不会创建表或管理员。不要跳过下一步。

如果安装提示 Node 或 pnpm 版本不符合要求，先修正环境，不建议使用忽略引擎检查的参数强行继续。

## 3. 初始化本地数据库

在仓库根目录执行：

```bash
pnpm setup
```

脚本依次询问：

1. 本机 `postgres` 超级用户密码。
2. 数据库名称，默认 `ly_fullstack`。
3. 首次创建 `admin` 时使用的管理员密码，长度 8–64 位。
4. 再次输入管理员密码进行确认。

确认后，Setup 会自动：

- 校验 Admin 开发环境的 API 地址与 `workspace.config.json` 是否一致；
- 复用本机 PostgreSQL，或通过 Docker Compose 启动数据库；
- 幂等创建目标数据库；
- 生成被 Git 忽略的 `apps/admin-api/.env.development`；
- 生成被 Git 忽略的 `apps/api/.env.development`；
- 执行 Prisma migration；
- 写入超级管理员角色、菜单权限树和 `admin` 账号。

数据库密码、随机 JWT 密钥和管理员密码不会写入仓库。Setup 重复执行不会重置已存在的 `admin` 密码；如果检测到服务端开发环境文件，交互模式会先询问是否覆盖。

### 使用本机 PostgreSQL

确保 PostgreSQL 服务已经启动，并且 `postgres` 用户密码正确。Setup 会连接 `127.0.0.1:5432`，不需要你预先创建 `ly_fullstack` 数据库。

### 使用 Docker

确保以下命令可用：

```bash
docker compose version
```

不需要提前执行 `docker compose up`。Setup 会把本次输入的数据库名称和密码只传给 Compose 子进程，不会在根目录生成包含秘密的 `.env`。

:::warning 已有 Docker 数据卷
PostgreSQL 数据卷第一次创建后，数据库密码不会因为你下次输入新值而改变。如果出现密码认证失败，应使用创建该数据卷时的原密码，而不是反复执行 Setup。
:::

## 4. 启动应用

启动全部应用：

```bash
pnpm dev all
```

也可以执行 `pnpm dev`，先多选服务端应用，再选择前端应用；或者只启动需要的部分：

```bash
pnpm dev admin-api admin
pnpm dev api
pnpm dev:admin
pnpm dev:admin-api
pnpm dev:api
```

本地端口以根目录 `workspace.config.json` 为唯一真相源：

| 应用      | 地址                               | 用途                  |
| --------- | ---------------------------------- | --------------------- |
| Admin     | `http://localhost:8081`            | 管理后台              |
| Admin API | `http://localhost:3000/api/health` | 管理服务健康检查      |
| API       | `http://localhost:3001/api/health` | 默认 C 端服务健康检查 |

`pnpm dev` 会为服务端进程注入注册表中的端口，所以不需要在本地 `.env.development` 重复维护 `PORT`。

## 5. 第一次登录

浏览器打开 `http://localhost:8081`：

- 用户名：`admin`
- 密码：运行 Setup 时设置的管理员密码

登录前需要完成服务端生成的一次性图片滑块验证。登录成功后，应能看到工作台与系统管理菜单，并能进入用户、角色、菜单、字典和公共配置页面。

首次登录后建议立即在右上角个人菜单中修改管理员密码。密码变更会提升账号的 `tokenVersion`，旧 JWT 会在下一次请求时失效。

## 6. 完成本地验收

依次检查：

```bash
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```

然后在浏览器确认：

1. 管理员可以登录并在刷新后恢复会话。
2. 系统管理的五个页面都能读取数据。
3. 深浅主题可切换，首次访问默认跟随操作系统。
4. 退出登录后，直接访问受保护路由会回到登录页。

## 7. 停止开发进程

```bash
pnpm dev:stop
```

该命令停止由本仓库开发启动器遗留的进程。数据库容器不会被一并删除，后续启动可以继续使用原数据。

## 下一步

- 想先看懂仓库：阅读[目录与职责](/guide/project-structure)。
- 准备写业务：阅读[开发第一个业务](/guide/development-workflow)。
- 初始化失败：直接查看[常见问题](/operations/troubleshooting)。
