/**
 * NestJS 服务模板冒烟测试
 *
 * 在系统临时目录运行真实 Plop 生成器，验证文件集、模板变量替换和 workspace 注册结果。测试结束后只删除
 * 本次通过 `mkdtemp` 创建的目录，不接触仓库中的真实应用和配置。
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readWorkspaceConfig } from './workspace-config.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, '..');
const smokeRoot = mkdtempSync(join(tmpdir(), 'ly-fullstack-template-'));
const smokeAppRoot = resolve(smokeRoot, 'apps/smoke-api');
const expectedFiles = [
  'env.d.ts',
  'package.json',
  'rstest.config.ts',
  'src/constants/index.ts',
  'src/constants/modules/server.ts',
  'src/main.ts',
  'src/modules/app/app.module.ts',
  'src/modules/health/health.controller.test.ts',
  'src/modules/health/health.controller.ts',
  'src/modules/health/health.module.ts',
  'tsconfig.build.json',
  'tsconfig.json',
  'tsconfig.test.json',
];

/**
 * 运行命令并在失败时保留完整输出。
 */
const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf-8',
    windowsHide: true,
    ...options,
  });

  if (result.status !== 0) {
    const output = `${result.error?.message ?? ''}\n${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    throw new Error(`${command} ${args.join(' ')} 执行失败${output ? `\n${output}` : ''}`);
  }
};

try {
  copyFileSync(resolve(repoRoot, 'workspace.config.json'), resolve(smokeRoot, 'workspace.config.json'));
  copyFileSync(resolve(repoRoot, 'workspace.config.schema.json'), resolve(smokeRoot, 'workspace.config.schema.json'));

  const pnpmCliPath = process.env.npm_execpath;
  if (!pnpmCliPath) {
    throw new Error('无法定位当前 pnpm CLI');
  }

  runCommand(
    process.execPath,
    [
      pnpmCliPath,
      'exec',
      'plop',
      'server',
      'smoke-api',
      '3901',
      '--plopfile',
      resolve(repoRoot, 'plopfile.mjs'),
      '--dest',
      smokeRoot,
      '--no-progress',
    ],
    {
      env: {
        ...process.env,
        LY_FULLSTACK_PLOP_SKIP_COMMANDS: '1',
      },
      stdio: 'pipe',
    },
  );

  for (const relativePath of expectedFiles) {
    const filePath = resolve(smokeAppRoot, relativePath);
    if (!existsSync(filePath)) {
      throw new Error(`服务模板缺少生成文件：${relativePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    if (content.includes('{{') || content.includes('}}')) {
      throw new Error(`服务模板仍包含未替换变量：${relativePath}`);
    }
  }

  runCommand(
    process.execPath,
    [pnpmCliPath, 'exec', 'prettier', '--write', smokeAppRoot, '--config', resolve(repoRoot, '.prettierrc')],
    { stdio: 'pipe' },
  );

  const config = readWorkspaceConfig(smokeRoot);
  const generatedApp = config.apps.server['smoke-api'];
  if (generatedApp?.packageName !== '@repo/smoke-api' || generatedApp.localPort !== 3901) {
    throw new Error('服务生成器没有正确更新 workspace.config.json');
  }

  process.stdout.write('NestJS 服务模板冒烟测试通过。\n');
} finally {
  rmSync(smokeRoot, { force: true, recursive: true });
}
