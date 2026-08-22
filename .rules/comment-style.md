# 注释风格规范

本文档约束当前项目所有 TypeScript、JavaScript、SCSS、Vue 单文件组件中的注释写法。Vue 组件的结构顺序仍以 `.rules/vue3.md` 为准，但注释的详细程度、语言和维护要求以本文档为准。

---

## 核心原则

本项目的注释不是点缀，也不是为了满足格式要求。注释的目标是让刚加入项目的同事、实习生和不熟悉业务的人，在不反复追调用链的情况下，能快速理解模块职责、方法用途、参数含义、返回结果和副作用。

强制约定：

- 所有注释必须使用中文。
- 无论注释内容长短，JSDoc 一律使用多行格式：`/**`、` * 注释内容`、` */` 各自独占一行。
- 禁止使用 `/** 注释内容 */` 单行 JSDoc；统一格式的优先级高于节省行数。
- 公共导出、类型声明、服务层、状态层、核心模块、构建配置、运行时 bootstrap、兼容逻辑必须写注释。
- 注释要说明“这段代码负责什么、为什么这样做、调用方需要注意什么”，不能只重复代码表面动作。
- 禁止使用空泛注释，例如 `导入模块`、`定义数据`、`执行方法`、`返回结果`、`处理逻辑`。
- 禁止把临时想法、个人备注、未确认方案写成注释。确实有后续任务时，优先写进 `README.md` 的当前状态或专题文档。
- 允许在代码影响点写 `TODO(迁移):` 注释，但必须满足三个条件：已经从原项目确认过、会影响当前代码行为、还没到实现时机；同一事项也必须同步记录到 `README.md` 或对应专题文档。
- 复制旧项目代码时，必须同步重写注释，不能保留旧项目中不准确、乱码、过短或只描述语法动作的注释。
- 修改代码时必须同步维护注释；代码含义改变但注释不变，视为不合规。

---

## JSDoc 格式一致性

函数、变量、类型、字段和类的 JSDoc 都使用同一种多行结构，不因注释只有一句话而缩写为单行。

统一写法：

```ts
/**
 * 获取 OSS STS 临时上传凭证。
 */
export const API_GET_OSS_STS_TOKEN = '/admin/oss/sts';
```

禁止将 JSDoc 起始符、注释内容和结束符写在同一行。

该规则同样适用于 `interface` 字段、类属性和函数内部变量上方的 JSDoc，确保全仓库阅读节奏一致。

---

## 详细程度

本项目不追求少注释。尤其是基础设施和迁移期间的核心模块，注释要“满”和“详细”，让新人读中文就能知道文件怎么用。

必须详细注释的模块：

- `src/services/**`：HTTP 服务实例、拦截器、请求工厂、认证失败处理、不同后端服务的响应结构。
- `src/api/**`：接口地址、请求函数对应的后端能力、入参和返回值。
- `src/stores/**`：Store 管理的业务状态、每个 action 的触发时机和副作用。
- `src/core/**`：SDK 单例、IndexedDB、消息发送、消息解析、草稿等底层能力。
- `src/bridge/**`：客户端原生能力、新旧 Bridge 兼容关系、非客户端降级策略。
- `src/types/**`：类型用途、字段含义、字段来自后端还是 SDK。
- `build/**`：构建插件、环境变量校验、版本检测、静态资源路径处理。
- `src/bootstrap/**`：应用启动注册、全局事件监听、缓存清理、页面刷新等启动期副作用。
- `env.d.ts`：环境变量、构建期注入变量、全局事件、第三方模块补充声明。

可以少写注释的场景：

- 组件内部非常简单的局部变量，例如 `const isVisible = ref(false)`。
- 明确的模板事件处理函数，例如只做 `isVisible.value = false` 的 `handleClose`。
- 一眼能看懂且没有业务语义的纯样式声明。

---

## 禁止的注释

下面这类注释不能出现：

```ts
/**
 * 导入模块
 */
import { serviceCms } from '@/services/service-cms';

/**
 * get请求
 */
public get(url: string) {}

/**
 * 定义数据
 */
const list = ref([]);
```

原因：

- `导入模块` 没有告诉读者导入的模块承担什么职责。
- `get请求` 没有说明请求会拼接哪个服务域名、参数如何传递、返回什么响应结构。
- `定义数据` 只重复语法动作，没有解释状态语义。

---

## 推荐的注释

服务层必须把职责、参数、返回值和副作用写清楚。

```ts
/**
 * CMS 后端服务请求实例
 *
 * 负责把业务接口路径拼接到 CMS 服务域名上，并统一接入 CMS 请求拦截器。
 * 调用方只需要传入接口路径和业务参数，不需要关心 token 注入、业务状态码处理和错误提示。
 */
class Service {
  /**
   * 发起 CMS GET 请求
   *
   * @param url CMS 接口路径，例如 `/api/im/getImUserSig`
   * @param params 查询参数，会被放入 URL query
   * @param config 额外请求配置，例如是否隐藏错误提示
   * @returns CMS 统一响应结构，业务数据位于 `data`
   */
  public get<T = unknown, P = unknown>(url: string, params: P, config?: ExpandAxiosRequestConfig) {
    // ...
  }
}
```

状态层必须说明 Store 的边界和 action 的触发时机。

```ts
/**
 * IM 会话 Store
 *
 * 只管理腾讯云 IM 登录状态、SDK ready 状态、当前登录用户 ID 和网络状态。
 * 不在这里保存消息列表，也不在这里处理消息发送；消息相关状态后续由 message store 承接。
 */
export const useImSessionStore = defineStore('imSession', () => {
  /**
   * 初始化 IM 登录链路
   *
   * 触发时机：应用布局挂载后。
   * 执行步骤：获取业务侧 userSig -> 调用腾讯云 IM login -> 等待 SDK_READY 事件。
   * 副作用：会更新登录状态，并在失败时写入错误信息。
   */
  const initSession = async (): Promise<void> => {
    // ...
  };
});
```

类型字段必须逐项解释，不能只给接口整体写一行注释。

```ts
/**
 * IM 用户签名接口返回数据
 */
export interface ImUserSignResult {
  /**
   * 腾讯云 IM 用户 ID，用于调用 `chat.login`
   */
  userId: string;

  /**
   * 腾讯云 IM 登录签名，用于调用 `chat.login`
   */
  userSig: string;
}
```

兼容逻辑必须说明兼容对象和降级策略。

```ts
/**
 * 获取当前可用的客户端 Bridge 宿主
 *
 * 新客户端优先使用标准宿主对象，旧客户端兼容历史 Bridge 对象。
 * 非客户端环境返回 null，调用方需要自行决定是否降级。
 */
export const getClientBridgeHost = (): ClientBridgeHost | null => {
  // ...
};
```

---

## 类型声明注释

类型文件是多人协作的契约区域，要求最严格。

- 每个导出的 `type` / `interface` / `Record` 常量上方必须写用途注释。
- 每个字段必须独立使用 JSDoc 注释。
- 字面量联合类型必须说明每个值的业务语义，必要时用 `Record` 补充标签。
- 字段注释不能使用行尾注释。
- 后端返回字段如果命名不直观，必须说明字段来源和真实含义。

---

## 全局声明注释

`env.d.ts` 是应用运行环境和全局类型的入口，必须让读者一眼看出声明为什么存在。

必须写清楚：

- 环境变量由哪个构建工具注入，例如 Rsbuild、Vite 或 Node 进程。
- 全局事件由哪个模块派发、由哪个模块监听。
- 第三方模块声明是因为官方类型缺失、路径导入缺失，还是项目主动补充。
- `Window`、`ImportMetaEnv`、`NodeJS.ProcessEnv` 这类全局扩展的影响范围。

推荐写法：

```ts
/**
 * 管理后台应用版本清单
 *
 * 由 `apps/admin/build/runtime/version.ts` 在生产构建阶段写入 `version.json`，
 * 浏览器运行时会通过该清单判断当前页面是否已经落后于最新发布版本。
 */
interface AppVersionManifest {
  /**
   * 当前构建所属的应用名称，用于区分不同子应用的版本文件
   */
  appName: string;

  /**
   * 当前子包 `package.json` 中声明的版本号
   */
  packageVersion: string;

  /**
   * 本次构建的唯一标识，用于和页面中的 meta 信息做版本差异判断
   */
  buildId: string;
}

interface WindowEventMap {
  /**
   * 管理后台检测到新版本后派发的全局事件
   *
   * 派发方：`apps/admin/build/runtime/check.ts`。
   * 监听方：`apps/admin/src/bootstrap/index.ts`。
   */
  'app-update-ready': CustomEvent<AppUpdateReadyDetail>;
}
```

禁止写法：

```ts
/**
 * 全局类型
 */
interface WindowEventMap {
  'app-update-ready': CustomEvent<AppUpdateReadyDetail>;
}
```

原因：它没有说明事件来源、监听方和业务后果，后续维护者无法判断能不能改名或删除。

---

## 构建运行时注释

`build/runtime/**` 同时影响构建产物和浏览器运行行为，注释必须比普通业务文件更明确。

必须写清楚：

- 构建期文件生成了什么产物，例如 `version.json`、meta 标签、静态资源清单。
- 运行时文件监听了什么事件、发起了什么请求、是否会刷新页面。
- 失败时是否静默处理，以及为什么不能影响主应用渲染。
- 路径、资源前缀、缓存策略这类部署相关逻辑的假设。

推荐写法：

```ts
/**
 * 注入管理后台版本信息
 *
 * 构建阶段会根据最终静态资源计算 buildId，并同时写入：
 * 1. `version.json`，供浏览器运行时轮询检测新版本。
 * 2. HTML meta 标签，供当前页面记录自身构建号。
 *
 * 该插件只在 build 阶段执行，不参与本地 dev server。
 */
export const createVersionPlugin = (env: AppEnv): RsbuildPlugin => {
  // ...
};
```

```ts
/**
 * 检测管理后台是否存在新版本
 *
 * 浏览器会定时读取 `version.json`，当最新 buildId 与当前页面 meta 中的 buildId 不一致时，
 * 派发 `app-update-ready` 事件。检测失败必须静默处理，不能阻塞应用启动和用户操作。
 */
const checkAppVersion = async (): Promise<void> => {
  // ...
};
```

---

## Bootstrap 注释

`src/bootstrap/**` 承担应用启动期的全局副作用，必须说明注册内容和清理边界。

必须写清楚：

- 注册了哪些全局事件或浏览器能力。
- 用户确认后会清理哪些客户端状态，例如 `localStorage`、`sessionStorage`、`CacheStorage`、Service Worker。
- 是否会刷新页面、跳转路由或重新发起登录。
- 为什么需要防重复弹窗、防重复提交或防竞态。

推荐写法：

```ts
/**
 * 启动管理后台运行时监听
 *
 * 当前只注册应用版本更新监听。收到 `app-update-ready` 后会提示用户确认刷新，
 * 用户确认后清理浏览器缓存、本地存储和历史 Service Worker，再刷新页面加载最新资源。
 *
 * @returns 取消监听函数，便于后续测试或微前端卸载场景复用
 */
export const bootstrapAdminApp = (): (() => void) => {
  // ...
};
```

```ts
/**
 * 清理浏览器侧持久化状态
 *
 * 发版刷新前清理本地存储和缓存，避免旧静态资源、旧接口状态或历史 Service Worker
 * 影响新版本页面加载。清理缓存失败时不阻断页面刷新。
 */
const clearClientState = async (): Promise<void> => {
  // ...
};
```

---

## 公共导出注释

公共导出会被跨文件调用，必须写清楚调用边界。

必须说明：

- 函数负责的业务能力。
- 关键入参的含义。
- 返回值结构或状态变化。
- 是否有副作用，例如写入 localStorage、跳转页面、注册事件、发起网络请求、修改 SDK 状态。
- 失败时的行为，例如抛错、返回空值、触发登录失效、静默降级。

---

## Vue 组件注释

Vue 组件中的注释也必须遵守中文和准确原则。

- 可以保留 `.rules/vue3.md` 中定义的结构顺序。
- 不强制给每个局部变量写注释。
- 复杂组件的 props、emits、业务方法、跨模块副作用必须写注释。
- 组件私有方法如果超过简单 UI 状态切换，需要说明它服务的交互场景。
- 不允许出现 `导入组件`、`导入 composables` 这类无信息量注释。

---

## SCSS 注释

SCSS 中也使用中文注释。

- 复杂 mixin、主题 token、语义变量必须写注释。
- 组件样式中只在分区复杂或有兼容原因时写注释。
- 不使用长横线装饰性注释。
- 不在行尾写解释性注释；需要解释时使用块注释。

---

## 维护要求

- 删除代码时同步删除相关注释。
- 修改字段含义时同步修改字段注释。
- 移动模块时同步调整注释中的路径和职责描述。
- 迁移旧项目模块时先重写注释，再迁移实现。
- 评审时如果发现注释无法帮助新人理解代码，必须退回修改。

---

## 合规声明（强制）

本次改动若确实严格遵循了本规则文件的全部约定，必须在回复的结尾追加一行：

> LY Fullstack 项目组

用于自检与确认规则已被实际执行。若有任何一条未遵守，则不得追加该声明。
