import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const ADMIN_API_URL = process.env.E2E_ADMIN_API_URL || 'http://127.0.0.1:3000/api';

/**
 * 使用默认管理员完成真实登录
 *
 * 登录页滑块提供键盘 End 操作，测试沿用同一条无障碍交互路径，避免依赖像素距离。调用方传入受保护
 * 页面时可以同时验证登录守卫保留并恢复原目标地址。
 *
 * @param page 当前浏览器页面
 * @param targetPath 登录前访问的站内目标地址
 * @param rememberUsername 是否验证记住账号 Cookie
 */
const loginAsAdmin = async (page: Page, targetPath = '/dashboard', rememberUsername = false): Promise<void> => {
  await page.goto(targetPath);
  await expect(page.getByRole('heading', { name: '欢迎登录' })).toBeVisible();

  await page.getByRole('textbox', { name: '管理员账号' }).fill(ADMIN_USERNAME);
  await page.getByLabel('登录密码').fill(ADMIN_PASSWORD);
  await page.getByRole('slider', { name: '登录安全滑块' }).press('End');
  await expect(page.getByRole('slider', { name: '登录安全滑块' })).toHaveAttribute('aria-valuetext', '验证通过');

  if (rememberUsername) {
    await page.locator('.el-checkbox').filter({ hasText: '记住账号' }).click();
  }

  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/auth/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '登录', exact: true }).click();
  expect((await loginResponsePromise).ok()).toBe(true);
  await expect(page).toHaveURL(new RegExp(`${targetPath.replaceAll('/', '\\/')}$`));
};

test('未登录访问系统页面后完成登录并返回原目标', async ({ context, page }) => {
  await loginAsAdmin(page, '/system/user', true);
  await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === 'LY_FULLSTACK_ADMIN_USERNAME')?.value).toBe(ADMIN_USERNAME);
  expect(cookies.some((cookie) => cookie.name === 'LY_FULLSTACK_ADMIN_CREDENTIALS')).toBe(false);
});

test('刷新页面后恢复会话并使用数据库动态菜单导航', async ({ page }) => {
  await loginAsAdmin(page);

  const sessionResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/auth/me') && response.request().method() === 'GET',
  );
  await page.reload();
  expect((await sessionResponsePromise).ok()).toBe(true);
  await expect(page.getByRole('region', { name: '核心指标' })).toBeVisible();

  await page.getByRole('menuitem', { name: '角色管理' }).click();
  await expect(page).toHaveURL(/\/system\/role$/);
  await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible();
});

test('退出登录后清理会话并重新保护后台路由', async ({ page }) => {
  await loginAsAdmin(page);

  await page.locator('.layout-header__profile-trigger').click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '欢迎登录' })).toBeVisible();

  await page.goto('/system/menu');
  await expect(page).toHaveURL(/\/login\?redirect=\/system\/menu$/);
});

test('Admin API 返回安全响应头并限制高频登录请求', async ({ request }) => {
  const healthResponse = await request.get(`${ADMIN_API_URL}/health`);
  expect(healthResponse.ok()).toBe(true);
  expect(healthResponse.headers()['x-content-type-options']).toBe('nosniff');

  const username = `rate_limit_probe_${Date.now()}`;
  for (let requestIndex = 0; requestIndex < 5; requestIndex += 1) {
    const loginResponse = await request.post(`${ADMIN_API_URL}/auth/login`, {
      data: { username, password: 'invalidPassword123' },
    });
    expect(loginResponse.status()).toBe(401);
  }

  const throttledResponse = await request.post(`${ADMIN_API_URL}/auth/login`, {
    data: { username, password: 'invalidPassword123' },
  });
  expect(throttledResponse.status()).toBe(429);
});
