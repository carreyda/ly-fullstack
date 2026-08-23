import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import { assignAdminUserRoles, fetchAdminUserRoleOptions } from '@/api';
import { withSetup } from '@/testing/with-setup';
import { useUserRole } from './use-user-role';

import type { AdminUserListItem, AdminUserRoleOption } from '@repo/shared/types';
import type { UseUserRoleOptions } from '@/types';

rstest.mock('@/api', () => ({
  fetchAdminUserRoleOptions: rstest.fn(),
  assignAdminUserRoles: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
}));

/**
 * 构造角色选项夹具
 *
 * @param id 角色主键
 * @param overrides 需要覆盖的字段
 * @returns 满足 Shared 契约的角色选项
 */
const createRoleOption = (id: number, overrides: Partial<AdminUserRoleOption> = {}): AdminUserRoleOption => {
  return {
    id,
    name: `角色${id}`,
    code: `role_${id}`,
    description: null,
    isActive: true,
    isSystem: false,
    ...overrides,
  };
};

/**
 * 构造用户列表记录夹具
 *
 * @param roleIds 用户当前绑定的角色主键
 * @param overrides 需要覆盖的字段
 * @returns 满足 Shared 契约的用户记录
 */
const createUserItem = (roleIds: number[], overrides: Partial<AdminUserListItem> = {}): AdminUserListItem => {
  return {
    id: 9,
    username: 'operator',
    displayName: '运营专员',
    isActive: true,
    isSystem: false,
    roles: roleIds.map((roleId) => ({ id: roleId, name: `角色${roleId}`, code: `role_${roleId}` })),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
};

/**
 * 等待角色选项请求结束
 *
 * @param dialog 被测 Composable 返回值
 */
const waitForLoadingSettled = async (dialog: ReturnType<typeof useUserRole>): Promise<void> => {
  await rstest.waitFor(() => expect(dialog.loading.value).toBe(false));
};

describe('用户角色分配弹框', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
  });

  it('打开弹框时只加载启用且非系统的角色选项', async () => {
    rstest
      .mocked(fetchAdminUserRoleOptions)
      .mockResolvedValue([
        createRoleOption(1),
        createRoleOption(2, { isActive: false }),
        createRoleOption(3, { isSystem: true }),
      ]);

    const [dialog] = withSetup(() => useUserRole({ onSuccess: rstest.fn() }));
    await dialog.open(createUserItem([]));
    await waitForLoadingSettled(dialog);

    expect(dialog.dialogVisible.value).toBe(true);
    expect(dialog.roleOptions.value.map((role) => role.id)).toEqual([1]);
  });

  it('已绑定角色中不可再分配的会被移出选中集合', async () => {
    rstest
      .mocked(fetchAdminUserRoleOptions)
      .mockResolvedValue([
        createRoleOption(1),
        createRoleOption(2, { isActive: false }),
        createRoleOption(3, { isSystem: true }),
      ]);

    const [dialog] = withSetup(() => useUserRole({ onSuccess: rstest.fn() }));
    await dialog.open(createUserItem([1, 2, 3]));
    await waitForLoadingSettled(dialog);

    expect(dialog.selectedRoleIds.value).toEqual([1]);
  });

  it('系统内置用户不进入角色分配弹框', async () => {
    const [dialog] = withSetup(() => useUserRole({ onSuccess: rstest.fn() }));

    await dialog.open(createUserItem([], { isSystem: true }));

    expect(dialog.dialogVisible.value).toBe(false);
    expect(fetchAdminUserRoleOptions).not.toHaveBeenCalled();
  });

  it('角色选项加载失败时恢复加载状态且弹框保持打开', async () => {
    rstest.mocked(fetchAdminUserRoleOptions).mockRejectedValue(new Error('网络连接失败'));

    const [dialog] = withSetup(() => useUserRole({ onSuccess: rstest.fn() }));
    await dialog.open(createUserItem([]));
    await waitForLoadingSettled(dialog);

    expect(dialog.dialogVisible.value).toBe(true);
    expect(dialog.roleOptions.value).toEqual([]);
  });

  it('保存成功提交完整角色集合并关闭弹框', async () => {
    rstest.mocked(fetchAdminUserRoleOptions).mockResolvedValue([createRoleOption(1), createRoleOption(2)]);
    rstest.mocked(assignAdminUserRoles).mockResolvedValue(undefined);
    const onSuccess = rstest.fn<UseUserRoleOptions['onSuccess']>();

    const [dialog] = withSetup(() => useUserRole({ onSuccess }));
    await dialog.open(createUserItem([1]));
    await waitForLoadingSettled(dialog);

    dialog.selectedRoleIds.value = [1, 2];
    await dialog.handleSubmit();

    // 保存的是完整集合而不是增量，服务端按集合整体替换关联
    expect(assignAdminUserRoles).toHaveBeenCalledWith(9, { roleIds: [1, 2] });
    expect(dialog.dialogVisible.value).toBe(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(dialog.submitting.value).toBe(false);
  });

  it('选项加载进行中时拒绝提交，提交失败保持弹框打开', async () => {
    let resolveOptions!: (value: AdminUserRoleOption[]) => void;
    rstest.mocked(fetchAdminUserRoleOptions).mockImplementationOnce(
      () =>
        new Promise<AdminUserRoleOption[]>((resolve) => {
          resolveOptions = resolve;
        }),
    );

    const [dialog] = withSetup(() => useUserRole({ onSuccess: rstest.fn() }));
    const opening = dialog.open(createUserItem([1]));

    await rstest.waitFor(() => expect(dialog.loading.value).toBe(true));
    await dialog.handleSubmit();
    expect(assignAdminUserRoles).not.toHaveBeenCalled();

    resolveOptions([createRoleOption(1)]);
    await opening;
    await waitForLoadingSettled(dialog);

    rstest.mocked(assignAdminUserRoles).mockRejectedValue(new Error('角色已停用'));
    await dialog.handleSubmit();

    expect(dialog.submitting.value).toBe(false);
    expect(dialog.dialogVisible.value).toBe(true);
  });
});
