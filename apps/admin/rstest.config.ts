import { defineConfig } from '@rstest/core';

/**
 * 管理后台单元测试配置
 *
 * happy-dom 为后续 Vue 组件、Composable 和浏览器存储测试提供 DOM 环境；当前纯逻辑测试也统一在同一环境运行，
 * 避免不同测试环境造成浏览器 API 行为差异。
 */
export default defineConfig({
  include: ['src/**/*.test.ts'],
  testEnvironment: 'happy-dom',
});
