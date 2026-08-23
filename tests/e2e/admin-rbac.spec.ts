import { expect, test } from '@playwright/test';

import type { APIRequestContext, Page, Response } from '@playwright/test';

/**
 * 超级管理员登录凭据
 *
 * 本地默认使用种子管理员账号；CI 由 `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD` 环境变量注入。
 */
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';

/**
 * 登录限流封锁窗口等待时长
 *
 * 管理端登录接口按“IP + 账号”维度限流（5 次 / 60 秒，超限后再封锁 60 秒）。完整 e2e 套件恰好
 * 用满 admin 的限流额度，CI 失败重试可能触发 429；等待封锁窗口结束后重试一次即可恢复。
 */
const LOGIN_RATE_LIMIT_RETRY_WAIT_MS = 61_000;

/**
 * 登录接口返回并被测试捕获的会话信息
 */
interface AdminSession {
  /**
   * 登录接口签发的 Access Token，用于测试内直接调用管理 API 验证服务端权限
   */
  token: string;

  /**
   * 管理 API 基础地址，例如 `http://127.0.0.1:3000/api`
   *
   * 从浏览器实际请求的登录地址推导，不在测试中写死端口，保证本地与 CI 一致。
   */
  apiBaseUrl: string;
}

/**
 * 使用指定账号在登录页完成真实登录
 *
 * 滑块验证沿用冒烟测试的键盘 End 无障碍路径。登录成功后解析响应体捕获 Token 与管理 API
 * 基础地址，供测试直接调用接口断言服务端行为；登录前访问的目标地址会被路由守卫还原。
 *
 * @param page 当前浏览器页面
 * @param username 登录账号
 * @param password 登录密码
 * @param targetPath 登录前访问的站内目标地址
 * @returns 登录会话信息
 */
const loginViaUi = async (
  page: Page,
  username: string,
  password: string,
  targetPath = '/dashboard',
): Promise<AdminSession> => {
  await page.goto(targetPath);
  await expect(page.getByRole('heading', { name: '欢迎登录' })).toBeVisible();

  await page.getByRole('textbox', { name: '管理员账号' }).fill(username);
  await page.getByLabel('登录密码').fill(password);
  const slider = page.getByRole('slider', { name: '登录安全滑块' });
  await slider.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext', '验证通过');

  /**
   * 提交登录表单并等待登录接口响应
   *
   * @returns 登录接口的原始响应
   */
  const submitLogin = async (): Promise<Response> => {
    const loginResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith('/api/auth/login') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '登录', exact: true }).click();
    return loginResponsePromise;
  };

  let loginResponse = await submitLogin();
  if (loginResponse.status() === 429) {
    await page.waitForTimeout(LOGIN_RATE_LIMIT_RETRY_WAIT_MS);
    // 重新按 End 确保滑块仍处于验证通过状态，再重试一次登录
    await slider.press('End');
    await expect(slider).toHaveAttribute('aria-valuetext', '验证通过');
    loginResponse = await submitLogin();
  }

  expect(loginResponse.ok(), `账号 ${username} 登录接口必须成功`).toBe(true);

  const session = (await loginResponse.json()) as { token?: string };
  if (!session.token) {
    throw new Error(`账号 ${username} 登录响应缺少 Token，无法继续 RBAC 全链路验证。`);
  }

  await expect(page).toHaveURL(new RegExp(`${targetPath.replaceAll('/', '\\/')}$`));

  return {
    token: session.token,
    apiBaseUrl: `${new URL(loginResponse.url()).origin}/api`,
  };
};

/**
 * 通过顶栏账号菜单退出当前登录
 *
 * @param page 当前浏览器页面
 */
const logoutViaUi = async (page: Page): Promise<void> => {
  await page.locator('.layout-header__profile-trigger').click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login$/);
};

/**
 * 通过管理 API 尽最大努力清理测试用户与测试角色
 *
 * 供 `finally` 调用：UI 删除流程已成功时，这里按唯一编码检索不到数据，自然空跑；中途断言
 * 失败时，则按唯一用户名和角色编码检索并删除。必须先删用户再删角色，仍绑定用户的角色会被
 * 服务端删除保护拒绝。请求复用超级管理员在步骤 1 捕获的 Token，不再追加登录，避免触发登录
 * 接口的限流（5 次 / 60 秒）。所有异常只记录不抛出，避免掩盖测试自身失败。
 *
 * @param request 与页面共享的 API 请求上下文
 * @param apiBaseUrl 管理 API 基础地址
 * @param adminToken 超级管理员在步骤 1 登录时捕获的 Access Token
 * @param username 测试用户登录名
 * @param roleCode 测试角色编码
 */
const cleanupRbacDataViaApi = async (
  request: APIRequestContext,
  apiBaseUrl: string,
  adminToken: string,
  username: string,
  roleCode: string,
): Promise<void> => {
  try {
    const headers = { Authorization: `Bearer ${adminToken}` };

    // 列表接口要求显式分页参数，缺失时返回 400 导致清理被跳过
    const usersResponse = await request.get(`${apiBaseUrl}/users`, {
      params: { pageNum: 1, pageSize: 10, keyword: username },
      headers,
    });
    const usersPayload = usersResponse.ok()
      ? ((await usersResponse.json()) as { list?: Array<{ id: number; username?: string }> })
      : undefined;
    for (const user of usersPayload?.list?.filter((item) => item.username === username) ?? []) {
      await request.delete(`${apiBaseUrl}/users/${user.id}`, { headers });
    }

    const rolesResponse = await request.get(`${apiBaseUrl}/roles`, {
      params: { pageNum: 1, pageSize: 10, keyword: roleCode },
      headers,
    });
    const rolesPayload = rolesResponse.ok()
      ? ((await rolesResponse.json()) as { list?: Array<{ id: number; code?: string }> })
      : undefined;
    for (const role of rolesPayload?.list?.filter((item) => item.code === roleCode) ?? []) {
      await request.delete(`${apiBaseUrl}/roles/${role.id}`, { headers });
    }
  } catch (error) {
    console.warn(`RBAC 测试数据 API 清理未完成（${username} / ${roleCode}）：${String(error)}`);
  }
};

test('五表 RBAC 全链路：仅授权工作台的角色用户无法访问系统管理', async ({ page }) => {
  // 链路包含三次登录、完整的角色与用户 CRUD 和两次删除确认，默认 30 秒不足以覆盖 CI 冷启动编译。
  test.setTimeout(120_000);

  /**
   * 本次运行的唯一数据后缀
   *
   * 时间戳保证测试可重复运行，随机段避免 CI 重试与同毫秒执行产生冲突。
   */
  const uniqueSuffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const roleName = `E2E受限角色${uniqueSuffix}`;
  const roleCode = `e2e_limited_${uniqueSuffix}`;
  const username = `e2e_rbac_${uniqueSuffix}`;
  const password = `E2e#${uniqueSuffix}pass`;

  /**
   * 超级管理员在步骤 1 登录时捕获的会话
   *
   * `finally` 清理复用该 Token 直接调用删除接口；保持空串说明测试在任何数据创建之前失败，
   * 无需清理，也不必再发起登录请求占用限流额度。
   */
  let apiBaseUrl = '';
  let adminToken = '';

  try {
    // 步骤 1：超级管理员登录并直达角色管理
    const adminSession = await loginViaUi(page, ADMIN_USERNAME, ADMIN_PASSWORD, '/system/role');
    apiBaseUrl = adminSession.apiBaseUrl;
    adminToken = adminSession.token;
    await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible();

    // 步骤 2：创建名称与编码均唯一的测试角色
    await page.getByRole('button', { name: '新增角色' }).click();
    const roleDialog = page.getByRole('dialog', { name: '新增角色' });
    await roleDialog.getByLabel('角色名称').fill(roleName);
    await roleDialog.getByLabel('角色编码').fill(roleCode);
    await roleDialog.getByRole('button', { name: '保存' }).click();
    await expect(roleDialog).toBeHidden();

    const roleRow = page.getByRole('row').filter({ hasText: roleCode });
    await expect(roleRow).toBeVisible();

    // 步骤 3：给测试角色仅分配“工作台”菜单，不勾选系统管理及其按钮权限
    await roleRow.getByRole('button', { name: '菜单权限' }).click();
    const permissionDialog = page.getByRole('dialog', { name: `分配菜单权限 - ${roleName}` });
    await expect(permissionDialog.getByText('系统管理')).toBeVisible();

    await permissionDialog.getByText('工作台', { exact: true }).click();
    // 父级树节点的 li 会嵌套全部子孙节点，`:scope` 限定只断言节点自身的勾选框
    const dashboardNode = permissionDialog.getByRole('treeitem', { name: '工作台' });
    await expect(dashboardNode.locator(':scope > .el-tree-node__content input[type="checkbox"]')).toBeChecked();
    const systemNode = permissionDialog.getByRole('treeitem', { name: '系统管理' });
    await expect(systemNode.locator(':scope > .el-tree-node__content input[type="checkbox"]')).not.toBeChecked();

    await permissionDialog.getByRole('button', { name: '保存' }).click();
    await expect(permissionDialog).toBeHidden();

    // 步骤 4：创建唯一测试用户
    await page.goto('/system/user');
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
    await page.getByRole('button', { name: '新增用户' }).click();
    const userDialog = page.getByRole('dialog', { name: '新增用户' });
    await userDialog.getByLabel('登录名').fill(username);
    await userDialog.getByLabel('初始密码').fill(password);
    await userDialog.getByLabel('显示名称').fill('E2E 权限验证用户');
    await userDialog.getByRole('button', { name: '保存' }).click();
    await expect(userDialog).toBeHidden();

    const userRow = page.getByRole('row').filter({ hasText: username });
    await expect(userRow).toBeVisible();

    // 步骤 5：把测试角色绑定给测试用户
    await userRow.getByRole('button', { name: '分配角色' }).click();
    const assignDialog = page.getByRole('dialog', { name: '分配角色' });
    // 多选下拉的 combobox 输入框被占位元素遮挡，点击占位文本即点击选择器可见区域展开选项
    await assignDialog.getByText('请选择角色').click();
    await page.getByRole('option', { name: roleName }).click();
    // 多选下拉选中后仍保持展开，Escape 会被组件拦截并只收起浮层，不会关闭所属弹框
    await page.keyboard.press('Escape');
    await assignDialog.getByRole('button', { name: '保存' }).click();
    await expect(assignDialog).toBeHidden();
    await expect(userRow).toContainText(roleName);

    // 步骤 6：退出超级管理员
    await logoutViaUi(page);

    // 步骤 7：使用受限测试用户登录
    const userSession = await loginViaUi(page, username, password);
    await expect(page.getByRole('region', { name: '核心指标' })).toBeVisible();

    // 步骤 8：新用户能看到并进入工作台
    await page.getByRole('menuitem', { name: '工作台' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 步骤 9：侧栏不出现系统管理入口，菜单由登录会话的数据库菜单树驱动
    await expect(page.getByRole('menuitem', { name: '系统管理' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: '用户管理' })).toHaveCount(0);

    // 步骤 10：携带新用户 Token 直接请求系统管理列表接口，断言服务端返回 403，
    // 证明权限由 PermissionGuard 在接口层拦截，而不只是前端隐藏了菜单
    const listResponse = await page.request.get(`${userSession.apiBaseUrl}/users`, {
      params: { pageNum: 1, pageSize: 10 },
      headers: { Authorization: `Bearer ${userSession.token}` },
    });
    expect(listResponse.status()).toBe(403);

    // 步骤 11：重新登录超级管理员，按唯一标识筛选并删除测试用户与测试角色
    await logoutViaUi(page);
    await loginViaUi(page, ADMIN_USERNAME, ADMIN_PASSWORD, '/system/user');

    await page.getByLabel('关键词').fill(username);
    await page.getByRole('button', { name: '查询' }).click();
    const cleanupUserRow = page.getByRole('row').filter({ hasText: username });
    await expect(cleanupUserRow).toBeVisible();
    await cleanupUserRow.getByRole('button', { name: '删除', exact: true }).click();
    // 删除确认框文案展示显示名称而不是登录名，按确认框标题定位避免依赖文案内容
    await page.getByRole('dialog', { name: '删除用户' }).getByRole('button', { name: '删除', exact: true }).click();
    await expect(cleanupUserRow).toHaveCount(0);

    await page.goto('/system/role');
    await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible();
    await page.getByLabel('关键词').fill(roleCode);
    await page.getByRole('button', { name: '查询' }).click();
    const cleanupRoleRow = page.getByRole('row').filter({ hasText: roleCode });
    await expect(cleanupRoleRow).toBeVisible();
    await cleanupRoleRow.getByRole('button', { name: '删除', exact: true }).click();
    await page.getByRole('dialog', { name: '删除角色' }).getByRole('button', { name: '删除', exact: true }).click();
    await expect(cleanupRoleRow).toHaveCount(0);
  } finally {
    if (apiBaseUrl && adminToken) {
      await cleanupRbacDataViaApi(page.request, apiBaseUrl, adminToken, username, roleCode);
    }
  }
});
