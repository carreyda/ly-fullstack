import { defineConfig, devices } from '@playwright/test';

import { getWorkspaceApplications, readWorkspaceConfig } from './scripts/workspace-config.mjs';

const localNoProxy = [process.env.NO_PROXY, process.env.no_proxy, 'localhost', '127.0.0.1', '::1']
  .flatMap((value) => value?.split(',') ?? [])
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((value, index, values) => values.indexOf(value) === index)
  .join(',');

process.env.NO_PROXY = localNoProxy;
process.env.no_proxy = localNoProxy;

const applications = getWorkspaceApplications(readWorkspaceConfig(process.cwd()));
const admin = applications.find((application) => application.kind === 'web' && application.name === 'admin');
const adminApi = applications.find((application) => application.kind === 'server' && application.name === 'admin-api');

if (!admin || !adminApi) {
  throw new Error('Playwright 需要 workspace.config.json 同时注册 admin 与 admin-api。');
}

// Rsbuild 默认可能只监听 localhost 对应的 IPv6 回环地址，使用 localhost 可同时兼容本地与 Linux CI。
const adminUrl = `http://localhost:${admin.localPort}`;
const adminApiHealthUrl = `http://127.0.0.1:${adminApi.localPort}${adminApi.healthPath}`;

/**
 * 管理系统关键流程的浏览器冒烟测试配置
 *
 * Playwright 分别启动 Admin API 与 Admin，并等待健康检查和页面入口就绪。测试依赖 pnpm setup 已经完成
 * migration 与 seed；CI 固定使用单个 Chromium Worker，避免共享默认管理员会话造成并发干扰。
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: adminUrl,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'Admin API',
      command: 'pnpm dev:admin-api',
      url: adminApiHealthUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      name: 'Admin',
      command: 'pnpm dev:admin',
      url: adminUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
