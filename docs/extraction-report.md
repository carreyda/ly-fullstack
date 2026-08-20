# LY Fullstack M1 提取报告

> 执行阶段：M1 工程骨架提取与 Admin UI 外壳建设
> 执行日期：2026-08-20

---

## 一、实际读取的来源 commit

| 来源           | 任务书基准 | 实际读取                                                                           | 一致性 |
| -------------- | ---------- | ---------------------------------------------------------------------------------- | ------ |
| Champion       | `8dcbeb4`  | `8dcbeb4d93c571a432742ac771b75b326abc72be`（`feat(web): 首页新增移动端服务区块…`） | 一致   |
| art-design-pro | `f3aaf58`  | `f3aaf58eec1a0e988f162352c33862327a484f95`（`Merge pull request #318 …`）          | 一致   |

两个来源仓库全程只读，未做任何修改、格式化或清理。

---

## 二、新增文件与目录概览

```text
ly-fullstack/
├── apps/
│   ├── admin/         # Rsbuild + Vue 3 + Element Plus 管理后台（外壳 + 工作台 + 404）
│   ├── api/           # NestJS + Fastify C 端 API（当前只有 health）
│   └── admin-api/     # NestJS + Fastify 管理 API（health + PrismaService）
├── packages/
│   ├── charts/        # ECharts 按需注册、初始化、公共类型与测试
│   ├── database/      # Prisma Schema、迁移、生成 Client 与数据库类型
│   └── shared/        # 前后端通用类型与纯工具（当前含 HealthStatus）
├── .github/workflows/ci.yml
├── .husky/（pre-commit + commit-msg）
├── .rules/（13 个规则文件完整迁移）
├── AGENTS.md / README.md / THIRD_PARTY_NOTICES.md
├── compose.yaml（仅 PostgreSQL + healthcheck）
└── 根工程配置（workspace catalog / turbo / tsconfig / eslint / prettier / commitlint / editorconfig / gitignore）
```

---

## 三、提取映射表

### 3.1 根工程基线

| 目标文件                                                                                                  | Champion 来源          | 处理方式 | 保留理由                                                                                                           |
| --------------------------------------------------------------------------------------------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `package.json`                                                                                            | 根 `package.json`      | 改写     | scripts/engines/packageManager/lint-staged 模式与版本约束；`dev` 从交互式脚本简化为 `turbo run dev`（见 8.3 偏差） |
| `pnpm-workspace.yaml`                                                                                     | 根同名文件             | 改写     | catalog 精简为实际依赖（版本沿用 Champion 验证值）；workspace 只包含 `apps/*` 与 `packages/*`                      |
| `turbo.json`                                                                                              | 根同名文件             | 改写     | 任务编排与缓存边界；新增 `test` 任务；移除 Nuxt `.output` 产物与 shared/ui 特判                                    |
| `tsconfig.base.json`                                                                                      | 根 TypeScript 配置     | 改写     | 根目录只维护通用编译基线，各应用和包继承后覆盖自身环境差异                                                         |
| `eslint.config.js`                                                                                        | 根 `eslint.config.mjs` | 改写     | 根目录直接维护 TypeScript、Vue、Prettier、运行环境与自动导入 globals 规则；移除 web/Nuxt 分支                      |
| `.prettierrc` / `.prettierignore` / `.editorconfig` / `commitlint.config.mjs` / `.gitignore` / `.husky/*` | 同名文件               | 迁移     | 原样；`.prettierignore` 追加两个插件生成的 d.ts（见 8.3）；`.gitignore` 增加 generated/dts 条目                    |

### 3.2 admin-api（来源 `apps/server`）

| 目标文件                                     | Champion 来源             | 处理方式 | 保留理由                                                                                                              |
| -------------------------------------------- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`                                | `apps/server/src/main.ts` | 改写     | NestJS+Fastify 启动、`api` 前缀、CORS 白名单、全局 ValidationPipe、shutdown hooks；移除询盘限流的 trustProxy 业务注释 |
| `src/modules/app/app.module.ts`              | 同名文件                  | 改写     | ConfigModule 装配模式；只保留 Health + 应用级 PrismaModule                                                            |
| `src/modules/health/*`                       | 同名文件                  | 迁移     | 健康检查控制器与模块；`HealthStatus` 改由 `@repo/shared/types` 提供                                                   |
| `src/prisma/*`                               | 同名文件                  | 迁移     | PrismaService（启动连接/退出释放）+ 显式 `@Inject(ConfigService)` 模式                                                |
| `packages/database/prisma/*`                 | `apps/server/prisma/*`    | 迁移     | generator（prisma-client, cjs）与 datasource 配置；作为两个 API 共用的数据库唯一真相源                                |
| `src/constants/modules/server.ts`            | 同名文件                  | 迁移     | 服务名/默认端口/CORS 方法常量；服务名改为 `admin-api`                                                                 |
| `env.d.ts` / `.env.example`                  | 同名文件                  | 改写     | 只保留本阶段真实存在的环境变量（无 JWT/OSS/统计项）                                                                   |
| `src/common/index.ts` / `src/types/index.ts` | 目录占位                  | 新建     | 任务书固定结构；只写边界说明，不预建空模块                                                                            |

**未提取（业务删除）**：admin-auth、admin-users、analytics、equipment-_、final-product-_、homepage-settings、inquiries、legal-documents、media-assets、oss、site-settings、web-content 全部模块；migrations、seed、AdminRole/PublishStatus 等模型枚举；JWT/OSS/阿里云验证码/Umami 依赖与配置。

### 3.3 admin（来源 Champion `apps/admin`）

| 目标文件                                                                          | Champion 来源                                         | 处理方式  | 保留理由                                                                                                                           |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `build/rsbuild.{base,dev,prod}.config.ts`                                         | `apps/admin/build/` 同名文件                          | 改写      | 环境校验、产物命名、别名、EP Sass 注入、自动导入、生产拆包/压缩；移除版本检测插件与 preEntry                                       |
| `build/runtime/env.ts`                                                            | 同名文件                                              | 迁移      | `loadAdminEnv` 环境校验（APP_ENV 与 env-mode 一致 + API_BASE_URL 必填）                                                            |
| `src/services/core/index.ts`（AxiosFactory）                                      | 同名文件                                              | 迁移      | 请求工厂与拦截器注册模式                                                                                                           |
| `src/services/service-base*.ts`                                                   | 同名文件                                              | 改写      | 统一服务实例 + 错误统一出口；**去除 token 注入与 401 处理**（下一阶段认证再补）                                                    |
| `src/types/modules/axios.ts`                                                      | 同名文件                                              | 迁移      | InterceptorHooks / RequestOptions 类型链                                                                                           |
| `src/utils/modules/message.ts`                                                    | 同名文件                                              | 迁移      | 统一消息反馈（配 feedback.scss）                                                                                                   |
| `src/router/**`                                                                   | `router/index.ts` + `modules/*`                       | 改写      | 模块化路由 + 标题同步 + chunk 失效刷新；无登录页/守卫（无认证）                                                                    |
| `src/stores/index.ts`                                                             | 同名文件                                              | 改写      | Pinia 基础注册；不装持久化插件、不建伪会话 Store                                                                                   |
| `src/assets/styles/**`（tokens/base/mixin/router-transition/component-overrides） | 同名文件                                              | 迁移/改写 | 设计 token、reset、mixin、路由过渡；component-overrides 保留入口与边界说明（业务规则随页面回归）                                   |
| `src/assets/element-plus/**`（var/ui/table/dialog/drawer/feedback）               | 同名文件                                              | 迁移      | EP 编译期主题与公共覆盖；`champion-table` → `admin-table`；drawer 去掉成品业务宽度变体                                             |
| `src/components/base/base-icon`                                                   | 同名组件                                              | 改写      | 图标白名单组件（映射集按当前实际使用图标重建）                                                                                     |
| `src/components/layouts/layout-side` / `layout-header`                            | 同名组件                                              | 重新实现  | 参照 art-design-pro 增加**折叠侧栏**（230↔64px、1024px 自动折叠）、**768px 抽屉导航**、Header 工具按钮组与用户占位（不伪造登录态） |
| `src/components/layouts/layout-menu`                                              | （新增）                                              | 新建      | 桌面侧栏与移动抽屉共用的菜单渲染，避免两份菜单实现                                                                                 |
| `src/hooks/use-media-query.ts`                                                    | （Champion hooks 思想）                               | 新建      | 响应式断点状态；监听在 `onUnmounted` 清理                                                                                          |
| `src/views/dashboard/index.vue`                                                   | Champion dashboard 结构 + art-design-pro console 网格 | 重新实现  | 工作台：静态项目信息（技术栈/命令/进度/文档入口）+ 真实 `GET /api/health` 连通性卡片；无租户/订单/图表等伪造数据                   |
| `src/views/not-found/index.vue`                                                   | （新增）                                              | 新建      | 404 兜底页                                                                                                                         |
| `src/api/modules/app/{api,interface}.ts`                                          | `api/modules/*` 结构                                  | 新建      | `api.ts` 管地址、`interface.ts` 管类型与调用函数的模块结构；当前仅 health 一个真实接口                                             |
| `src/constants/modules/nav.ts`                                                    | 同名文件                                              | 改写      | 导航数据改为显式联合类型（单元素 `as const` 会丢失 `'children' in` 收窄能力）                                                      |

**未提取（业务删除）**：全部业务页面/业务组件（表单弹框、抽屉、富文本、媒体、验证码等）、login 页、admin store、pinia-plugin-persistedstate、echarts/lottie/wangeditor/ali-oss/js-cookie 依赖、logo.svg 与全部图片素材、`bootstrap/` 版本检测链路（version 插件、check.ts、storage 清理）、`packages/ui` 引用。

### 3.4 packages / 工程配置

| 目标                           | 来源                                          | 处理方式                                                                              |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/shared`              | Champion `packages/shared` 的包结构与构建方式 | 固定 `src/{types,utils}/index.ts` 结构；统一承载跨端类型，当前包含真实 `HealthStatus` |
| `packages/charts`              | Trade `packages/charts`                       | 去除 Trade scope 后迁入；保留无框架 ECharts 能力、公共类型和两个单元测试              |
| `packages/database`            | Champion 服务端 Prisma 基线                   | 统一 Schema、migration 和生成 Client；不依赖 NestJS，只允许服务端应用消费             |
| 根 `tsconfig.base.json`        | 根 TypeScript 公共基线                        | 不作为独立项目编译；所有应用和包继承并覆盖环境差异                                    |
| 根 `eslint.config.js`          | 根 `eslint.config.mjs`                        | 单文件维护全仓扁平配置与自动导入 globals                                              |
| 两个 API 的 `rstest.config.ts` | （Champion 无测试基线，依据官方文档新建）     | 直接使用 `@rstest/core` 配置测试匹配和 NestJS legacy 装饰器                           |

---

## 四、Rstest 选型依据（任务书要求记录）

- 官方文档：rstest.rs（Quick start / CLI / Configure Rstest / agent-install / troubleshooting）。
- 版本：`@rstest/core@0.11.8`（npm 当前版本）；Node 引擎 `^20.19.0 || >=22.12.0`，满足本仓 `>=22.19.0`。
- 配置事实（以文档与实测为准）：
  - 配置文件为包根 `rstest.config.ts`，直接从 `@rstest/core` 导入 `defineConfig`；`include` 等字段为**顶层扁平结构**（无 Vitest 式 `test:` 包裹层）。
  - CLI：`rstest run` 单次执行、`rstest`/`rstest -w` 监听；由包内 `"test": "rstest run"` 脚本驱动，根命令经 `turbo run test` 编排。
  - NestJS legacy 装饰器需要 `source.decorators.version: 'legacy'`（实测默认按 stage-3 编译会导致方法装饰器 descriptor 为 undefined）。
  - 测试文件 import 顺序需先 `import 'reflect-metadata'` 再 import 控制器。
  - admin-api 采用双 tsconfig：应用 `Node16`（tsconfig.json，排除测试）、测试 `Bundler`（tsconfig.test.json，含 rstest.config.ts），因 CJS 程序内无法直接 import ESM-only 的 `@rstest/core`。

---

## 五、art-design-pro：借鉴与拒绝

**借鉴（仅视觉语言，重新实现）**：

- 卡片体系：白色表面 + 1px 描边 + `--custom-radius` 派生圆角（+4/0/-4 梯度），克制阴影。
- 工作台节奏：卡片网格 `gutter: 20`，`xs=24 / md=12 / lg` 响应式分栏，卡片标题行 + 内容区 + 底部操作区的层级。
- 侧栏交互：折叠态（图标列）、Header 折叠按钮、窄屏抽屉导航形态。
- Header：面包屑/标题居左、工具按钮（刷新/全屏）与用户入口居右的布局比例。

**拒绝（未引入）**：

- Vite 构建体系、Tailwind CSS（继续 Rsbuild + SCSS）。
- Router core / RouteRegistry / MenuProcessor、Store、权限指令、`useTable`、Axios/Mock 体系。
- 自动导入策略、国际化、主题市场/配置面板、锁屏、节日动画、聊天等功能。
- 其 Logo、头像、Demo 卡片文案与 Mock 数据。

**实质复制结论**：未复制 art-design-pro 的源码、样式文件或资源；`THIRD_PARTY_NOTICES.md` 已按 MIT 要求保留项目名、来源地址与版权声明。

---

## 六、验证命令与真实结果

| 命令                | 结果 | 说明                                                                                         |
| ------------------- | ---- | -------------------------------------------------------------------------------------------- |
| `pnpm install`      | 通过 | 7 个 workspace 项目（含根项目）；database postinstall 自动生成 Prisma Client                 |
| `pnpm typecheck`    | 通过 | 6/6 任务（api 与 admin-api 均含双 tsconfig）                                                 |
| `pnpm lint`         | 通过 | 全仓 ESLint 无错误                                                                           |
| `pnpm format:check` | 通过 | 全部符合 Prettier                                                                            |
| `pnpm test`         | 通过 | 6 个测试文件、31 个用例（shared 25 个，两个 API 各 2 个，charts 2 个）                       |
| `pnpm build`        | 通过 | 5/5 任务；admin 产物 695.1KB（gzip 293.3KB），framework/element-plus 独立分包 + `.gz` 预压缩 |
| `pnpm check`        | 通过 | 上述全部串行通过                                                                             |

补充运行时验证（均真实执行）：

- `apps/admin-api` 缺少环境文件启动：**按预期失败**，明确报出 `Configuration key "DATABASE_URL" does not exist`（Nest 模块装配正常）。
- `apps/api` 生产构建实际启动在 3000，`GET /api/health` 返回 HTTP 200、`status: ok` 与 `service: api`，验证后已关闭进程。
- `apps/admin` dev server（端口 8877）：HTTP 200，标题 `LY Fullstack Admin`。
- `apps/admin` 生产产物 `rsbuild preview`：HTTP 200，HTML/JS 资源正常。
- 品牌/泄密扫描：`Champion|@champion|champion` 在业务代码、运行配置与 README 中零残留（仅存在于 `.rules` 保留条款、`AGENTS.md`/`THIRD_PARTY_NOTICES.md` 的来源说明与本报告）；`password=|secret=|token=` 无命中；旧业务模块名（equipment/final-product/inquiries 等）仅存在于 `.rules` 保留条款中。

---

## 七、未完成事项、阻塞项与下一阶段建议

1. **admin-api 带 PostgreSQL 的完整启动未在本机验证（环境阻塞）**：本机无 Docker、无可用 PostgreSQL。已验证到"缺 env 明确报错"与构建/测试；`compose.yaml` + `.env.example` 提供标准路径，需在有 Docker 的环境执行 `docker compose up -d` 后复验 `GET /api/health`。
2. **UI 视觉验收未做截图级检查（环境阻塞）**：本会话无可用浏览器自动化。已通过构建产物 HTTP 验证与断点样式静态审查（768/1024 断点、折叠/抽屉逻辑）；1440/1280/1024/768 的截图走查需人工或具备浏览器工具的环境补做。
3. **`pnpm dev` 简化**：Champion 的交互式启动器（scripts/dev.mjs + @clack/prompts）未迁移，`dev` 直接 `turbo run dev` 并行启动。单仓两端场景下交互选择价值有限，如需对齐 Champion 体验可在后续阶段评估。
4. **Prisma 急切连接语义保留**：admin-api 沿用 Champion"启动即连接、失败阻止启动"的策略，完整启动依赖数据库在线；当前 api 不装配数据库模块，可以独立提供 health。
5. **`.rules` 中保留的 Champion 特定条款**：`directory.md`（apps/web Nuxt 结构、web/ui 引用已按 LY 结构改写顶层树与共享包边界段）、`comment-style.md`（version.ts/check.ts/bootstrap 示例，本仓暂无对应实现）、`admin.md`/`style.md`（业务弹框/表单范本类名）。按任务书原样保留，建议 Codex 后续审查是否拆分。
6. **`.prettierignore` 增加 `auto-imports.d.ts`/`components.d.ts`**：插件重生成格式与 Prettier 不稳定一致，为保 CI 稳定将其排除格式化（Champion 未显式处理此问题）。
7. **工程配置已在 Codex 审查后简化**：删除只被本仓消费一次的 `tooling` 配置包；ESLint、Rstest 与 TypeScript 配置分别回到根目录或所属应用，减少 workspace 与模块加载层级。
8. **共享包已在 Codex 审查后合并**：删除只有单一类型的 contracts 包；前后端与跨应用通用类型统一维护在 `packages/shared/src/types`，无 UI 框架通用工具维护在 `packages/shared/src/utils`。服务端只允许导入 `@repo/shared/types`，避免浏览器工具进入 NestJS 依赖图。
9. **Admin 与图表边界已在 Codex 审查后收紧**：`apps/admin-vue` 更名为 `apps/admin`，不再为假设中的 React 实现携带框架后缀；同时从 Trade 基准提交 `6930b352ad12411d33ad8b5ca6331c023f2c8a68` 迁入无框架 `@repo/charts`，未迁入任何 Trade 业务图表组件与数据。
10. **服务端边界按真实扩展需求提前落位**：新增只有 health 的 `apps/api` 作为未来 C 端 API，默认端口 3000；`admin-api` 改为 3001。Prisma Schema 与生成 Client 从 admin-api 抽到 `@repo/database`，两套服务不共享 JWT、Guard 与业务模块。

---

## 八、下一阶段认证与 RBAC 可参考的 Champion 文件清单（不提前实现）

```text
apps/server/src/modules/admin-auth/            # 登录、JWT 签发、账号状态复查
apps/server/src/common/guards/admin-jwt.guard.ts
apps/server/src/common/guards/admin-role.guard.ts
apps/server/src/common/decorators/current-admin.decorator.ts
apps/server/src/common/decorators/admin-roles.decorator.ts
apps/admin/src/stores/modules/admin.ts          # 前端会话 Store 与持久化边界
apps/admin/src/services/core/helper.ts          # token 读取 + handleAuthenticationFailure
apps/admin/src/services/service-base-interceptor.ts  # Bearer 注入 + 401 统一处理
apps/admin/src/router/index.ts                  # 登录守卫与安全 redirect
apps/admin/src/views/login/index.vue            # 登录页结构（提取布局，不搬验证码/角色模型）
```

迁移时以五表模型（`users / roles / menus / user_roles / role_menus`）重写角色与菜单来源，不复用 `AdminUser`/`AdminRole` 枚举体系。
