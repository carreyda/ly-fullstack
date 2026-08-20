/**
 * LY Fullstack 代码生成器
 *
 * 当前只提供统一的 NestJS + Fastify 服务生成器。Web 应用可能使用 Nuxt、Next.js 或其他技术栈，
 * 因此不在这里建立错误的通用 Web 模板。
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { getWorkspaceApplications, readWorkspaceConfig, writeWorkspaceConfig } from './scripts/workspace-config.mjs';

const APP_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * 获取当前配置中尚未使用的下一个服务端口。
 */
const getSuggestedServerPort = (repoRoot) => {
  const usedPorts = new Set(getWorkspaceApplications(readWorkspaceConfig(repoRoot)).map((app) => app.localPort));
  let port = 3001;

  while (usedPorts.has(port)) {
    port += 1;
  }

  return port;
};

/**
 * 执行生成完成后的 pnpm 命令，并保留真实退出码和终端输出。
 */
const runPnpm = (repoRoot, args) => {
  const pnpmCliPath = process.env.npm_execpath;
  if (!pnpmCliPath) {
    throw new Error('无法定位当前 pnpm CLI，请从 pnpm new:server 运行生成器');
  }

  const result = spawnSync(process.execPath, [pnpmCliPath, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} 执行失败，退出码 ${result.status ?? 1}`);
  }
};

export default function (plop) {
  const repoRoot = plop.getDestBasePath();

  plop.setGenerator('server', {
    description: '生成 NestJS + Fastify 服务并注册到 workspace',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: '服务名称',
        validate: (value) => {
          const name = String(value).trim();
          if (!APP_NAME_PATTERN.test(name)) {
            return '服务名称必须使用 kebab-case，例如 api 或 order-api';
          }

          const config = readWorkspaceConfig(repoRoot);
          const applications = getWorkspaceApplications(config);
          if (applications.some((app) => app.name === name)) {
            return `应用 ${name} 已在 workspace.config.json 中注册`;
          }
          if (existsSync(resolve(repoRoot, 'apps', name))) {
            return `apps/${name} 已存在`;
          }

          return true;
        },
        filter: (value) => String(value).trim(),
      },
      {
        type: 'input',
        name: 'localPort',
        message: '本地开发端口',
        default: () => getSuggestedServerPort(repoRoot),
        validate: (value) => {
          const port = Number(value);
          if (!Number.isInteger(port) || port < 1 || port > 65_535) {
            return '端口必须是 1 到 65535 之间的整数';
          }

          const applications = getWorkspaceApplications(readWorkspaceConfig(repoRoot));
          const owner = applications.find((app) => app.localPort === port);

          return owner ? `端口 ${port} 已被 ${owner.name} 使用` : true;
        },
        filter: (value) => Number(value),
      },
    ],
    actions: (answers) => {
      const name = answers.name;
      const packageName = `@repo/${name}`;

      return [
        {
          type: 'addMany',
          destination: 'apps/{{name}}',
          base: 'scripts/templates/server',
          templateFiles: 'scripts/templates/server/**',
          stripExtensions: ['hbs'],
          abortOnFail: true,
        },
        () => {
          const config = readWorkspaceConfig(repoRoot);
          config.apps.server[name] = {
            path: `apps/${name}`,
            packageName,
            localPort: answers.localPort,
            healthPath: '/api/health',
          };
          writeWorkspaceConfig(repoRoot, config);

          return `已注册 ${name} 到 workspace.config.json`;
        },
        () => {
          if (process.env.LY_FULLSTACK_PLOP_SKIP_COMMANDS === '1') {
            return '已跳过依赖安装和生成结果校验';
          }

          runPnpm(repoRoot, ['exec', 'prettier', '--write', `apps/${name}`]);
          runPnpm(repoRoot, ['install']);
          runPnpm(repoRoot, ['--filter', packageName, 'typecheck']);
          runPnpm(repoRoot, ['--filter', packageName, 'test']);
          runPnpm(repoRoot, ['--filter', packageName, 'build']);

          return `${name} 依赖安装、类型检查、测试和构建均已通过`;
        },
      ];
    },
  });
}
