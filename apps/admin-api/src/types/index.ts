/**
 * 服务端内部类型统一出口
 *
 * 这里只聚合 Admin API 运行时使用、但不应该暴露给浏览器应用的内部类型。
 * 前后端共用的 HTTP 契约继续由 `@repo/shared/types` 维护。
 */
export * from './modules/admin-auth';
export * from './modules/menu';
export * from './modules/rbac';
export * from './modules/role';
export * from './modules/user';
