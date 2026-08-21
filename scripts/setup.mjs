/**
 * LY Fullstack 本地开发环境初始化脚本
 *
 * 负责收集 PostgreSQL 本地凭据、启动 Compose 数据库、幂等创建目标数据库，再为 Admin 与 Admin API
 * 生成不会提交到 Git 的三套运行环境文件、执行 Prisma migration，并初始化默认管理员和 RBAC 数据。
 * 数据库密码不会写入命令行参数或终端输出，JWT 密钥由脚本随机生成，仓库只保留 `.env.example`。
 */

import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
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

const adminDirectory = resolve(repoRoot, adminApplication.path);
const adminApiDirectory = resolve(repoRoot, adminApiApplication.path);

/**
 * Setup 统一维护的运行环境名称
 *
 * Admin 与 Admin API 必须同时生成三套文件，避免某个子应用仍依赖仓库中预置的运行配置。
 */
const ENVIRONMENT_NAMES = ['development', 'test', 'production'];

/**
 * Setup 会覆盖的全部本地运行环境文件
 *
 * 该清单同时用于覆盖确认和文件生成。所有路径都受根 `.gitignore` 保护，不得提交到仓库。
 */
const localEnvPaths = ENVIRONMENT_NAMES.flatMap((environmentName) => [
  resolve(adminDirectory, `.env.${environmentName}`),
  resolve(adminApiDirectory, `.env.${environmentName}`),
]);

const POSTGRES_HOST = '127.0.0.1';
const POSTGRES_PORT = 5432;
const POSTGRES_USER = 'postgres';
const DEFAULT_DATABASE_NAME = 'ly_fullstack';

/**
 * 本地首次初始化使用的默认管理员账号
 *
 * 该账号只由 Seed 在数据库不存在同名用户时创建，不会在重复执行 Setup 时覆盖已有账号。
 */
const DEFAULT_ADMIN_USERNAME = 'admin';

/**
 * 本地默认管理员的首次初始化密码
 *
 * 密码只通过 Seed 子进程环境传递，不会写入任何环境文件；生产环境不得使用该默认凭证。
 */
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DATABASE_READY_TIMEOUT_MS = 30_000;

/**
 * 输出初始化命令帮助。
 */
const printHelp = () => {
  process.stdout.write(`LY Fullstack 本地环境初始化\n\n`);
  process.stdout.write(`  pnpm setup    创建六个环境文件、数据库、表结构、默认管理员和 RBAC 初始数据\n`);
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
 * 通过当前 Node.js 进程执行 pnpm CLI
 *
 * Windows 的 PATH 通常暴露 `pnpm.cmd` 或 `pnpm.ps1`，`spawn` 在关闭 shell 时无法直接执行这些脚本，
 * 会产生 `spawn pnpm ENOENT`。优先复用 pnpm 注入的 CLI 路径；直接运行本脚本时，再从 Node.js
 * 安装目录寻找同级 pnpm CLI。macOS 和 Linux 缺少 CLI 路径时可以继续使用 PATH 中的二进制。
 *
 * @param args pnpm 子命令和参数
 * @param env migration 或 seed 子进程需要继承和追加的环境变量
 */
const runPnpmCommand = (args, env) => {
  const lifecyclePnpmCliPath = process.env.npm_execpath;
  if (lifecyclePnpmCliPath) {
    return runCommand(process.execPath, [lifecyclePnpmCliPath, ...args], env);
  }

  if (process.platform === 'win32') {
    const adjacentPnpmCliPath = resolve(dirname(process.execPath), 'node_modules/pnpm/bin/pnpm.mjs');
    if (!existsSync(adjacentPnpmCliPath)) {
      throw new Error('无法定位 pnpm CLI，请使用 pnpm setup 运行初始化脚本。');
    }

    return runCommand(process.execPath, [adjacentPnpmCliPath, ...args], env);
  }

  return runCommand('pnpm', args, env);
};

/**
 * 生成 Admin 与 Admin API 的三套运行环境文件
 *
 * development 文件写入本次收集的本地数据库连接和随机 JWT 密钥，保证 `pnpm dev` 可以直接运行。
 * test 与 production 只写入环境结构和安全默认值，数据库、跨域、JWT 与端口由对应部署环境补充。
 * Admin 的 test 与 production 使用同源 `/api`，使前端产物可以在反向代理场景中直接构建。
 * 六个文件会使用受限文件模式写入，并由根 `.gitignore` 统一忽略；真实密钥不会进入模板或终端输出。
 *
 * @param databaseUrl 已对用户名和密码进行 URL 编码的 PostgreSQL 连接串
 * @param jwtSecret 本次初始化生成的 JWT 随机签名密钥
 */
const writeApplicationEnvFiles = (databaseUrl, jwtSecret) => {
  const adminLocalPort = adminApplication.localPort;
  const adminApiLocalPort = adminApiApplication.localPort;
  const adminEnvByName = {
    development: [
      '# 管理后台本地开发环境配置，由 pnpm setup 生成。',
      'APP_ENV=development',
      `API_BASE_URL=http://127.0.0.1:${adminApiLocalPort}/api`,
      '',
    ],
    test: ['# 管理后台测试环境配置，由 pnpm setup 生成。', 'APP_ENV=test', 'API_BASE_URL=/api', ''],
    production: ['# 管理后台生产环境配置，由 pnpm setup 生成。', 'APP_ENV=production', 'API_BASE_URL=/api', ''],
  };
  const adminApiDevelopmentEnv = [
    '# 管理 API 本地开发环境配置。',
    `DATABASE_URL="${databaseUrl}"`,
    `CORS_ORIGINS="http://localhost:${adminLocalPort},http://127.0.0.1:${adminLocalPort}"`,
    `JWT_SECRET="${jwtSecret}"`,
    'JWT_EXPIRES_IN="7d"',
    'PORT=""',
    '',
  ];

  /**
   * 创建管理 API 的部署环境占位配置
   *
   * 测试和生产凭据不能复用本地开发值，因此这里只输出完整变量结构，真实值由 CI、容器或部署平台注入。
   *
   * @param environmentLabel 写入文件说明的中文环境名称
   * @returns 可直接序列化为 dotenv 文件的逐行内容
   */
  const createAdminApiDeployEnv = (environmentLabel) => [
    `# 管理 API ${environmentLabel}环境配置，由部署平台或 CI 补充空值。`,
    'DATABASE_URL=""',
    'CORS_ORIGINS=""',
    'JWT_SECRET=""',
    'JWT_EXPIRES_IN="7d"',
    'PORT=""',
    '',
  ];
  const adminApiEnvByName = {
    development: adminApiDevelopmentEnv,
    test: createAdminApiDeployEnv('测试'),
    production: createAdminApiDeployEnv('生产'),
  };

  for (const environmentName of ENVIRONMENT_NAMES) {
    writeFileSync(resolve(adminDirectory, `.env.${environmentName}`), adminEnvByName[environmentName].join('\n'), {
      encoding: 'utf-8',
      mode: 0o600,
    });
    writeFileSync(
      resolve(adminApiDirectory, `.env.${environmentName}`),
      adminApiEnvByName[environmentName].join('\n'),
      { encoding: 'utf-8', mode: 0o600 },
    );
  }
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
 * 收集本地数据库配置
 *
 * 数据库名称提供 `ly_fullstack` 默认值并限制为 PostgreSQL 安全标识符；数据库密码使用隐藏输入。
 * 用户取消任一步骤时返回 `null`，调用方不会继续创建文件或修改数据库。
 *
 * @returns 初始化配置；用户取消时返回 `null`
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
  const existingPaths = localEnvPaths.filter(existsSync);
  if (existingPaths.length === 0) {
    return true;
  }

  log.warn('检测到已有本地环境配置，继续执行会覆盖 Admin 与 Admin API 的六个 .env.<环境> 文件。');
  const shouldOverwrite = await confirm({
    message: '确认使用本次输入重新生成本地配置？',
    initialValue: false,
  });

  return isCancel(shouldOverwrite) ? null : shouldOverwrite;
};

/**
 * 执行完整本地环境初始化流程
 *
 * 依次确认配置覆盖、收集凭据、准备 PostgreSQL、生成本地环境文件、执行 migration 和 RBAC seed。
 * 任一步骤失败都会停止后续流程并由顶层错误处理设置非零退出码，避免输出“初始化完成”的假成功状态。
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

  log.success(databaseCreated ? `数据库 ${databaseName} 已创建。` : `数据库 ${databaseName} 已存在，将继续初始化。`);

  const encodedPassword = encodeURIComponent(databasePassword);
  const encodedDatabaseName = encodeURIComponent(databaseName);
  const databaseUrl = `postgresql://${POSTGRES_USER}:${encodedPassword}@localhost:${POSTGRES_PORT}/${encodedDatabaseName}?schema=public`;
  const jwtSecret = randomBytes(32).toString('hex');
  writeApplicationEnvFiles(databaseUrl, jwtSecret);
  log.success('Admin 与 Admin API 的 development、test、production 环境文件已生成。');

  log.info('正在执行 Prisma migration，创建或更新全部表结构...');
  await runPnpmCommand(['--filter', '@repo/database', 'db:migrate'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  });

  log.info(`正在初始化 RBAC 数据和默认管理员 ${DEFAULT_ADMIN_USERNAME}...`);
  await runPnpmCommand(['--filter', '@repo/database', 'db:seed'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
    ADMIN_INITIAL_PASSWORD: DEFAULT_ADMIN_PASSWORD,
  });

  log.success(
    `默认管理员种子已执行：首次创建使用 ${DEFAULT_ADMIN_USERNAME} / ${DEFAULT_ADMIN_PASSWORD}，已有账号不会重置密码。`,
  );
  outro('数据库、表结构和 RBAC 初始数据均已就绪，现在可以运行 pnpm dev。');
};

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log.error(message);
  process.exitCode = 1;
});
