/**
 * 验证 pnpm setup 是否完成数据库结构与初始数据初始化
 *
 * CI 优先读取任务注入的 DATABASE_URL；本地直接执行时回退读取 pnpm setup 生成的 admin-api 开发环境文件。
 * 脚本会确认默认管理员、超级管理员角色、关联关系与菜单数据同时存在，避免 Setup 只生成环境文件却没有
 * 真正完成 migration 或 seed。
 */

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import pg from 'pg';

const { Client } = pg;
const localEnvPath = new URL('../apps/admin-api/.env.development', import.meta.url);

if (!process.env.DATABASE_URL && existsSync(localEnvPath)) {
  loadEnvFile(localEnvPath);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('verify:setup 需要注入 DATABASE_URL，或先执行 pnpm setup 生成本地服务端配置。');
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();

  const adminRoleResult = await client.query(`
    SELECT users.username, roles.code
    FROM users
    INNER JOIN user_roles ON user_roles.user_id = users.id
    INNER JOIN roles ON roles.id = user_roles.role_id
    WHERE users.username = 'admin' AND roles.code = 'super_admin'
  `);
  if (adminRoleResult.rowCount !== 1) {
    throw new Error('未找到 admin 与 super_admin 的唯一关联记录。');
  }

  const menuResult = await client.query('SELECT COUNT(*)::int AS count FROM menus');
  if (!menuResult.rows[0] || menuResult.rows[0].count < 1) {
    throw new Error('菜单种子数据为空。');
  }

  const featureTableResult = await client.query(`
    SELECT to_regclass('public.dictionaries') AS dictionaries,
           to_regclass('public.dictionary_items') AS dictionary_items,
           to_regclass('public.public_configs') AS public_configs
  `);
  const featureTables = featureTableResult.rows[0];
  if (!featureTables?.dictionaries || !featureTables.dictionary_items || !featureTables.public_configs) {
    throw new Error('字典与公共配置表结构未完整创建。');
  }

  process.stdout.write('Setup CI 验证通过：migration、默认管理员、RBAC、字典与公共配置表均已就绪。\n');
} finally {
  await client.end().catch(() => undefined);
}
