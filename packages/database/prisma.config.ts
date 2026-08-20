import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

/**
 * 共享数据库 CLI 配置
 *
 * Schema、migration 与生成 Client 由 database 包统一维护；执行迁移时由调用环境显式提供
 * DATABASE_URL，应用运行时的连接串仍由各 API 服务自己的环境变量管理。
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
