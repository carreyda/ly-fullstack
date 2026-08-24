/**
 * LY Fullstack 开发环境初始化脚本
 *
 * 负责校验 Admin 开发 API 端口、收集 PostgreSQL 本地凭据、启动 Compose 数据库、幂等创建目标数据库，
 * 再为 Admin API 与默认 C 端 API 生成不会提交到 Git 的 development 环境文件、执行 Prisma migration，
 * 并初始化默认管理员和 RBAC 数据。数据库密码不会写入命令行参数或终端输出，JWT 密钥由脚本随机生成；
 * 两个服务端应用在仓库中只保留 `.env.example`。
 */

import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
const apiApplication = workspaceApplications.find((app) => app.kind === 'server' && app.name === 'api');

if (!adminApplication || !adminApiApplication || !apiApplication) {
  throw new Error('workspace.config.json 必须注册 admin、admin-api 与 api，才能初始化完整本地环境。');
}

const adminDirectory = resolve(repoRoot, adminApplication.path);
const adminApiDirectory = resolve(repoRoot, adminApiApplication.path);
const apiDirectory = resolve(repoRoot, apiApplication.path);
const adminDevelopmentPath = resolve(adminDirectory, '.env.development');
const adminApiDevelopmentPath = resolve(adminApiDirectory, '.env.development');
const apiDevelopmentPath = resolve(apiDirectory, '.env.development');

/**
 * Setup 会覆盖的本地服务端环境文件
 *
 * Admin 的三套环境配置均为仓库内公开的浏览器构建配置。Setup 生成两个服务端 development 文件；
 * test 与 production 环境继续由 CI/CD 或部署平台注入。
 */
const localEnvPaths = [adminApiDevelopmentPath, apiDevelopmentPath];

const POSTGRES_HOST = '127.0.0.1';
const POSTGRES_PORT = 5432;
const POSTGRES_USER = 'postgres';
const DEFAULT_DATABASE_NAME = 'ly_fullstack';
const SETUP_DATABASE_PASSWORD_ENV = 'SETUP_DATABASE_PASSWORD';
const SETUP_DATABASE_NAME_ENV = 'SETUP_DATABASE_NAME';
const SETUP_ADMIN_PASSWORD_ENV = 'SETUP_ADMIN_PASSWORD';
const isNonInteractive = process.argv.includes('--non-interactive');

/**
 * 本地首次初始化使用的默认管理员账号
 *
 * 该账号只由 Seed 在数据库不存在同名用户时创建，不会在重复执行 Setup 时覆盖已有账号。
 */
const DEFAULT_ADMIN_USERNAME = 'admin';

const DATABASE_READY_TIMEOUT_MS = 30_000;

/**
 * 输出初始化命令帮助。
 */
const printHelp = () => {
  process.stdout.write(`LY Fullstack 本地环境初始化\n\n`);
  process.stdout.write(`  pnpm setup    校验前端 API 端口，创建服务端本地配置、数据库、表结构和初始数据\n`);
  process.stdout.write(`  pnpm setup --non-interactive    使用环境变量执行同一套初始化流程\n\n`);
  process.stdout.write(`非交互模式必须注入：\n`);
  process.stdout.write(`  ${SETUP_DATABASE_PASSWORD_ENV}    PostgreSQL postgres 用户密码\n`);
  process.stdout.write(`  ${SETUP_DATABASE_NAME_ENV}        数据库名称，可省略并使用 ${DEFAULT_DATABASE_NAME}\n`);
  process.stdout.write(`  ${SETUP_ADMIN_PASSWORD_ENV}       首次创建 admin 时使用的管理员密码\n`);
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
 * 校验 Admin 开发环境中的 Admin API 端口
 *
 * Admin development 配置已经提交仓库。端口一致时不写文件，避免正常执行 Setup 产生无意义变更；
 * 只有应用注册表中的 Admin API 端口发生变化时，才同步修改公开配置。
 *
 * @returns 是否修改了 Admin development 配置
 */
const syncAdminDevelopmentApiPort = () => {
  if (!existsSync(adminDevelopmentPath)) {
    throw new Error('缺少 apps/admin/.env.development，请恢复仓库中的 Admin development 配置。');
  }

  const expectedApiBaseUrl = `http://127.0.0.1:${adminApiApplication.localPort}/api`;
  const currentContent = readFileSync(adminDevelopmentPath, 'utf-8');
  const apiBaseUrlPattern = /^API_BASE_URL=.*$/m;
  const currentApiBaseUrl = currentContent.match(apiBaseUrlPattern)?.[0];

  if (currentApiBaseUrl === `API_BASE_URL=${expectedApiBaseUrl}`) {
    return false;
  }

  const nextContent = apiBaseUrlPattern.test(currentContent)
    ? currentContent.replace(apiBaseUrlPattern, `API_BASE_URL=${expectedApiBaseUrl}`)
    : `${currentContent.trimEnd()}\nAPI_BASE_URL=${expectedApiBaseUrl}\n`;
  writeFileSync(adminDevelopmentPath, nextContent, 'utf-8');
  return true;
};

/**
 * 生成 Admin API 的本地开发环境文件
 *
 * 文件写入数据库连接、跨域来源和随机 JWT 密钥。服务端口仍由 `scripts/dev.mjs` 根据应用注册表注入，
 * 避免重复维护。该文件使用受限文件模式写入并由根 `.gitignore` 忽略。
 *
 * @param databaseUrl 已对用户名和密码进行 URL 编码的 PostgreSQL 连接串
 * @param jwtSecret 本次初始化生成的 JWT 随机签名密钥
 */
const writeAdminApiDevelopmentEnv = (databaseUrl, jwtSecret) => {
  const adminLocalPort = adminApplication.localPort;
  const adminApiDevelopmentEnv = [
    '# 管理 API 本地开发环境配置，由 pnpm setup 生成。',
    `DATABASE_URL="${databaseUrl}"`,
    `CORS_ORIGINS="http://localhost:${adminLocalPort},http://127.0.0.1:${adminLocalPort}"`,
    `JWT_SECRET="${jwtSecret}"`,
    'JWT_EXPIRES_IN="7d"',
    '',
  ].join('\n');

  writeFileSync(adminApiDevelopmentPath, adminApiDevelopmentEnv, { encoding: 'utf-8', mode: 0o600 });
};

/**
 * 生成默认 C 端 API 的本地开发环境文件
 *
 * 默认 API 与管理 API 共享 PostgreSQL，但拥有独立进程、端口和环境文件。跨域来源使用一个未被
 * 仓库占用的本地前端端口作为示例，用户创建真实 C 端后应改成对应开发地址。
 *
 * @param databaseUrl 已对用户名和密码进行 URL 编码的 PostgreSQL 连接串
 */
const writeApiDevelopmentEnv = (databaseUrl) => {
  const apiDevelopmentEnv = [
    '# 默认 C 端 API 本地开发环境配置，由 pnpm setup 生成。',
    `DATABASE_URL="${databaseUrl}"`,
    'CORS_ORIGINS="http://localhost:3002,http://127.0.0.1:3002"',
    '',
  ].join('\n');

  writeFileSync(apiDevelopmentPath, apiDevelopmentEnv, { encoding: 'utf-8', mode: 0o600 });
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
 * 校验 PostgreSQL 密码是否可以安全传给数据库驱动
 *
 * @param value 交互输入或自动化环境变量中的数据库密码
 * @returns 校验失败原因；通过时返回 `undefined`
 */
const validateDatabasePassword = (value) => {
  if (!value) {
    return '数据库密码不能为空';
  }

  if (value.includes('\n') || value.includes('\r')) {
    return '数据库密码不能包含换行符';
  }

  return undefined;
};

/**
 * 校验首次管理员密码是否满足后台账号密码契约
 *
 * Setup 与管理 API DTO 使用相同的 8 到 64 位边界。密码只在当前进程和 Seed 子进程内存中存在，
 * 不写入环境文件、日志或命令行参数。
 *
 * @param value 交互输入或自动化环境变量中的管理员初始密码
 * @returns 校验失败原因；通过时返回 `undefined`
 */
const validateAdminPassword = (value) => {
  if (!value) {
    return '管理员初始密码不能为空';
  }

  if (value.length < 8 || value.length > 64) {
    return '管理员初始密码长度必须为 8 到 64 位';
  }

  if (value.includes('\n') || value.includes('\r')) {
    return '管理员初始密码不能包含换行符';
  }

  return undefined;
};

/**
 * 归一化并校验目标数据库名称
 *
 * @param value 交互输入或自动化环境变量中的数据库名称
 * @returns 可安全用于 PostgreSQL 标识符的数据库名称
 */
const normalizeDatabaseName = (value) => {
  const databaseName = value?.trim() || DEFAULT_DATABASE_NAME;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
    throw new Error('数据库名只能包含字母、数字和下划线，且不能以数字开头');
  }

  return databaseName;
};

/**
 * 从进程环境读取自动化初始化参数
 *
 * 非交互模式只用于 CI 或明确的自动化环境，不从命令行参数读取密码，避免敏感值出现在进程列表和日志中。
 *
 * @returns 已通过校验的数据库和管理员初始化配置
 */
const readNonInteractiveSetupConfig = () => {
  const databasePassword = process.env[SETUP_DATABASE_PASSWORD_ENV];
  const passwordError = validateDatabasePassword(databasePassword);
  if (passwordError) {
    throw new Error(`${SETUP_DATABASE_PASSWORD_ENV}：${passwordError}`);
  }

  const adminPassword = process.env[SETUP_ADMIN_PASSWORD_ENV];
  const adminPasswordError = validateAdminPassword(adminPassword);
  if (adminPasswordError) {
    throw new Error(`${SETUP_ADMIN_PASSWORD_ENV}：${adminPasswordError}`);
  }

  return {
    databaseName: normalizeDatabaseName(process.env[SETUP_DATABASE_NAME_ENV]),
    databasePassword,
    adminPassword,
  };
};

/**
 * 收集本地数据库与管理员初始化配置
 *
 * 数据库名称提供 `ly_fullstack` 默认值并限制为 PostgreSQL 安全标识符；数据库密码和管理员初始密码
 * 均使用隐藏输入。管理员密码需要重复输入确认，避免首次初始化后因误输而无法登录。
 * 用户取消任一步骤时返回 `null`，调用方不会继续创建文件或修改数据库。
 *
 * @returns 初始化配置；用户取消时返回 `null`
 */
const promptForSetupConfig = async () => {
  const databasePassword = await password({
    message: '输入本地 PostgreSQL 的 postgres 用户密码',
    clearOnError: true,
    validate: validateDatabasePassword,
  });

  if (isCancel(databasePassword)) {
    return null;
  }

  const databaseName = await text({
    message: '输入本地数据库名称',
    initialValue: DEFAULT_DATABASE_NAME,
    defaultValue: DEFAULT_DATABASE_NAME,
    validate: (value) => {
      try {
        normalizeDatabaseName(value);
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
  });

  if (isCancel(databaseName)) {
    return null;
  }

  const adminPassword = await password({
    message: `设置首次创建 ${DEFAULT_ADMIN_USERNAME} 时使用的管理员密码`,
    clearOnError: true,
    validate: validateAdminPassword,
  });

  if (isCancel(adminPassword)) {
    return null;
  }

  const confirmedAdminPassword = await password({
    message: '再次输入管理员初始密码',
    clearOnError: true,
    validate: (value) => {
      const passwordError = validateAdminPassword(value);
      if (passwordError) {
        return passwordError;
      }

      return value === adminPassword ? undefined : '两次输入的管理员密码不一致';
    },
  });

  if (isCancel(confirmedAdminPassword)) {
    return null;
  }

  return {
    databaseName: normalizeDatabaseName(databaseName),
    databasePassword,
    adminPassword,
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

  if (isNonInteractive) {
    throw new Error('非交互初始化拒绝覆盖已有服务端 .env.development，请先显式删除对应文件。');
  }

  log.warn('检测到已有服务端本地开发配置，继续执行会覆盖 api 与 admin-api 的 .env.development。');
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

  const adminDevelopmentUpdated = syncAdminDevelopmentApiPort();
  log.info(
    adminDevelopmentUpdated
      ? 'Admin development 的 API 端口已根据 workspace.config.json 更新。'
      : 'Admin development 的 API 端口与 workspace.config.json 一致。',
  );

  const setupConfig = isNonInteractive ? readNonInteractiveSetupConfig() : await promptForSetupConfig();
  if (!setupConfig) {
    cancel('已取消初始化。');
    return;
  }

  const { adminPassword, databaseName, databasePassword } = setupConfig;

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
  writeAdminApiDevelopmentEnv(databaseUrl, jwtSecret);
  writeApiDevelopmentEnv(databaseUrl);
  log.success('API 与 Admin API 的 .env.development 已生成。');

  log.info('正在执行 Prisma migration，创建或更新全部表结构...');
  await runPnpmCommand(['--filter', '@repo/database', 'db:migrate'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  });

  log.info(`正在初始化 RBAC 数据和默认管理员 ${DEFAULT_ADMIN_USERNAME}...`);
  await runPnpmCommand(['--filter', '@repo/database', 'db:seed'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
    ADMIN_INITIAL_PASSWORD: adminPassword,
  });

  log.success(`默认管理员种子已执行：首次创建账号为 ${DEFAULT_ADMIN_USERNAME}，已有账号不会重置密码。`);
  outro('服务端环境、数据库、表结构和初始数据均已就绪，现在可以运行 pnpm dev。');
};

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log.error(message);
  process.exitCode = 1;
});
