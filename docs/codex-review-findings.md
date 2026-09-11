# Codex 待修复问题清单（AI 交叉评审产出 · 第 2 版）

> 本文档由 AI 交叉评审（多角度复核 + 逐条复核反馈）产出，用于交给 Codex 逐条修复。
> 评审基线：`main` 分支，工作区干净。
>
> **第 2 版说明**：第 1 版中若干条目经第二轮实测复核被推翻或降级，已在本版中修正。
> 被推翻的条目统一收敛到文末「附 B：已推翻 / 已撤回的结论」，**请勿再按第 1 版的定级执行**。

---

## 给 Codex 的执行约定

**开工前必读**：`AGENTS.md`（编程思想、硬性架构边界）→ 本文档 → 按问题涉及的领域读 `.rules/` 对应文件。

**四条硬性要求**：

1. **不要一次性大改**。按 P0 → P1 → P2 顺序逐条提交，每条独立 commit，符合 `commitlint` 规范。每条改完立即跑验证。
2. **外科手术式修改**。只改本文档指出的位置，不顺手重构相邻代码、不改格式、不动注释风格。
3. **尊重标注等级与「不建议修」标记**。标 `【已确认】` 的可直接改；标 `【不要修】` 的**是经复核明确的错误建议或过度设计，请勿实施**，即使你认为有道理。
4. **不新增依赖**，不为了让检查通过而放宽 ESLint / 架构检查规则（`scripts/check-architecture.mjs`）。

**每条修完后执行的最小验证**：

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

涉及构建、依赖方向、脚本的改动，追加 `pnpm build && pnpm check:architecture`。
涉及认证、权限、路由的改动，追加 `pnpm test:e2e`。

禁止用脚本吞掉失败码。失败必须如实报告。

---

## 第 2 版相对第 1 版的变更摘要

| 条目                           | 第 1 版   | 第 2 版               | 原因                                                                                    |
| ------------------------------ | --------- | --------------------- | --------------------------------------------------------------------------------------- |
| P0-1 `@repo/database` 构建顺序 | P0 待确认 | **推翻，勿修**        | 实测：移走 `dist` 后 11 个测试文件 / 35 个测试全绿，Rstest 走 tsconfig paths 解析到源码 |
| P0-2 `super_admin` 重复        | P0        | **降为 P2**           | 行为一致，无越权；属可维护性问题                                                        |
| P1-1 失败显示"暂无数据"        | P1 高风险 | **降为 P2 体验项**    | 拦截器已有错误 Toast，查询按钮可重试                                                    |
| P1-2 无请求取消                | P1        | **降为 P2**           | `requestVersion` 已保证正确性；取消只省网络                                             |
| P1-4 `PublicConfig` 默认公开   | P1        | **撤回**              | 该模块契约就是"公共"，加 `isPublic` 反而模糊边界                                        |
| P1-5 单实例限制未文档化        | P1        | **降为 P3 文档小项**  | `SECURITY.md:40` 与 `docs/deployment.md:348` 已明确说明                                 |
| P1-6 数据库约束缺失            | P1        | **大部分撤回**        | 树循环无法用 CHECK 解决；唯一约束会破坏拖拽；`is_active` 索引无依据                     |
| P1-10 守卫并发 `/auth/me`      | P1 待确认 | **确认成立，降为 P2** | 已复现，但常规路径难触发                                                                |
| P3 E2E"只有 7 个用例"          | 覆盖不足  | **修正表述**          | 7 个用例含 24 个 `test.step` / 79 个断言，已覆盖验证码、429、公开读取、RBAC 403         |
| P2-7 / P2-10 / P2-11           | 规范偏差  | **撤回或降为可选项**  | 表格格式化、EP 插槽断言、演示数据均为合理设计                                           |
| P4-6 README Demo / 演示数据    | P1        | **撤回**              | 基于过时内容；Dashboard 已标注"演示数据"                                                |

---

## P0 — 确定性缺陷（仅 3 条）

### P0-1 【已确认】`menu-editor-panel` 的 `validate()` 缺少 `.catch()`

**位置**：`apps/admin/src/views/system/menu/components/menu-editor-panel/index.vue:405-408`

```ts
const submitForm = async (): Promise<void> => {
  if (!(await formRef.value?.validate())) {
    return;
  }
```

**判定依据**：已核对 `element-plus@2.14.4` 安装源码

```
node_modules/.pnpm/element-plus@2.14.4_.../es/components/form/src/form.vue_vue_type_script_setup_true_lang.mjs
119:  const shouldThrow = !isFunction(callback);
131:  return shouldThrow && Promise.reject(invalidFields);
```

**不传回调时 `validate()` 是 reject，不是 `resolve(false)`**。因此 `return` 分支是死代码。

**影响（请勿夸大）**：`emit('save', ...)` 在 await 之后，所以校验失败时保存本来就不会提交，**功能是正确的**。真实影响是：模板 `:143` 是 `@click="submitForm"`，Vue 会把异步事件处理器的异常交给 Vue 错误处理流程（不是浏览器裸 `unhandledrejection`，但同样会污染 Vue 错误日志和接入的全局错误上报）。

**为什么 E2E 没发现**：`tests/e2e/specs/admin-modules.spec.ts:35-37` 断言的是"空表单展示前端校验提示"，提示确实会出现，测试是绿的。

**对照正确写法**（全仓 9 处都写对了，仅此一处漏）：
`use-user-form.ts:84`、`use-role-form.ts:82`、`use-user-password.ts:77`、`use-admin-password-change.ts:110`、`use-public-config-form.ts:51`、`use-dictionary-form.ts:59`、`use-dictionary-items.ts:82`、`use-login-form.ts:140`

**修法**：

```ts
const isValid = await formRef.value?.validate().catch(() => false);
if (!isValid) {
  return;
}
```

**验收**：菜单编辑面板留空必填项点保存，Vue 控制台无错误日志；`pnpm test:e2e` 菜单用例仍通过。

---

### P0-2 【已确认】`useDictionaryItems` 无 catch、无竞态守卫、删除路径无 catch

**位置**：`apps/admin/src/views/system/dictionary/components/dictionary-item-dialog/composables/use-dictionary-items.ts`

**这是本次评审最值得优先处理的问题。**

**缺陷 1 —— 加载无 catch（`:42-52`）**：

```ts
const loadItems = async (): Promise<void> => {
  if (!dictionary.value) return;
  loading.value = true;
  try {
    const result = await fetchAdminDictionaryItems(dictionary.value.id, filters);
    itemList.value = result.list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};
```

调用点是 `:59` 的 `void loadItems()` 和模板 `dictionary-item-dialog/index.vue:19` 的 `@click="loadItems"` → 请求失败产生未处理拒绝。

**缺陷 2 —— 无 `requestVersion` 守卫（`:46-48`）**：`result.list` 直接赋值，没有版本校验。真实场景：

- 快速连点分页，旧响应覆盖新响应；
- **打开字典 A（请求在途）→ 关闭 → 打开字典 B → B 的弹框里显示 A 的字典项**；
- 旧请求提前把新请求的 `loading` 置为 false。

`@closed` 只 emit change（`dictionary-item-dialog/index.vue:141-145`），不会使在途请求失效。

**缺陷 3 —— 删除路径同样只有 `finally`**，请一并处理。

**修法（照抄 `use-role-menu-permission.ts` 的既有模式，不要自创）**：

- `use-role-menu-permission.ts:74,83` —— `const version = ++requestVersion` / `if (version !== requestVersion) return`
- `:134-140` —— `handleClosed` 内 `requestVersion += 1`
- `:142-144` —— `onBeforeUnmount` 内 `requestVersion += 1`
- 参照 `use-pagination.ts:70-93` 的版本判定与 loading 处理

**验收**：新增单测覆盖「慢响应不覆盖新响应」「切换字典不串数据」「失败不产生未处理拒绝」，写法参照 `use-user-management.test.ts:235-252` 的 deferred 模式。

---

### P0-3 【已确认】`usePublicConfigManagement.handleDelete` 无 catch

**位置**：`apps/admin/src/views/system/config/composables/use-public-config-management.ts:41-51`

```ts
try {
  await deleteAdminPublicConfig(config.id);
  ElMessage.success('公共配置已删除');
  if (itemList.value.length === 1 && filters.pageNum > 1) {
    await handlePageNumChange(filters.pageNum - 1);
  } else {
    await reload();
  }
} finally {
  deletingId.value = undefined;
}
```

只有 `finally`，没有 `catch`。调用点 `config/index.vue:45` 的 `@click="handleDelete(...)"` → 删除失败时业务事件 Promise 继续失败。

**对照**：同批三个删除流程都有 catch——`use-role-management.ts:73`、`use-user-management.ts:71`、`use-dictionary-management.ts:55`。

**补充说明（修正第 1 版错误）**：该文件**并非零测试**，`use-public-config-management.test.ts` 已存在，只是只覆盖加载与删除成功，**未覆盖删除失败**。请补失败分支测试。

---

## P1 — 真实缺陷与风险

### P1-1 【已确认】滑块验证码图片加载失败无兜底，鼠标用户可能死路

**位置**：`apps/admin/src/views/login/components/slide-verify/index.vue:4-18`

只有 `@load`，**没有 `@error`、没有超时**。而 `:126-128` 要求 `readyImageCount` 达到 2 才算就绪；父层 `login-captcha-dialog/index.vue:38` 只在 `@ready` 时清零 `isLoading`。

样式层级导致**鼠标用户无法自救**：`index.scss:29-31` 的 `__loading{z-index:3}` 高于 `:38-40` 的 `__refresh{z-index:2}`，且遮罩没有 `pointer-events: none` → 刷新按钮被加载遮罩盖住点不到（Tab/Esc 键盘仍可救）。

**修法**：加 `@error` 处理 + 合理超时兜底 + 明确错误提示 + 保证加载态下刷新按钮可点击（调 z-index 或加 `pointer-events`）。

**验收**：模拟图片请求失败，用户能看到错误提示且能刷新重试；建议补组件测试或 E2E。

---

### P1-2 【已确认】前端 `permissions` 是只写数据，未用于任何 UI 门禁

**位置**：`apps/admin/src/stores/modules/auth.ts:31,107,118` 把 `permissions` 存入 Pinia 并持久化：

```ts
const permissions = ref<PermissionCode[]>([]);
// ...
persist: { key: 'APP_PINIA_AUTH', pick: ['token', 'user', 'menus', 'permissions'] }
```

但**全仓搜索确认：除 store 自身与其测试外，没有任何地方读取它**。

**边界说明（重要，勿误判为漏洞）**：服务端覆盖完整（5 个业务控制器共 **32 处** `@RequirePermissions`：user 7 / dictionary 8 / menu 6 / role 7 / public-config 4），权限真实生效；侧边栏由服务端 `menus` 驱动。**这不是安全漏洞。**

**真实问题**：用户可能拥有某页面菜单，但没有该页面的新增/编辑/删除权限，页面仍显示全部操作按钮，点击后被服务端 403 打回。

**修法方向（需先由项目负责人决策，勿自行发挥）**：

- **推荐**：实现**按钮级权限 helper / 组件 / 指令**（按 `permissions` 隐藏无权限按钮）。
- **注意**：单纯增加路由 `meta` **不能**解决按钮级问题——菜单权限与操作权限是不同层级。
- 或者：明确文档化「前端不做权限门禁，服务端是唯一门禁」，并**停止持久化 `permissions`**（消除误导）。

---

### P1-3 【已确认，已复现】`/auth/me` 会话恢复缺少 in-flight 去重

**位置**：`apps/admin/src/router/index.ts:95-105`

```ts
if (!authStore.sessionReady) {
  try {
    await authStore.restoreSession();
  } catch {
    authStore.logout();
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
}
```

`sessionReady` 只在 `applySession` 之后置 `true`（`apps/admin/src/stores/modules/auth.ts:56,86`）。已用 Vue Router 最小复现确认：第一次导航进入异步 `beforeEach` 后、在其 `await` 期间发起第二次导航，第二次守卫会同时执行，两次都可能调用 `restoreSession()`。

**风险定级**：技术成立，但**常规首次进入页面时较难频繁触发**，属小型加固，不是高风险问题。

**修法**：把 in-flight 的 `restoreSession` Promise 缓存，重复调用返回同一 Promise。

**验收**：`restoreSession` 并发去重的单测（两次并发调用只发一个请求）。

---

### P1-4 【已确认】4 个 WebGL 上下文 + 渲染循环内每帧 `matchMedia`

**位置**：

- `apps/admin/src/views/dashboard/index.vue:7-21` 遍历 `METRIC_CARDS`（4 项，`:54-111`），每张卡一个独立 rAF（`renderer.ts:384`）。
- `apps/admin/src/views/dashboard/components/fluid-glass-card/renderer.ts:339` 在**渲染循环内部**调用：
  ```ts
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  ```
  按 45fps × 4 张卡 ≈ **每秒 180 次**。

**先明确：这不是内存泄漏。** 销毁路径 `renderer.ts:386-394` 完整（`cancelAnimationFrame` + 双 observer `disconnect` + `controller.abort()` + `deleteBuffer` + `deleteProgram` + `WebGL_lose_context.loseContext()`）。

**修法（只做第一步）**：把 `matchMedia` 提到初始化作用域读取，用 `change` 事件更新。

**不要做**：合并 4 个 rAF / 合并 WebGL 上下文——4 个上下文是当前视觉方案的一部分，**必须先测量**是否有实际 CPU/GPU 压力，不要在无数据的情况下重构。

---

## P2 — 体验增强与可维护性

### P2-1 【已确认】加载失败被显示为「暂无数据」

**位置**：`apps/admin/src/composables/use-pagination.ts:84-87`

```ts
} catch {
  if (version === requestVersion && !itemList.value.length) {
    total.value = 0;
  }
}
```

首次加载失败时列表为空，页面落到 `el-table` 的 `#empty` 插槽，显示"暂无用户数据"之类的空状态文案（如 `views/system/user/index.vue:95-97`），混淆了「请求失败」与「真实空数据」。

**请勿夸大**：并非没有反馈——Axios 响应拦截器会显示错误 Toast；也并非没有重试入口——页面查询按钮仍可重新发起请求。这是**体验增强**，不是高风险缺陷。

**修法**：`usePagination` 增加 `isError` 状态与 `retry()`；列表页 `#empty` 插槽区分「无数据 / 加载失败」并给出重试按钮。不要顺手改所有列表页文案风格。

---

### P2-2 【已确认，影响有限】业务请求未使用请求取消

`grep` 全仓 `AbortController` 只命中 4 处，**全在 WebGL 事件监听**（`renderer.ts:264,364,366,374`），无一作用于 axios，与 `.rules/code-review.md:115` 不一致。

**影响说明**：`usePagination` 已通过 `requestVersion` 保证旧请求不会覆盖新结果、页面卸载后不更新状态，**不构成数据竞态或内存泄漏**。请求取消的价值是减少无效网络与服务端计算。

**修法（二选一，需负责人决策）**：

1. 为列表请求增加 `AbortSignal`；
2. 或修订 `.rules/code-review.md`，说明「版本守卫」与「请求取消」分别解决什么，不要求所有短请求强制取消。

**注意**：若选方案 1，`apps/admin/src/services/` 禁止依赖 Router/Store（见 `scripts/check-architecture.mjs:181-187`），不要为了取消功能破坏该边界。

---

### P2-3 【已确认】`super_admin` 与权限码规则重复定义

**问题**：`super_admin` 决定了「谁是超管」，在四处各写一遍：

| 位置                                                         | 写法                                           | 作用                     |
| ------------------------------------------------------------ | ---------------------------------------------- | ------------------------ |
| `apps/admin-api/src/constants/modules/role.ts:11`            | `SYSTEM_SUPER_ADMIN_ROLE_CODE = 'super_admin'` | 唯一正确常量             |
| `apps/admin-api/src/modules/rbac/rbac-access.service.ts:103` | 裸字符串                                       | 决定菜单可见范围         |
| `apps/admin-api/src/common/guards/permission.guard.ts:40`    | 裸字符串                                       | 决定直接放行所有权限检查 |
| `apps/admin/src/views/system/user/index.vue:52`              | 裸字符串                                       | 前端展示                 |

**定级说明（已从 P0 降级）**：当前所有位置行为一致，**没有形成实际越权漏洞**，属核心规则一致性与可维护性问题。

**修法方向**：

1. 统一**生产代码**中的判断逻辑，指向单一常量。
2. **注意**：把常量放入 `@repo/shared/types` 前，需先决定该 types 入口是否允许承载**运行时常量**（而非纯类型）。`apps/admin-api` 按硬性边界只能从 `@repo/shared/types` 导入。
3. **不要**改测试 fixture 中的 `super_admin` 字面量——测试中显式写出该状态是正常的。（第 1 版给出"全仓只允许出现一次"的验收标准是错的。）

**同类问题**：三段式权限码两套实现不一致：

- `apps/admin-api/src/modules/menu/menu.service.ts:41` —— 严格正则 `/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/`
- `apps/admin/src/views/system/menu/components/menu-editor-panel/index.vue:258` —— 前端抄了同一个正则
- `apps/admin-api/src/modules/rbac/rbac-access.service.ts:33` —— 宽松实现 `value.split(':').length === 3`

宽松实现**会错误接受** `a::c`、含大写字符等不符合严格格式的三段字符串。（第 1 版称它接受 `a:b:c:` 是错的——`split(':')` 长度为 4，同样会被拒绝。）统一前请确认严格的 `menu.service.ts:41` 是期望语义。

---

### P2-4 【已确认】Dashboard 的滑块并发守卫位置与规范相反（当前不可触发）

6 处是「先 await validate，后置位 submitting」：`use-user-form.ts:80-89`、`use-role-form.ts:78-87`、`use-user-password.ts:73-82`、`use-admin-password-change.ts:106-115`、`use-public-config-form.ts:51-52`、`use-dictionary-items.ts:82-83`。规范模式（`.rules/error-handling.md:83-86`）是「先置位再 await」。

**诚实评估**：当前规则**全是同步校验**，浏览器会在下一次点击事件前完成 microtask，**当前难以触发**。这条现在不构成真实缺陷，一旦引入 `asyncValidator` 才会真实化。

**修法（二选一，勿同时做）**：

1. 统一改为「检查 submitting → 立即置位 → validate → finally 恢复」；
2. 或在 `.rules/error-handling.md` 中说明同步表单校验允许当前写法。

---

## P3 — 测试补齐

### 现状（已修正第 1 版的错误表述）

- 单测：**34 个** `*.test.ts`（admin 前端 16 个，集中在 composable；`.vue` 组件无测试）。
- E2E：**7 个顶层用例**，但包含 **24 个 `test.step` / 79 个断言**，且是真实页面交互 + 真实 PostgreSQL + 真实 migration/seed + 真实双 API + 真实验证码登录。

**因此以下能力已经被覆盖，不要再列为缺口**：滑块验证码完整登录流程、登录接口 429 限流、公共配置完整闭环与公开读取、非超管菜单差异与服务端 403、未登录跳转与回跳、`/auth/me` 会话恢复、退出后重新保护路由。

### 真正值得新增的测试（按缺陷暴露面排序）

1. `useDictionaryItems` —— 慢响应覆盖、字典切换串数据、失败不产生未处理拒绝（**P0-2 所在**）
2. `usePagination` —— 请求竞态、卸载失效、失败状态
3. `use-public-config-management` —— **删除失败分支**（该文件已有测试，补失败用例）
4. `renderer.ts`（fluid-glass-card）—— 销毁契约（WebGL 上下文释放）
5. `router/index.ts` 的 `resolveInternalRedirect:64-68` —— **安全相关**（防开放重定向）且完全未测
6. 修改密码后旧 Token 真实失效（`tokenVersion` 机制）
7. 菜单拖拽排序与循环引用拒绝
8. `restoreSession` 并发去重（**P1-3 所在**）
9. 验证码图片加载失败与重试（**P1-1 所在**）

### 正面参照（新测试照此写，不要写断言实现细节的白盒测试）

- `use-user-management.test.ts:235-252` —— deferred 验证删除并发保护
- `use-user-management.test.ts:208-218` —— 末页回退；`:220-233` —— 失败不刷新
- `service-base-interceptor.test.ts:44,70-107` —— 真实 `AxiosError` + 401 豁免矩阵
- `use-theme.test.ts:53` —— 验证监听被移除

---

## P4 — 规范整理（单独 PR，不与其他修复混合）

- **P4-1 Emits call-signature 写法**（`vue3.md:453` 禁止）：`menu-editor-panel/index.vue:202,207,212,217`、`menu-tree-panel/index.vue:138,143,148,153`、`slide-verify/index.vue:92,97,102`、`menu-icon-picker/index.vue:95`、`login-captcha-dialog/index.vue:69`
- **P4-2 内联 `defineEmits`**（`vue3.md:454` 禁止）：`public-config-form-dialog/index.vue:52`、`dictionary-form-dialog/index.vue:51`、`dictionary-item-dialog/index.vue:117`
- **P4-3 未使用 `defineModel`**（`vue3.md:365-383`）：`menu-icon-picker/index.vue:80,101,148` 手写 `modelValue` + `update:modelValue`（全仓唯一）
- **P4-4 内联样式超 50 行**（`style.md:56-57`）：`components/layouts/layout-side/index.vue:60-155`（97 行）、`views/system/user/index.vue:219-277`（58 行）
- **P4-5 模板内多语句箭头**（`vue3.md:720`）：`dictionary-item-dialog/index.vue:62-67`、`menu-tree-panel/index.vue:56`
- **P4-6 `menu-editor-panel` 纯树算法下沉**：`<script setup>` 285 行，含 4 个纯树算法 `collectExcludedIds:295-307`、`flattenParentOptions:317-328`、`collectBoundPages:343-354`、`validator:241-268`，按 `vue3.md:691` 应下沉 utils。
  **注意**：仅此一个组件可依行数判定职责过重。**不要**因为文件行数大就拆 `layout-header`、`fluid-glass-card`、`menu-tree-panel`——规范约束的是"业务逻辑超过 20 行"，不是模板/类型/注释/样式的总行数。
- **P4-7 通用启停状态常量命名**：`constants/modules/model.ts:23-32` 与 `:142-151` 两个状态选项数组完全一致；`:92` 字典筛选复用了 `ADMIN_ROLE_STATUS_OPTIONS` 这个角色命名。建议改成中性的公共状态选项。
  **不要**抽象那 4 份结构相似的删除流程（`use-role-management.ts:48-92`、`use-user-management.ts:46-90`、`use-dictionary-management.ts:33-68`、`use-public-config-management.ts:33-60`）——它们各自包含不同领域状态与刷新逻辑，强行抽象会引入泛型/回调/配置复杂度，违反最小实现原则。
- **P4-8 `constants/modules/model.ts` 注释缺失**：`:73,80,96,103,110,118,124,133` 无注释，补齐。
  **修正**：第 1 版称 `use-dictionary-items.ts`、`use-public-config-management.ts` "整文件零 JSDoc"是**错误的**——两者都有模块职责 JSDoc，只是内部函数未逐一注释。

---

## P5 — 文档与类型（可选）

- **P5-1** `README.md:189` 写「`pnpm setup` 校验**前端端口**」，`scripts/setup.mjs:179-186` 实际同步的是 **Admin API 端口**（`syncAdminDevelopmentApiPort`），`scripts/setup.mjs:73` 的输出文案又是「校验前端 API 端口」。三种表述不一致，统一为准确措辞。
- **P5-2** `packages/database/prisma/seed.ts:228` 的类型断言 `routeName: menu.routeName as string` 掩盖了「页面/目录必须有 `routeName`、按钮必须有 `permissionCode`」的约束。**推荐**把 `SeedMenu` 改为按 `MenuType` 区分的联合类型，从编译期保证字段组合合法（优于单纯加运行时 if）。
- **P5-3** `README.md` 可增加一句单实例认证状态限制的摘要并链接到 `SECURITY.md:40` 与 `docs/deployment.md:348`。
  **注意**：该限制**并非没有文档**——`SECURITY.md:40` 已写明"当前登录限流使用单个 Node.js 进程的内存计数器，适合仓库默认的单实例模块化单体部署"，`docs/deployment.md:348` 已写明"多实例部署必须把限流和一次性挑战存储上移到 API 网关、WAF 或 Redis 等共享设施"。属文档补充，不是代码缺陷。
- **P5-4** 可在 `.rules/directory.md` 说明三个共享包导出策略不同的原因（`packages/charts` 导源码；`packages/shared`、`packages/database` 导 `dist`）。
  **注意**：策略不同**不等于架构错误**，包的角色本就不同。不要为此改导出方式。

---

## P6 — 工程基建（独立复核产出，均为本仓库自身机制问题）

> 本节的发现来自工程基建方向的独立复核，且**已在本机实测门禁**。与业务代码无关，但会直接影响"门禁是否可信"。

### P6-1 【已实测】`turbo.json` 缺 `globalDependencies`，导致缓存假绿

`turbo.json` 全文没有 `globalDependencies` / `globalEnv`。实测 `turbo run typecheck --dry=json`：**6 个 typecheck 任务的输入集合中均不含 `tsconfig.base.json`**。

后果：修改 `tsconfig.base.json:5-16`（如 `strict`、`target`、`moduleResolution`）**不会**使 `typecheck` / `test` / `build` 的缓存失效。本地会复用旧结果，若将来接入远程缓存则 CI 也会。

**修法**：在 `turbo.json` 增加

```json
"globalDependencies": ["tsconfig.base.json", ".editorconfig", "pnpm-lock.yaml"]
```

**验收**：改动 `tsconfig.base.json` 后 `turbo run typecheck` 必须重新执行而非命中缓存。

---

### P6-2 【已确认】`build` 的 `outputs` 与实际产物不符

`turbo.json:9-13` 声明 `"outputs": ["dist/**"]`，但 `@repo/database#build`（`packages/database/package.json:12` = `pnpm generate && tsc -p tsconfig.build.json`）还会产出 `packages/database/generated/prisma`。该目录不在 `outputs` 中 → 缓存命中回放时不会恢复，只能依赖 `postinstall` 的 `pnpm generate`。

**修法**：把 `generated/prisma` 纳入 `@repo/database` 的 outputs，或为该包使用 `turbo.json` 的 package-specific 覆盖配置。

---

### P6-3 【已确认】`check-architecture.mjs` 的服务端边界是硬编码应用名单

`scripts/check-architecture.mjs:202`：

```js
const serverApplicationRoots = ['admin-api', 'api'].map((name) => join(WORKSPACE_ROOT, 'apps', name, 'src'));
```

而 `eslint.config.js:45-47` 是用 `getWorkspaceApplications(readWorkspaceConfig(...))` **动态派生**的。

后果：`pnpm new:server` 生成的第 3 个服务（`README.md:181` 举例 `content-api`）**不会**被检查 `@repo/shared` 越界规则（`check-architecture.mjs:206-212`）。这直接违反 `AGENTS.md` 的硬性边界「**应用注册表是本地运行真相源**」。

**修法**：改为从 `scripts/workspace-config.mjs` 的 `getWorkspaceApplications()` 派生 `kind === 'server'` 的应用列表，与 `eslint.config.js` 保持同一来源。

**验收**：临时用 `pnpm new:server` 生成一个服务并放入违法的 `@repo/shared` 导入，`pnpm check:architecture` 必须报错。

---

### P6-4 【已确认】忽略规则按目录名字面量硬编码，且存在误提交风险

`scripts/check-architecture.mjs:12`：

```js
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', '.turbo', '.rsbuild', 'generated']);
```

配合 `:220`「packages 下出现 `.js/.d.ts/.js.map` 即报错」，任何**不以 `dist` 命名的构建残留**都会打挂门禁。这不是假设——本次评审期间一个临时目录同时打挂了三个门禁：

- `pnpm check:architecture` → 8 条 `packages/database/dist_hidden_tmp/...: packages 手写目录禁止出现 TypeScript 编译产物`
- `pnpm format:check` → `Code style issues found in 36 files`（`.prettierignore` 只有 `dist` 字面量，Prettier 3 默认读 `.gitignore` + `.prettierignore`，该目录两者都不匹配）
- `pnpm lint` → `✖ 10469 problems (21 errors, 10448 warnings)`，全部来自该目录；加 `--ignore-pattern` 后 **exit 0**，反证源码本身干净

**更严重的是**：该目录**未被 `.gitignore` 覆盖**，可被 `git add -A` 误提交。

**修法**：

1. 忽略规则改为模式匹配（如 `dist*/`、`**/generated/**`），而不是枚举目录名；
2. `.gitignore` 增加 `dist*/`；
3. CI 增加一步 `git status --porcelain` 非空即失败，从机制上杜绝未跟踪残留。

---

### P6-5 【已确认】模板冒烟测试跳过生成物的编译与测试

`scripts/test-server-template.mjs:80` 设置 `LY_FULLSTACK_PLOP_SKIP_COMMANDS: '1'`，跳过了 `plopfile.mjs:178-186` 的 `pnpm install` / `typecheck` / `test` / `build`。

该脚本只校验：13 个文件存在（`:20-34,86-90`）、内容不含 `{{`/`}}`（`:92-95`）、跑一次 `prettier --write`（`:98-102`）、注册表字段写入（`:104-108`）。

后果：**模板生成出不能编译、不能通过测试的服务，CI 依然全绿**；模板自带的 `health.controller.test.ts` 从未被执行过。

而 `README.md:283` 声称「经过**真实生成验证**的 NestJS 服务模板」、`README.md:179` 声称生成器会「安装依赖，并验证新服务的类型、测试与构建」——**后者仅交互路径成立**，CI 路径不成立。

**修法**：在临时目录中不跳过命令，至少执行 `typecheck` + `test`；或明确修正 README 措辞，区分「交互式生成会验证」与「CI 冒烟只校验文件与占位符」。

---

### P6-6 【已确认】`pnpm dev:stop` 在非 Windows 是空操作，且失败时报假成功

`scripts/dev.mjs:417-420`：

```js
if (process.platform !== 'win32') {
  return 0;
}
```

随后 `main()` 仍打印成功（`:681-682`「已停止 0 个 LY Fullstack 开发进程。」）。

更严重的是 `:446-458` 只取 PowerShell 输出的数字，**从不检查 `result.status` / `result.error`**：

```js
Number.isFinite(count) ? count : 0;
```

→ PowerShell 不可用或命令失败时，同样给出「已停止 0 个」的**假成功**。这违反 `AGENTS.md` 的「**禁止用脚本吞掉失败码**」。

**文档影响**：`README.md:164`「执行 `pnpm dev:stop` 停止本仓库的全部开发进程」、`README.md:196`、`website/docs/reference/commands.md:29` 均未说明这是 **Windows-only**。

**修法**：非 Windows 明确报「暂不支持」并以非零退出（或实现 Linux/macOS 路径）；检查 `status`/`error` 并如实上报失败。

---

### P6-7 【已确认】`packages/database` 零测试，而它是风险最高的代码

turbo dry-run 显示 `@repo/database#test` 的 `Command = <NONEXISTENT>`，同时输出「Running test in 6 packages」。

Schema、迁移、**Seed**（`packages/database/prisma/seed.ts`，含幂等 upsert 与权限树写入）全部无自动化覆盖。此外全仓**无覆盖率工具与阈值**（仅 `packages/charts/package.json:17`、`packages/shared/package.json:11` 有 `rimraf coverage` 残留，无 `--coverage`、无 thresholds）。

**修法**：至少为 `seed.ts` 的幂等性与 `upsertMenus` 的树写入加集成测试（可用 E2E 已用的独立测试库）。

---

### P6-8 【已确认】门禁对 `any` / `console` 实际无强制力，与文档声称不符

- `eslint.config.js:80`：`'@typescript-eslint/no-explicit-any': 'warn'`
- `package.json:26`：`eslint . --cache ...`，**没有 `--max-warnings 0`**

→ warning 永不让 CI 变红。而 `AGENTS.md` 写「不使用 `any`……是**绝对不妥协**的」，`README.md:300` 写「不符合规范的代码**过不了 lint、架构检查和 CI 门禁**」。

同样无机器校验的规范条目：`no-console`（`.rules/code-review.md:145` 要求无遗留 `console.log`）、「组件业务逻辑不超过 20 行」、「函数返回类型明确」。

**正面**：`eslint.config.js:96-133` 的 Element Plus / Pinia / Vue 自动导入 `no-restricted-imports` 是**真实强制**的，`.rules/code-review.md:146` 的说法成立。

**修法（二选一）**：给 `eslint` 加 `--max-warnings 0` 并补 `no-console`（会立即暴露存量告警，需评估）；或修订 `AGENTS.md` 与 `README.md:300` 的措辞，如实说明哪些规范靠自觉、哪些有机器兜底。

---

### P6-9 【已确认】CI 工程细节

- 无 `.turbo` / Playwright 浏览器缓存，`actions/setup-node` 仅 `cache: pnpm`（`ci.yml:33,88`）。
- `quality` job `timeout-minutes: 20`（`ci.yml:20`）需冷跑「全仓 `vue-tsc` + eslint + rstest + rsbuild 生产构建 + rspress 构建」，偏紧。
- `integration` job **没有 `needs: quality`**（`ci.yml:41-45`）→ 与 quality 并行、重复 `install`，且质量问题不会快速取消集成任务。
- `.github/workflows/docs.yml` 只在 `push main` / `workflow_dispatch` 触发（`docs.yml:3-7`），不带 `pull_request`；且被部署检查的 base 路径 `RSPRESS_BASE: /ly-fullstack/`（`docs.yml:48`）**从未在门禁中验证**——`pnpm check` 里的 `docs:build` 不带该变量（`rspress.config.ts:19` 默认 `/`）。
- Husky 只有 `pre-commit` 与 `commit-msg`，**无 `pre-push`**；`lint-staged` 只 lint 暂存文件，类型/测试完全依赖远端 CI。
- `website/tsconfig.json`（含 `checkMdx: true`）**无任何脚本/turbo/CI 引用** → 死配置，`website/**/*.ts` 不参与类型检查。

---

### P6-10 【已确认】E2E 的"真实滑块"被测试钩子弱化

`tests/e2e/helpers/login-captcha.ts:35` 发送 `x-ly-e2e-captcha: playwright`，`:47` 要求服务端返回 `testOffset`；服务端 `apps/admin-api/src/modules/auth/auth.controller.ts:43`：

```ts
const exposeTestOffset = process.env.APP_ENV === 'test' && e2eMarker === 'playwright';
```

拖动与 `/captcha/verify` 校验是真的，但**图形识别步骤未被覆盖**。而 `docs/e2e-testing.md:7`、`website/docs/operations/playwright.md:12` 写的是「**真实**滑块验证码」。

**修法**：修正文档措辞，说明测试通过 `testOffset` 钩子获取正确坐标，滑块服务端的拖动校验路径是被真实执行的、图形识别不是。

**注意**：`testOffset` 后门本身受 `APP_ENV === 'test'` 保护，是合理设计，不要移除。

---

## 附 A：本次评审确认「做得好」（请勿改动）

修复其他问题时**不要**顺手"优化"这些已确认正确的实现：

1. **认证/授权链路**
   - `apps/admin-api/src/common/guards/admin-jwt.guard.ts:63-72` —— 先验签、再查库确认账号启用、最后比对 `tokenVersion`；角色权限**不从 Token 读**，权限收回立即生效。
   - `apps/admin-api/src/modules/user/user.service.ts:165-171,194-200,250-256` —— 超管保护四条，全在 Service 层。
   - `apps/admin-api/src/modules/auth/auth-captcha.service.ts:125-139` —— 挑战记录在判断结果前删除，无法重放；答案不下发浏览器。
   - `apps/admin-api/src/modules/auth/auth.service.ts:110` —— 禁止新旧密码相同。

2. **前端资源释放（已逐一核对，无一处泄漏）**
   - `fluid-glass-card/renderer.ts:386-394` —— WebGL 销毁范本
   - `use-dashboard-chart.ts:63-67`、`use-dialog-size.ts:40-42`、`use-theme.ts:54-56`、`layout-header/index.vue:313-321`、`bootstrap/index.ts:145-148`
   - `fluid-glass-card/index.vue:199-207,255` —— 主题重建用 generation 防串台

3. **竞态与防重复提交（P0-2 是唯一例外）**
   - `usePagination.ts:45,71-78,89-91,141-143` —— 干净的竞态防护模板
   - `use-role-menu-permission.ts:74,83,134-140,142-144`
   - `use-data-filter-panel.ts:32,88-105,143-145`

4. **分层与依赖方向**
   - `apps/admin/src/services/` 不导入 Router / Pinia / Element Plus，通过 `configureServiceAuth` / `configureServiceFeedback` 注入（`bootstrap/index.ts:108-129`）
   - `service-base-interceptor.ts:64` 的 401 豁免逻辑有测试覆盖
   - `scripts/check-architecture.mjs` 是真正生效的机器化门禁

5. **类型纪律**：全仓无 `any` / `as any` / `@ts-ignore` / `console.log`（唯一例外 `apps/admin/src/types/modules/axios.ts:1`，属框架继承，规范允许）；Element Plus 一律 `import type`；`router/index.ts:64-68` 的 `resolveInternalRedirect` 防开放重定向。

6. **文档纪律**：`README.md:48-57,286` 主动声明能力边界与不适用场景；`ROADMAP.md:38-43` 明确列出非目标。

---

## 附 B：已推翻 / 已撤回的结论（勿修）

**以下条目请勿实施**，它们经第二轮复核已被推翻或判定为过度设计：

| 原条目                                                                                 | 结论           | 依据                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@repo/database` 运行依赖构建产物；`turbo.json` 的 `test` 需加 `dependsOn: ["^build"]` | **推翻**       | 实测移走 `packages/database/dist` 后，`pnpm --filter @repo/admin-api exec rstest run` → 11 个测试文件 / 35 个测试全绿。Rstest 读取 `apps/admin-api/tsconfig.json` 的 paths，将 `@repo/database` 解析到源码。强行加 `^build` 只会增加测试耗时。开发启动路径由 `scripts/dev.mjs:303` 显式构建 database 保障。               |
| 给 `PublicConfig` 加 `isPublic` 字段                                                   | **撤回**       | 该模块的领域定义就是"公共配置"：默认 API 接口名为公共配置、管理页面写明"维护 C 端可以免登录按键读取的非敏感配置"、弹框警告禁止保存密码/Token/密钥。"保存后即可公开"是**明确契约**而非不安全默认值。加 `isPublic` 会把公共配置与内部配置重新混入同一张表，反而模糊边界。真实项目需要内部配置时应**单独设计私有配置模块**。 |
| 给 `menus` 加跨行树循环 CHECK 约束                                                     | **撤回**       | 跨多行的树形循环无法用普通 CHECK 解决，需递归触发器/闭包表/路径字段，复杂度远超模块化单体的真实需要。所有菜单写入统一经过 Service 且已做循环检查，属合理设计。                                                                                                                                                            |
| 给 `menus` 加 `@@unique([parentId, sortOrder])`                                        | **撤回**       | 可能引入新问题：PostgreSQL 唯一约束允许多个 NULL（根菜单 `parentId=NULL` 不受预期保护）；拖拽交换顺序时逐条 update 会产生短暂重复值；非 deferrable 约束可能让合法交换失败。需要两阶段排序或可延迟约束设计，**不要直接加**。                                                                                               |
| 给 `users.is_active` 加索引                                                            | **撤回**       | 布尔字段选择性极低，单独索引未必有收益，应基于实际数据规模、启停比例、组合条件与 `EXPLAIN ANALYZE` 判断。另：第 1 版称"Role 已有 `isActive` 索引、User 没有所以不一致"是**事实错误**——`schema.prisma` 中 Role 也没有该索引。                                                                                              |
| 健康检查应探数据库                                                                     | **撤回**       | `/health` 的注释已明确它是服务存活检查（liveness）。liveness 不访问数据库是**合理设计**——数据库不可用时让进程保持存活有利于故障恢复，避免被编排系统反复重启。将来需要 readiness 时**新增独立 `/ready`**，不要改变现有 `/health` 语义。                                                                                    |
| README 宣称的"公开只读 Demo 延期"与演示数据冒充真实监控                                | **撤回**       | 基于过时内容。当前 `README.md` 已无该表述。Dashboard 图表区（`dashboard-chart-panel/index.vue:12`）与系统状态区（`dashboard-system-overview/index.vue:16`）已在 UI 中明确标注"演示数据"，`dashboard/index.vue:43` 注释也说明是演示数据装配。                                                                              |
| 模板中调用 `formatAdminDateTime(row.updatedAt)` / `getUserInitial(row)` 属反模式       | **撤回**       | 这是正常的表格行格式化，不是"用函数替代可缓存 computed"的典型反模式。为避免一次纯函数调用而映射整个列表反而增加复杂度。                                                                                                                                                                                                   |
| `el-table` 插槽内 `row as XxxListItem` 断言应收敛                                      | **降为可接受** | Element Plus 表格插槽类型精度不足导致的局部断言，当前可接受。                                                                                                                                                                                                                                                             |
| `bootstrapAdminApp()` 返回的 disposer 在 `main.ts` 被丢弃 = 死代码                     | **撤回**       | 该 disposer 是为测试、微前端卸载和未来应用销毁准备的。根 SPA 在整个页面生命周期内不卸载，main 不保存它**不等于死代码**。                                                                                                                                                                                                  |
| "E2E 只有 7 个用例，覆盖严重不足"                                                      | **修正表述**   | 7 个用例含 24 个 `test.step` / 79 个断言，且为真实端到端。**不要**把验证码流程、429 限流、公共配置公开读取、RBAC 403 列为缺口——它们已被覆盖。                                                                                                                                                                             |
| "`use-public-config-management.ts` 零测试"                                             | **事实错误**   | `use-public-config-management.test.ts` 已存在，只是未覆盖删除失败分支。                                                                                                                                                                                                                                                   |

---

## 开工顺序（已按复核结论重排）

```text
第一批：真实缺陷
  1. P0-2 useDictionaryItems（竞态 + catch + 删除路径 + 单测）  ← 最高优先
  2. P1-1 验证码图片失败、超时与刷新入口
  3. P0-1 菜单表单 validate() 异常处理
  4. P0-3 公共配置删除 catch + 失败测试
  5. P1-3 /auth/me in-flight 去重
第二批：体验与性能
  1. P1-2 按钮级权限控制（需先决策方案）
  2. P1-4 将 matchMedia 移出渲染循环
  3. P2-1 分页列表区分加载失败与真实空数据
  4. 根据测量结果决定是否进一步合并渲染循环（先测量，勿预设）
第三批：规范整理（单独 PR）
  P4-1 → P4-2 → P4-3 → P4-4 → P4-5 → P4-6 → P4-7 → P4-8
第四批：文档与类型
  P5-1 → P5-2 → P5-3 → P5-4
第五批：工程基建（独立于业务代码，收益最高的是 P6-1 ~ P6-4）
  P6-1 缓存失真 → P6-3 架构检查漏口 → P6-4 忽略规则 + 误提交防护
  → P6-5 模板冒烟 → P6-6 dev:stop → P6-8 lint 强制力 → P6-2 → P6-7 → P6-9 → P6-10
第六批
  P3 测试补齐（按缺陷暴露面顺序）
```

每批结束执行一次完整 `pnpm check`。

---

## 附 C：本次复核已验证的事实

- `pnpm check:architecture`：通过。
- Admin：16 个测试文件 / 85 个测试全部通过。
- Admin API：临时移走 `packages/database/dist` 后，11 个测试文件 / 35 个测试全部通过（推翻 P0-1）。
- Vue Router 并发守卫：已复现「第一次守卫 `await` 期间，第二次导航可再次进入守卫」（确认 P1-3）。
- Git 工作区：保持干净。
- 门禁实测（工程基建方向复核）：`check:architecture` / `lint` / `format:check` / `typecheck:e2e` / 两个包的 `typecheck` 全部 exit 0。
- 未覆盖：Rstest 单测与模板冒烟的**实际执行结果**（沙箱禁止子进程管道，`spawn EPERM`），以及 `pnpm build` / `docs:build` 的完整重跑。

---

## 附 D：关于 `packages/database/dist_hidden_tmp/` 的说明（评审过程自身的副作用）

评审过程中，为验证 P0-1（`@repo/database` 是否需要构建产物）曾执行过：

```powershell
Rename-Item packages\database\dist dist_hidden_tmp
```

该验证因沙箱 `spawn EPERM` 未得到有效结论，随后的恢复命令未能生效，导致 `dist_hidden_tmp/` 在工作区残留了一段时间，**并在此期间打挂了 `check:architecture` / `lint` / `format:check` 三个门禁**。最终它被清理，`packages/database/dist` 已用 `pnpm --filter @repo/database run build` 完整重建。

请注意：

1. **这是评审过程产生的人为残留，不是仓库缺陷**，也不需要任何修复。当前 `git status` 干净、`packages/database/dist/src/index.js` 存在且正确。
2. 但它**暴露了一个真实的机制缺陷**（见 P6-4）：忽略规则按目录名字面量硬编码，且 `.gitignore` 未覆盖 `dist*/`，因此这类残留既会打挂门禁、又可能被 `git add -A` 误提交。**P6-4 要修的是机制，不是这个目录。**
3. 若你在其他分支或备份中看到 `dist_hidden_tmp/`，可直接删除；它只是被重命名的旧 `dist` 构建产物。
