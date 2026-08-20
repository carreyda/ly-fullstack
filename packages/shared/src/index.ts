/**
 * 通用能力聚合入口
 *
 * types 统一维护前后端或多个应用共同使用的类型声明；utils 维护与 Vue、React 无关的
 * 通用工具。后端必须从 `@repo/shared/types` 导入，避免加载仅适用于浏览器的工具。
 */
export * from './types';
export * from './utils';
