/**
 * 前后端通用工具入口
 *
 * 只收与 Vue、React 等 UI 框架无关的通用工具。浏览器专用工具可以存在于此，但不得被
 * api 与 admin-api 导入；跨运行时工具应避免依赖 DOM、localStorage、数据库与环境变量。
 */
export * from './modules/base';
export * from './modules/clone';
export * from './modules/storage';
