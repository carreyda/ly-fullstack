import { defineConfig } from '@rstest/core';
import { resolve } from 'path';

import AutoImport from 'unplugin-auto-import/rspack';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

/**
 * 管理后台单元测试配置
 *
 * happy-dom 为 Vue 组件、Composable 和浏览器存储测试提供 DOM 环境；当前纯逻辑测试也统一在同一环境运行，
 * 避免不同测试环境造成浏览器 API 行为差异。
 *
 * `@/` 别名与构建配置保持同一指向；自动导入复用 Rsbuild 相同的 unplugin-auto-import 预设，
 * 使 Composable 源码中的自动导入 API（`ref`、`ElMessage` 等）在测试中获得与浏览器构建一致的实现。
 * 测试不注入组件样式，也不重新生成 `auto-imports.d.ts` 声明文件。
 */
export default defineConfig({
  include: ['src/**/*.test.ts'],
  testEnvironment: 'happy-dom',
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src'),
    },
  },
  tools: {
    rspack: {
      plugins: [
        AutoImport({
          imports: ['vue', 'vue-router', 'pinia'],
          resolvers: [ElementPlusResolver({ importStyle: false })],
          dts: false,
        }),
      ],
    },
  },
});
