/**
 * LY Fullstack 本地开发环境初始化脚本
 *
 * 负责收集 PostgreSQL 本地凭据、启动 Compose 数据库、幂等创建目标数据库，并生成不会提交到 Git 的
 * API development 环境文件。脚本不会把数据库密码写入命令行参数或终端输出。
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cancel, confirm, intro, isCancel, log, outro, password, text } from '@clack/prompts';
import pg from 'pg';

import { getWorkspaceApplications, readWorkspaceConfig } from './workspace-config.mjs';

const { Client } = pg;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, '..');
const workspaceApplications = getWorkspaceApplications(readWorkspaceConfig(repoRoot));
const adminApplication = workspaceApplications.find((app) => app.kind === 'web' && app.name === 'admin');
const adminApiApplication = workspaceApplications.find((app) => app.kind === 'server' && app.name === 'admin-api');

if (!adminApplication || !adminApiApplication) {
  throw new Error('workspace.config.json 必须注册 admin 与 admin-api，才能初始化管理系统本地环境。');
}

const composeEnvPath = resolve(repoRoot, '.env');
const adminApiDevelopmentPath = resolve(repoRoot, adminApiApplication.path, '.env.development');

const POSTGRES_HOST = '127.0.0.1';
const POSTGRES_PORT = 5432;
const POSTGRES_USER = 'postgres';
const DEFAULT_DATABASE_NAME = 'ly_fullstack';
const DATABASE_READY_TIMEOUT_MS = 30_000;

/**
 * 输出初始化命令帮助。
 */
const printHelp = () => {
  process.stdout.write(`LY Fullstack 本地环境初始化\n\n`);
  process.stdout.write(`  pnpm setup    创建本地环境文件并初始化 PostgreSQL 数据库\n`);
};

/**
 * 检查本机是否可以使用 Docker Compose。
 */
const isDockerComposeAvailable = () => {
  const result = spawnSync('docker', ['compose', 'version'], {
    cwd: repoRoot,
    stdio: 'ignore',
    windowsHide: true,
  });

  return result.status === 0;
};

/**
 * 检查本机 PostgreSQL 默认端口是否已有服务监听。
 *
 * 已运行本机 PostgreSQL 或现有容器时直接复用，避免再次启动 Compose 导致端口冲突。
 */
const isPostgresPortOpen = () => {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ host: POSTGRES_HOST, port: POSTGRES_PORT });
    let settled = false;

    const settle = (isOpen) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolvePromise(isOpen);
    };

    socket.setTimeout(500);
    socket.once('connect', () => settle(true));
    socket.once('timeout', () => settle(false));
    socket.once('error', () => settle(false));
  });
};

/**
 * 执行需要继承当前终端输出的外部命令。
 *
 * @param command 可执行程序名称
 * @param args 命令参数，不得包含数据库密码等敏感信息
 * @param env 本次进程需要注入的环境变量
 */
const runCommand = (command, args, env) => {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      shell: false,
      stdio: 'inherit',
      windowsHide: true,
    });

    child.once('error', rejectPromise);
    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} 执行失败，退出码 ${code ?? 1}。`));
    });
  });
};

/**
 * 将值转换为可安全写入 dotenv 双引号字符串的内容。
 *
 * @param value 原始环境变量值
 */
const escapeDotenvValue = (value) => value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

/**
 * 生成管理 API 的 development 环境文件。
 *
 * @param databaseUrl 已对用户名和密码进行 URL 编码的 PostgreSQL 连接串
 */
const writeApplicationEnvFiles = (databaseUrl) => {
  const adminLocalPort = adminApplication.localPort;
  const adminApiEnv = [
    '# 管理 API 本地开发环境配置。',
    `DATABASE_URL="${databaseUrl}"`,
    `CORS_ORIGINS="http://localhost:${adminLocalPort},http://127.0.0.1:${adminLocalPort}"`,
    '',
  ].join('\n');

  writeFileSync(adminApiDevelopmentPath, adminApiEnv, { encoding: 'utf-8', mode: 0o600 });
};

/**
 * 写入 Compose 使用的本地 PostgreSQL 配置。
 *
 * 根 `.env` 与管理 API 的 development 配置均被 Git 忽略，避免数据库密码进入仓库。
 */
const writeComposeEnv = (databaseName, databasePassword) => {
  const content = [
    `POSTGRES_DB="${escapeDotenvValue(databaseName)}"`,
    `POSTGRES_USER="${POSTGRES_USER}"`,
    `POSTGRES_PASSWORD="${escapeDotenvValue(databasePassword)}"`,
    `POSTGRES_PORT=${POSTGRES_PORT}`,
    '',
  ].join('\n');

  writeFileSync(composeEnvPath, content, { encoding: 'utf-8', mode: 0o600 });
};

const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

/**
 * 等待 PostgreSQL 可以接受连接。
 *
 * @param databasePassword 本地 postgres 用户密码
 * @returns 已连接到系统数据库的客户端，调用方负责关闭连接
 */
const connectToPostgres = async (databasePassword) => {
  const deadline = Date.now() + DATABASE_READY_TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    const client = new Client({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: databasePassword,
      database: 'postgres',
      connectionTimeoutMillis: 2_000,
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '28P01') {
        throw new Error('PostgreSQL 密码验证失败；已有数据卷需要输入创建该数据卷时使用的原密码。', {
          cause: error,
        });
      }

      lastError = error;
      await client.end().catch(() => undefined);
      await delay(500);
    }
  }

  const detail = lastError instanceof Error ? `：${lastError.message}` : '';
  throw new Error(`PostgreSQL 在 ${DATABASE_READY_TIMEOUT_MS / 1_000} 秒内未就绪${detail}`);
};

/**
 * 在 PostgreSQL 中幂等创建目标数据库。
 *
 * @param client 已连接到 postgres 系统数据库的客户端
 * @param databaseName 经过标识符规则校验的目标数据库名
 * @returns 本次是否实际创建了数据库
 */
const ensureDatabaseExists = async (client, databaseName) => {
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  if (result.rowCount > 0) {
    return false;
  }

  await client.query(`CREATE DATABASE "${databaseName}"`);
  return true;
};

/**
 * 收集初始化所需的本地数据库配置。
 */
const promptForDatabaseConfig = async () => {
  const databasePassword = await password({
    message: '输入本地 PostgreSQL 的 postgres 用户密码',
    clearOnError: true,
    validate: (value) => {
      if (!value) {
        return '数据库密码不能为空';
      }

      if (value.includes('\n') || value.includes('\r')) {
        return '数据库密码不能包含换行符';
      }

      return undefined;
    },
  });

  if (isCancel(databasePassword)) {
    return null;
  }

  const databaseName = await text({
    message: '输入本地数据库名称',
    initialValue: DEFAULT_DATABASE_NAME,
    defaultValue: DEFAULT_DATABASE_NAME,
    validate: (value) => {
      const normalizedValue = value?.trim() || DEFAULT_DATABASE_NAME;
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(normalizedValue)) {
        return '数据库名只能包含字母、数字和下划线，且不能以数字开头';
      }

      return undefined;
    },
  });

  if (isCancel(databaseName)) {
    return null;
  }

  return {
    databaseName: databaseName.trim() || DEFAULT_DATABASE_NAME,
    databasePassword,
  };
};

/**
 * 确认是否允许覆盖已有的本地环境文件。
 */
const confirmLocalEnvOverwrite = async () => {
  const existingPaths = [composeEnvPath, adminApiDevelopmentPath].filter(existsSync);
  if (existingPaths.length === 0) {
    return true;
  }

  log.warn('检测到已有本地环境配置，继续执行会覆盖根 .env 和 admin-api/.env.development。');
  const shouldOverwrite = await confirm({
    message: '确认使用本次输入重新生成本地配置？',
    initialValue: false,
  });

  return isCancel(shouldOverwrite) ? null : shouldOverwrite;
};

/**
 * 执行完整本地环境初始化流程。
 */
const main = async () => {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  intro('LY Fullstack 本地环境初始化');

  const shouldWriteEnv = await confirmLocalEnvOverwrite();
  if (!shouldWriteEnv) {
    cancel('未覆盖已有本地配置。');
    return;
  }

  const databaseConfig = await promptForDatabaseConfig();
  if (!databaseConfig) {
    cancel('已取消初始化。');
    return;
  }

  const { databaseName, databasePassword } = databaseConfig;
  writeComposeEnv(databaseName, databasePassword);

  if (await isPostgresPortOpen()) {
    log.info('检测到本机 127.0.0.1:5432 已有 PostgreSQL 服务，将直接复用。');
  } else if (isDockerComposeAvailable()) {
    log.info('正在启动 Compose 中的 PostgreSQL...');
    await runCommand('docker', ['compose', 'up', '-d', 'postgres'], {
      ...process.env,
      POSTGRES_DB: databaseName,
      POSTGRES_USER,
      POSTGRES_PASSWORD: databasePassword,
      POSTGRES_PORT: String(POSTGRES_PORT),
    });
  } else {
    log.warn('未检测到本机 PostgreSQL 或 Docker Compose，将等待 127.0.0.1:5432 上的 PostgreSQL 启动。');
  }

  const client = await connectToPostgres(databasePassword);
  let databaseCreated;

  try {
    databaseCreated = await ensureDatabaseExists(client, databaseName);
  } finally {
    await client.end();
  }

  const encodedPassword = encodeURIComponent(databasePassword);
  const encodedDatabaseName = encodeURIComponent(databaseName);
  const databaseUrl = `postgresql://${POSTGRES_USER}:${encodedPassword}@localhost:${POSTGRES_PORT}/${encodedDatabaseName}?schema=public`;
  writeApplicationEnvFiles(databaseUrl);

  log.success(databaseCreated ? `数据库 ${databaseName} 已创建。` : `数据库 ${databaseName} 已存在。`);
  outro('本地环境初始化完成，现在可以运行 pnpm dev。');
};

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log.error(message);
  process.exitCode = 1;
});
