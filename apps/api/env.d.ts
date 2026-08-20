/**
 * 扩展 LY Fullstack C 端 API 可读取的 Node.js 环境变量
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * 当前服务运行环境，用于选择对应的环境变量文件
     */
    readonly APP_ENV?: 'development' | 'test' | 'production';

    /**
     * 允许跨域访问 API 的前端来源列表，多个地址使用英文逗号分隔
     */
    readonly CORS_ORIGINS?: string;

    /**
     * 部署环境注入的服务端口，未提供时使用代码内默认端口
     */
    readonly PORT?: string;
  }
}
