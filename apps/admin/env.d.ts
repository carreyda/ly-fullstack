/// <reference types="@rsbuild/core/types" />

/**
 * element-plus语言包
 */
declare module 'element-plus/dist/locale/zh-cn.mjs';

/**
 * 管理后台运行环境。
 */
declare type AppEnv = 'development' | 'test' | 'production';

/**
 * Rsbuild 注入到浏览器源码的环境变量。
 */
declare interface ImportMetaEnv {
  readonly APP_ENV: AppEnv;
  readonly API_BASE_URL: string;
}

/**
 * 构建脚本可读取的 Node.js 进程变量。
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly APP_ENV?: AppEnv;
    readonly API_BASE_URL?: string;
    readonly PORT?: string;
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}
