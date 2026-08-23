# 生产部署

本文档定义 LY Fullstack v0.1.x 的官方生产部署方案，供运维人员、开发者和 AI 编码代理共同执行。目标是让当前模块化单体架构在一台 Linux 服务器上稳定运行，不把尚未实现的容器编排或微服务治理包装成现有能力。

## 方案边界

官方方案使用：

- Ubuntu 24.04 LTS 或同等级 Linux。
- Node.js 22.19+ 与 pnpm 11.x。
- Nginx 托管 Admin 静态产物，并将同域 `/api` 反向代理到 Admin API。
- Systemd 托管 NestJS Admin API。
- PostgreSQL 18；生产环境优先使用云数据库或独立数据库主机，单机低负载场景也可以同机部署。

该方案适合个人、小团队和中小型项目。单台服务器重启 Admin API 时会有短暂中断；需要多实例、自动扩缩容、跨地域容灾或零停机发布时，应在此基础上增加负载均衡、外部会话与完整部署编排，不能直接宣称当前方案已经具备这些能力。

## 部署拓扑

```text
Browser
   │ HTTPS 443
   ▼
Nginx
   ├── /           -> apps/admin/dist
   └── /api/*      -> 127.0.0.1:3000
                         │
                         ▼
                    Admin API
                         │
                         ▼
                    PostgreSQL 18
```

前端生产配置默认使用同源 `API_BASE_URL=/api`。浏览器只访问 Nginx，不应直接暴露 3000 端口。

## 部署前准备

以下示例使用：

| 项目              | 示例值                            |
| ----------------- | --------------------------------- |
| 管理后台域名      | `admin.example.com`               |
| 代码目录          | `/srv/ly-fullstack`               |
| 运行用户          | `ly-fullstack`                    |
| API 监听地址      | `127.0.0.1:3000`                  |
| 服务端环境文件    | `/etc/ly-fullstack/admin-api.env` |
| Systemd 服务名    | `ly-fullstack-admin-api.service`  |
| PostgreSQL 数据库 | `ly_fullstack`                    |

执行时必须替换域名、数据库连接串和密钥，禁止直接复制示例秘密。

### 系统依赖

以具备 sudo 权限的运维账号安装 Nginx、Git、Node.js 22.19+，并通过 Corepack 固定 pnpm：

```bash
corepack enable
corepack prepare pnpm@11.22.0 --activate
node --version
pnpm --version
```

版本必须满足根 `package.json` 的 `engines` 与 `packageManager`，不能在生产服务器临时改用 npm 或其他 pnpm 大版本。

### 运行用户与目录

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin ly-fullstack
sudo mkdir -p /srv/ly-fullstack/releases /etc/ly-fullstack
sudo chown -R ly-fullstack:ly-fullstack /srv/ly-fullstack
sudo chmod 750 /etc/ly-fullstack
```

每次发布使用独立版本目录，`/srv/ly-fullstack/current` 是指向当前版本的软链接。不要直接覆盖正在运行的目录。

## PostgreSQL

生产应用必须使用独立数据库账号，不能使用 `postgres` 超级用户。以下 SQL 仅展示首次创建方式，密码需要替换为高强度随机值：

```sql
CREATE ROLE ly_fullstack LOGIN PASSWORD '<strong-database-password>';
CREATE DATABASE ly_fullstack OWNER ly_fullstack;
```

云数据库由平台控制台完成相同的数据库和账号创建。数据库必须限制来源地址，只允许 Admin API 所在服务器访问，并启用自动备份。

## 服务端生产环境

使用 `sudoedit /etc/ly-fullstack/admin-api.env` 创建只存在于服务器的环境文件：

```dotenv
DATABASE_URL="postgresql://ly_fullstack:<url-encoded-password>@<postgres-host>:5432/ly_fullstack?schema=public"
CORS_ORIGINS="https://admin.example.com"
JWT_SECRET="<至少 32 字节的随机值>"
JWT_EXPIRES_IN="7d"
PORT="3000"
APP_ENV="production"
```

生成 JWT 密钥可以使用：

```bash
openssl rand -hex 32
```

随后限制文件权限：

```bash
sudo chown root:ly-fullstack /etc/ly-fullstack/admin-api.env
sudo chmod 640 /etc/ly-fullstack/admin-api.env
```

环境文件禁止进入 Git、构建产物、工单正文和聊天记录。数据库密码包含 `@`、`:`、`/` 等字符时，必须先进行 URL 编码再写入 `DATABASE_URL`。

## 首次发布

### 1. 获取指定版本

```bash
sudo -u ly-fullstack git clone --branch v0.1.0 --depth 1 \
  https://github.com/liangy0323/ly-fullstack.git \
  /srv/ly-fullstack/releases/v0.1.0
cd /srv/ly-fullstack/releases/v0.1.0
```

正式发布必须使用不可变 Tag 或 Commit，不要在服务器直接部署一个持续变化的分支工作区。

### 2. 安装、检查与构建

```bash
sudo -u ly-fullstack pnpm install --frozen-lockfile
sudo -u ly-fullstack pnpm check
```

`pnpm check` 已包含生产构建。如果构建由 CI 完成，可以上传经过同一 Commit 构建和校验的产物，但不能跳过锁文件安装与质量门禁。

### 3. 执行数据库迁移

```bash
set -a
source /etc/ly-fullstack/admin-api.env
set +a
sudo -E -u ly-fullstack pnpm --filter @repo/database db:migrate
```

Prisma migration 必须在切换版本前成功完成。失败时停止发布，不得继续重启服务。

### 4. 首次初始化管理员

只有全新数据库需要执行一次 Seed。必须为管理员设置独立强密码，不能复用开发、测试或其他环境的凭证：

```bash
read -s -p 'Initial admin password: ' ADMIN_INITIAL_PASSWORD
echo
export ADMIN_INITIAL_PASSWORD
sudo -E -u ly-fullstack pnpm --filter @repo/database db:seed
unset ADMIN_INITIAL_PASSWORD
```

Seed 是幂等的，已经存在的 `admin` 不会被重置密码。生产环境首次登录后仍建议立即修改密码。

### 5. 激活版本

```bash
sudo -u ly-fullstack ln -sfn /srv/ly-fullstack/releases/v0.1.0 /srv/ly-fullstack/current
```

## Systemd

创建 `/etc/systemd/system/ly-fullstack-admin-api.service`：

```ini
[Unit]
Description=LY Fullstack Admin API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ly-fullstack
Group=ly-fullstack
WorkingDirectory=/srv/ly-fullstack/current/apps/admin-api
EnvironmentFile=/etc/ly-fullstack/admin-api.env
ExecStart=/usr/bin/node /srv/ly-fullstack/current/apps/admin-api/dist/main.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=20
KillSignal=SIGTERM
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
```

`node` 的实际路径通过 `command -v node` 确认；如果不是 `/usr/bin/node`，必须同步修改 `ExecStart`。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ly-fullstack-admin-api
sudo systemctl status ly-fullstack-admin-api
curl --fail http://127.0.0.1:3000/api/health
```

健康检查失败时先查看：

```bash
sudo journalctl -u ly-fullstack-admin-api -n 200 --no-pager
```

## Nginx

创建 `/etc/nginx/sites-available/ly-fullstack-admin`：

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /srv/ly-fullstack/current/apps/admin/dist;
    index index.html;

    location = /index.html {
        add_header Cache-Control "no-store" always;
        try_files $uri =404;
    }

    location = /version.json {
        add_header Cache-Control "no-store" always;
        try_files $uri =404;
    }

    location = /sw.js {
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }

    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置并检查语法：

```bash
sudo ln -s /etc/nginx/sites-available/ly-fullstack-admin /etc/nginx/sites-enabled/ly-fullstack-admin
sudo nginx -t
sudo systemctl reload nginx
```

使用 Certbot、云负载均衡器或公司证书平台为域名启用 HTTPS。生产登录密码和 JWT 只允许通过 HTTPS 传输；证书未生效前不得开放登录入口。

## 发布验收

每次发布至少检查：

```bash
curl --fail https://admin.example.com/
curl --fail https://admin.example.com/version.json
curl --fail https://admin.example.com/api/health
```

浏览器继续验证：

1. 未登录访问受保护页面会跳转登录页。
2. 管理员可以登录并刷新恢复会话。
3. 用户、角色、菜单页面可以正常读取。
4. 深浅主题和静态资源正常加载。
5. 浏览器控制台没有旧 Chunk、CORS 或 Service Worker 错误。

### 安全验收

- Admin API 已通过 Fastify Helmet 返回常见浏览器安全头；可以检查响应中的 `X-Content-Type-Options` 等字段。
- 登录接口默认按“客户端 IP + 账号”限制为每分钟 5 次，触发后阻断 1 分钟。该计数使用进程内存，只适用于默认单实例部署。
- Nginx 必须传递 `X-Real-IP` 和 `X-Forwarded-For`。Admin API 只信任本机 loopback 代理，不能把服务端口直接暴露到公网后仍假设转发头可信。
- 多实例部署必须把限流上移到 API 网关、WAF 或云平台，或者为 `@nestjs/throttler` 接入共享存储。公开互联网场景建议叠加云厂商成熟的人机验证，前端滑块不能替代服务端防护。
- 修改当前密码或由管理员重置密码后，账号会话版本递增，旧 JWT 在下一次请求时失效。泄露 JWT 签名密钥时仍必须立即轮换 `JWT_SECRET`。

## 版本升级

新版本部署到新的 `/srv/ly-fullstack/releases/<version>`：

1. 使用 Tag 或 Commit 获取代码。
2. 执行 `pnpm install --frozen-lockfile` 和 `pnpm check`。
3. 加载生产环境变量并执行 `db:migrate`。
4. 将 `current` 软链接切换到新版本。
5. 执行 `sudo systemctl restart ly-fullstack-admin-api`。
6. 检查 API 健康状态后执行 `sudo nginx -t && sudo systemctl reload nginx`。
7. 完成浏览器验收，再删除过旧 Release；至少保留上一个可运行版本。

Admin 已包含版本检测与离线缓存机制。部署时必须保持 `index.html`、`version.json` 和 `sw.js` 不缓存，带内容哈希的静态资源才允许长期缓存，完整原理见 [`admin-version-offline.md`](admin-version-offline.md)。

## 回滚

应用代码回滚：

```bash
sudo -u ly-fullstack ln -sfn /srv/ly-fullstack/releases/<previous-version> /srv/ly-fullstack/current
sudo systemctl restart ly-fullstack-admin-api
sudo nginx -t && sudo systemctl reload nginx
```

数据库 migration 不会随代码软链接自动回滚。发布前必须备份数据库，并让 Schema 变更至少兼容前后两个应用版本。破坏性迁移应采用“先扩展、迁移数据、再删除旧字段”的多阶段方式，禁止在无法恢复数据时直接执行回滚 SQL。

## 备份与恢复

最低要求：

- PostgreSQL 每日自动备份，并定期验证恢复。
- 发布 migration 前创建可恢复快照。
- `/etc/ly-fullstack/admin-api.env` 进入受控的秘密管理或加密备份，但不能进入源码备份。
- 保留最近两个经过验证的应用 Release。
- 记录恢复时间目标和可接受的数据丢失窗口。

没有实际恢复演练的备份不能视为可用备份。

## 常见故障

| 现象                   | 优先检查                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| API 启动失败           | `journalctl`、必填环境变量、Node 版本、数据库网络和 migration       |
| 页面出现 502           | Systemd 服务状态、3000 端口和 Nginx `proxy_pass`                    |
| 页面刷新后 404         | Nginx `location /` 是否使用 `try_files ... /index.html`             |
| 登录请求出现 CORS 错误 | `CORS_ORIGINS` 是否与浏览器实际 HTTPS Origin 完全一致               |
| 发布后仍显示旧页面     | `version.json`、`index.html`、`sw.js` 缓存头和浏览器 Service Worker |
| Prisma 连接失败        | `DATABASE_URL` URL 编码、数据库账号权限、SSL 要求和防火墙           |
| 静态资源 403           | `/srv/ly-fullstack` 父目录执行权限和 Nginx 运行用户的读取权限       |

## AI 与自动化执行约束

运维 AI 或自动化脚本执行本文档时必须遵守：

1. 所有域名、路径和秘密先由运维确认，不猜测生产值。
2. 禁止输出、提交或上传 `DATABASE_URL`、`JWT_SECRET` 和管理员初始密码。
3. migration、构建或健康检查任一失败时立即停止，不能继续切换软链接。
4. 不执行 `git reset --hard`、递归删除 Release 根目录或清空数据库。
5. 切换版本前确认目标绝对路径位于 `/srv/ly-fullstack/releases`。
6. 发布后同时验证 API、HTML、版本清单和真实登录流程。
7. 自动化部署尚未落地前，不把本文档描述为已经运行的 CD。

LY Fullstack 项目组
