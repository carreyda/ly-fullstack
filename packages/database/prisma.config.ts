import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

/**
 * 共享数据库 CLI 配置
 *
 * Schema、migration、seed 与生成 Client 由 database 包统一维护。迁移和 seed 的目标连接串由调用环境
 * 显式提供，database 包不保存任何应用密钥；应用运行时连接串仍由各 API 服务自己的环境变量管理。
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
