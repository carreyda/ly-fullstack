/**
 * 扩展 LY Fullstack 管理 API 可读取的 Node.js 环境变量
 *
 * NestJS 通过 `@nestjs/config` 读取当前运行环境对应的 `.env.<环境>` 文件，
 * 本声明只提供类型约束，不会在构建或运行阶段写入实际配置值。
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * 当前服务运行环境，用于选择对应的环境变量文件
     */
    readonly APP_ENV?: 'development' | 'test' | 'production';

    /**
     * PostgreSQL 连接串，由 Prisma Client 读取
     */
    readonly DATABASE_URL?: string;

    /**
     * 允许跨域访问 API 的前端来源列表，多个地址使用英文逗号分隔
     */
    readonly CORS_ORIGINS?: string;

    /**
     * 管理端 Access Token 签名密钥
     */
    readonly JWT_SECRET?: string;

    /**
     * 管理端 Access Token 有效期，例如 7d
     */
    readonly JWT_EXPIRES_IN?: string;

    /**
     * 本地启动器或部署平台注入的服务监听端口
     */
    readonly PORT?: string;
  }
}
