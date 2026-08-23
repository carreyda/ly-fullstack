import { defineConfig } from '@rsbuild/core';
import { mergeRsbuildConfig } from '@rsbuild/core';

import { getBaseConfig } from './rsbuild.base.config';

import type { RsbuildConfig } from '@rsbuild/core';

/**
 * 创建管理后台开发环境配置
 *
 * 本地端口由根 `workspace.config.json` 定义，再由开发启动器通过 `PORT` 注入。开发服务器启动后自动打开
 * 浏览器，API 由浏览器直接请求 NestJS，跨域来源白名单统一在服务端维护；其余配置来自共享基线。
 */
export default defineConfig(({ envMode }) => {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('Admin dev server requires a valid PORT injected by scripts/dev.mjs');
  }

  const devConf: RsbuildConfig = {
    server: {
      port,
      compress: false,
      open: process.env.PLAYWRIGHT_TEST !== '1',
    },
    dev: {
      hmr: true,
      progressBar: true,
      lazyCompilation: false,
    },
  };

  const baseConf: RsbuildConfig = getBaseConfig(envMode);
  const config: RsbuildConfig = mergeRsbuildConfig(baseConf, devConf);

  return config;
});
