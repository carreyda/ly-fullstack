import { defineConfig } from '@rstest/core';

/**
 * shared 包测试配置
 *
 * storage 与 URL 查询工具依赖 `window`/`localStorage`，使用 happy-dom 提供模拟 DOM；
 * 纯函数工具在同一环境下不受影响。
 */
export default defineConfig({
  include: ['src/**/*.test.ts'],
  testEnvironment: 'happy-dom',
});
