import { defineConfig } from '@rsbuild/core';
import { mergeRsbuildConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import CompressionPlugin from 'compression-webpack-plugin';

import { getBaseConfig } from './rsbuild.base.config';

import type { RsbuildConfig } from '@rsbuild/core';

/**
 * 创建管理后台生产构建配置
 *
 * 在共享配置之上增加稳定依赖拆包、CSS 路径修正、图片压缩和 gzip 预压缩。
 * 生产环境关闭自动 polyfill，浏览器兼容范围由项目运行要求统一控制。
 */
export default defineConfig(({ envMode }) => {
  const prodConf: RsbuildConfig = {
    /**
     * 生产环境精细拆包策略：
     * 1. 框架基础包（vue 生态）：长期缓存，变更频率极低
     * 2. UI 组件库（element-plus）：单独拆包缓存，首屏依赖
     * 3. 其余第三方依赖：按规则自动拆分，不强制固定包名
     * 4. 公共业务代码：多路由共享的业务逻辑自动抽取
     *
     * 拆包原则：
     * - 单包 gzip 前控制在 250KB 以内，避免单个包过大
     * - 小于 20KB 的模块不单独拆包，避免请求碎片
     * - 被 2 个及以上 chunk 引用的模块抽取为公共包
     * - 第三方依赖（node_modules）与业务代码完全分离
     * - 仅对边界稳定、首屏必需的依赖使用固定 name + enforce: true，其余分组让 Rspack 自动优化
     */
    performance: {
      chunkSplit: {
        strategy: 'custom',
        splitChunks: {
          chunks: 'all',
          /**
           * 最小 chunk 大小（gzip 前），小于 20KB 不拆分。
           */
          minSize: 20000,
          /**
           * 单包最大体积（gzip 前），超过 250KB 尝试二次拆分。
           */
          maxSize: 250000,
          /**
           * 被两个及以上 chunk 引用的模块才抽取为公共包。
           */
          minChunks: 2,
          /**
           * 异步 chunk 的并发请求数上限。
           */
          maxAsyncRequests: 30,
          /**
           * 初始加载的并发请求数上限。
           */
          maxInitialRequests: 20,
          cacheGroups: {
            /**
             * Vue 生态基础框架
             * 包含 vue 与 @vue 生态基础包，边界稳定、变更频率极低，长期缓存
             */
            framework: {
              name: 'lib/framework',
              test: /[\\/]node_modules[\\/](vue|@vue)[\\/]/,
              priority: 40,
              enforce: true,
            },

            /**
             * Element Plus UI 组件库
             * 包含 element-plus 核心和图标库，单独拆包缓存（首屏依赖，非懒加载）
             */
            elementPlus: {
              name: 'lib/element-plus',
              test: /[\\/]node_modules[\\/](element-plus|@element-plus)[\\/]/,
              priority: 30,
              enforce: true,
            },

            /**
             * 其余第三方依赖兜底
             * 未匹配到上述分组的 node_modules 依赖，不固定 name，让 Rspack 自动按规则拆分
             */
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },

            /**
             * 公共业务代码
             * src 目录下被多个 chunk 引用的业务模块，不固定 name，让 Rspack 自动抽取
             */
            commons: {
              test: /[\\/]src[\\/]/,
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      },
    },

    /**
     * CSS 抽取和静态资源预压缩
     *
     * 服务器可直接返回同路径的 `.gz` 文件，避免运行时重复压缩；小于 10KB 或压缩收益不足的资源不会生成副本。
     */
    tools: {
      cssExtract: {
        loaderOptions: {
          /**
           * CSS 独立输出到 css/ 目录，需要回退一级才能正确引用图片和字体
           */
          publicPath: '../',
        },
        pluginOptions: {
          ignoreOrder: true,
        },
      },
      rspack: {
        plugins: [
          new CompressionPlugin({
            test: /\.(js|css)$/,
            filename: '[path][base].gz',
            algorithm: 'gzip',
            threshold: 10240,
            minRatio: 0.8,
          }),
        ],
      },
    },

    plugins: [pluginImageCompress()],

    /**
     * 关闭构建工具自动 polyfill，避免向现代浏览器产物注入未评估的兼容代码。
     */
    output: {
      polyfill: 'off',
    },
  };

  const baseConf: RsbuildConfig = getBaseConfig(envMode);
  const config: RsbuildConfig = mergeRsbuildConfig(baseConf, prodConf);

  return config;
});
