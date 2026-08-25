/// <reference types="@rsbuild/core/types" />

/**
 * Element Plus 中文语言包的 ESM 路径声明
 *
 * 项目按路径加载语言包，但上游包没有为该精确入口提供可被当前 TypeScript 配置识别的模块声明。
 */
declare module 'element-plus/dist/locale/zh-cn.mjs';

/**
 * BProgress 进度条样式的 CSS 子路径声明
 *
 * 上游包只为样式入口提供文件指向，没有附带可被当前 TypeScript 配置识别的类型条件。
 */
declare module '@bprogress/core/css';

/**
 * 管理后台允许使用的构建环境
 */
declare type AppEnv = 'development' | 'test' | 'production';

/**
 * Rsbuild 注入到浏览器源码的公开环境变量
 *
 * 这些值会进入客户端构建产物，只允许保存环境标识和公开 API 地址，禁止声明服务端密钥。
 */
declare interface ImportMetaEnv {
  /**
   * 当前管理后台的构建环境
   */
  readonly APP_ENV: AppEnv;

  /**
   * 管理后台 API 的公开访问地址
   */
  readonly API_BASE_URL: string;
}

/**
 * 构建脚本可读取的 Node.js 进程变量
 *
 * `apps/admin/build/runtime/env.ts` 会读取并校验这些字段，再通过 Rsbuild 注入浏览器代码。
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * 当前 Rsbuild 环境模式
     */
    readonly APP_ENV?: AppEnv;

    /**
     * 管理后台 API 的公开访问地址
     */
    readonly API_BASE_URL?: string;

    /**
     * 根开发脚本为 Rsbuild 开发服务器动态注入的端口
     */
    readonly PORT?: string;
  }
}

/**
 * 管理后台静态构建生成的版本清单
 *
 * `apps/admin/build/runtime/version.ts` 在 test 和 production 构建阶段写入 `version.json`，
 * 浏览器运行时通过该清单判断当前页面是否已经落后于最新发布版本。
 */
declare interface AppVersionManifest {
  /**
   * 当前构建所属的应用名称
   */
  appName: string;

  /**
   * 管理后台子包声明的版本号
   */
  packageVersion: string;

  /**
   * 根据最终静态资源内容生成的唯一构建标识
   */
  buildId: string;

  /**
   * 当前构建完成时的 ISO 时间
   */
  buildTime: string;

  /**
   * 当前构建使用的环境模式
   */
  env: AppEnv;
}

/**
 * 管理后台更新就绪事件的数据来源
 *
 * `version` 表示版本清单发现差异，`service-worker` 表示新 Worker 已经安装并进入等待状态。
 */
declare type AppUpdateReadySource = 'version' | 'service-worker';

/**
 * 检测到新版本后派发的全局事件数据
 */
declare interface AppUpdateReadyDetail {
  /**
   * 本次更新事件的检测来源
   */
  source: AppUpdateReadySource;

  /**
   * 当前 HTML meta 记录的构建号；Worker 单独通知时可能不存在
   */
  currentBuildId?: string;

  /**
   * 版本清单记录的最新构建号；Worker 单独通知时可能不存在
   */
  latestBuildId?: string;

  /**
   * 服务器返回的完整版本清单；Worker 单独通知时可能不存在
   */
  latest?: AppVersionManifest;
}

/**
 * 管理后台补充的浏览器全局事件映射
 */
declare interface WindowEventMap {
  /**
   * 管理后台检测到新构建后派发的更新事件
   *
   * 派发方：`apps/admin/build/runtime/check.ts` 和 `build/runtime/offline/register.ts`。
   * 监听方：`apps/admin/src/bootstrap/index.ts`。
   */
  'app-update-ready': CustomEvent<AppUpdateReadyDetail>;
}

/**
 * Vue 单文件组件模块声明
 *
 * 允许 TypeScript 在业务源码中导入 `.vue` 文件，并按 Vue 组件类型完成校验。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}
