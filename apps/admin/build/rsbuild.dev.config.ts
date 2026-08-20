import { defineConfig } from '@rsbuild/core';
import { mergeRsbuildConfig } from '@rsbuild/core';

import { getBaseConfig } from './rsbuild.base.config';

import type { RsbuildConfig } from '@rsbuild/core';

/**
 * 创建管理后台开发环境配置
 *
 * 默认监听 8080 端口，也允许根脚本通过 `PORT` 为并行启动分配端口。开发服务器启动后自动打开浏览器，
 * API 由浏览器直接请求 NestJS，跨域来源白名单统一在服务端维护；其余入口、插件和路径规则来自共享配置。
 */
export default defineConfig(({ envMode }) => {
  const devConf: RsbuildConfig = {
    server: {
      port: Number(process.env.PORT ?? 8080),
      compress: false,
      open: true,
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
