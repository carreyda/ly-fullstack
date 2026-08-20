import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginSass } from '@rsbuild/plugin-sass';
import { resolve } from 'path';

import Components from 'unplugin-vue-components/rspack';
import AutoImport from 'unplugin-auto-import/rspack';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

import { loadAdminEnv } from './runtime/env';

import type { RsbuildConfig } from '@rsbuild/core';

/**
 * 创建管理后台共享的 Rsbuild 配置
 *
 * 负责加载并校验环境变量、定义浏览器入口和产物路径、注入 Element Plus Sass 定制入口，
 * 同时注册 API 自动导入和基础组件自动导入能力。开发与生产配置在此基础上继续合并。
 *
 * @param envMode Rsbuild CLI 传入的环境文件模式，对应 `.env.development`、`.env.test` 或 `.env.production`
 * @returns 可与开发或生产差异配置合并的 Rsbuild 公共配置
 */
export const getBaseConfig = (envMode = 'development'): RsbuildConfig => {
  const env = loadAdminEnv(envMode);

  /**
   * 管理后台当前部署在站点根路径；调整部署子路径时必须同步影响静态资源前缀。
   */
  const assetPrefix = '/';
  const isDev: boolean = env.appEnv === 'development';

  const config: RsbuildConfig = {
    /**
     * 浏览器入口与编译期变量
     *
     * 环境值经过 `loadAdminEnv` 校验后再序列化，业务源码无需直接读取 Node.js `process.env`。
     */
    source: {
      entry: {
        index: resolve(process.cwd(), './src/main.ts'),
      },
      define: {
        'import.meta.env.APP_ENV': JSON.stringify(env.appEnv),
        'import.meta.env.API_BASE_URL': JSON.stringify(env.apiBaseUrl),
      },
    },

    /**
     * 构建产物目录与文件命名
     *
     * 开发环境使用稳定名称方便调试，部署产物使用内容 hash 支持长期缓存。
     */
    output: {
      assetPrefix,
      distPath: {
        root: resolve(process.cwd(), './dist'),
        css: 'css',
        cssAsync: 'css',
        js: 'js',
        jsAsync: 'js',
        font: 'font',
        image: 'images',
      },
      filenameHash: true,
      filename: {
        css: isDev ? '[name].css' : '[name]-[contenthash:8].css',
        js: isDev ? '[name].js' : '[name]-[contenthash:8].js',
        image: '[hash][ext][query]',
        font: '[name][ext]',
      },
    },

    /**
     * Admin 源码的模块解析规则
     */
    resolve: {
      extensions: ['.vue', '.ts', '.js', '.mjs'],
      alias: {
        '@': resolve(process.cwd(), './src'),
      },
    },

    /**
     * Vue、Sass 插件
     *
     * Sass additionalData 会把 Element Plus 变量与覆盖样式注入每个 SCSS 编译单元，
     * 业务样式不需要重复引入 `assets/element-plus/index.scss`。
     */
    plugins: [
      pluginVue(),
      pluginSass({
        sassLoaderOptions: {
          additionalData: `@use "@/assets/element-plus/index.scss" as *;`,
        },
      }),
    ],

    /**
     * Rspack 自动导入能力
     */
    tools: {
      rspack: {
        plugins: [
          /**
           * 自动导入 Vue、Vue Router、Pinia 的运行时 API，并按需解析 Element Plus API。
           * 生成的 `auto-imports.d.ts` 只由插件维护。
           */
          AutoImport({
            imports: ['vue', 'vue-router', 'pinia'],
            resolvers: [
              ElementPlusResolver({
                importStyle: 'sass',
              }),
            ],
            dts: resolve(process.cwd(), './auto-imports.d.ts'),
          }),

          /**
           * 自动扫描 `components/base` 基础组件，并按需解析 Element Plus 模板组件。
           * 其他业务组件目录不进入全局扫描，调用方必须显式导入。
           */
          Components({
            dirs: [resolve(process.cwd(), './src/components/base')],
            resolvers: [
              ElementPlusResolver({
                importStyle: 'sass',
              }),
            ],
            dts: resolve(process.cwd(), './components.d.ts'),
          }),
        ],
      },
    },

    /**
     * HTML 模板与默认标题
     */
    html: {
      template: resolve(process.cwd(), './index.html'),
      title: 'LY Fullstack Admin',
    },
  };

  return config;
};
