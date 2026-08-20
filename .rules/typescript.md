# TypeScript 编码规范

## 类型标注原则

**能推断的不标注，不能推断的必须标注。**

```ts
// ✅ 需要标注：空数组、null 初始值、复杂泛型
const list = ref<ChatMessage[]>([]);
const user = ref<UserInfo | null>(null);

// ✅ 需要标注：函数返回类型（公共 API 和复杂函数）
const fetchData = async (): Promise<void> => { ... };

// ❌ 不需要标注：TS 能自动推断
const loading = ref(false);          // Ref<boolean>
const message = '';                  // string
const API_LOGIN = '/api/auth/login'; // string
const count = ref(0);               // Ref<number>
```

---

## 类型导入

使用 `import type` 分离类型导入（`verbatimModuleSyntax: true`）：

```ts
/**
 * 导入类型声明
 */
import type { ChatMessage, UserInfo } from '@/types';
```

---

## 函数风格

统一箭头函数：

```ts
const handleSend = (msg: string): void => { ... };
const fetchData = async (): Promise<ChatMessage[]> => { ... };
```

---

## 导出规范

- 命名导出为主
- default export 仅限：Vue 组件、Router 实例、Pinia 实例
- barrel `index.ts` 聚合导出：`export * from './modules/xxx'`

---

## 不使用 enum

**一律使用字面量联合类型代替 `enum`：**

```ts
// ✅ 字面量联合类型：零运行时、推断更好、JSON 天然兼容
type ChatType = 'llm' | 'knowledge';
type MessageRole = 'user' | 'assistant' | 'system';
type Status = 'active' | 'inactive' | 'pending';

// ❌ 不用 enum：编译产生运行时 IIFE，isolatedModules 下 const enum 有问题
enum ChatType {
  LLM = 'llm',
  Knowledge = 'knowledge',
}
```

如果需要枚举值和显示文本的映射，用 `Record` 常量：

```ts
type Status = 'active' | 'inactive';

const STATUS_LABEL: Record<Status, string> = {
  active: '启用',
  inactive: '停用',
};
```

---

## type vs interface

- `type` 用于联合类型、字面量类型、工具类型
- `interface` 用于对象形状（Props、Emits、API 响应等）

```ts
// type：联合/字面量/工具
type ChatType = 'llm' | 'knowledge';
type Nullable<T> = T | null;

// interface：对象形状
interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
}
```

---

## 类型集中管理

**所有类型声明按业务模块集中到 `types/` 目录，不在业务代码文件中就地定义。**

```ts
// ❌ 错误：类型散在业务文件中
// api/modules/user/interface.ts
interface UserInfo {
  name: string;
  avatar: string;
}
export const getUserInfo = async (): Promise<UserInfo> => { ... };

// ✅ 正确：类型集中在 types/，业务文件只导入
// types/modules/user.ts
export interface UserInfo {
  name: string;
  avatar: string;
}

// api/modules/user/interface.ts
import type { UserInfo } from '@/types';
export const getUserInfo = async (): Promise<UserInfo> => { ... };
```

**唯一例外**：组件私有的 `Props` / `Emits` interface 留在组件内部，不抽到 types/。

---

## 类型分层（SPA）

| 位置                 | 存放内容                                  |
| -------------------- | ----------------------------------------- |
| `src/types/`         | 前端业务实体、API 请求/响应、SDK 适配类型 |
| `src/types/modules/` | 按业务域拆分的类型模块                    |
| `env.d.ts`           | 环境变量扩展、Window 扩展、构建期全局类型 |
| 组件内部             | 仅保留组件私有 `Props` / `Emits`          |

---

## 环境变量类型

- `AppEnv` 不放在 `packages/shared`，由每个应用按自身工具链在本包内维护。
- Rsbuild 管理后台在 `apps/admin/env.d.ts` 中声明 `import.meta.env.APP_ENV`、`API_BASE_URL`。
- 未来主站的环境变量读取方式跟随最终技术栈确定，不提前写入统一的 Nuxt、Next.js 或其他框架约束。
- NestJS 服务端只使用 `process.env`，类型写在各服务根目录的 `env.d.ts`。
- 本地开发由 `scripts/dev.mjs` 统一选择应用、预检端口并管理进程；本地端口来自 `workspace.config.json` 并通过 `PORT` 注入，部署环境也必须显式提供 `PORT`。
