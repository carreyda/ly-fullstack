import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import { deleteAdminRole, fetchAdminRoles } from '@/api';
import { withSetup } from '@/testing/with-setup';
import { useRoleManagement } from './use-role-management';

import type { MessageBoxData } from 'element-plus';
import type { AdminRoleListItem, PaginationResult } from '@repo/shared/types';

rstest.mock('@/api', () => ({
  fetchAdminRoles: rstest.fn(),
  deleteAdminRole: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
  ElMessageBox: { confirm: rstest.fn() },
}));

/**
 * 构造角色列表记录夹具
 *
 * @param id 角色主键
 * @param code 角色编码
 * @param overrides 需要覆盖的字段
 * @returns 满足 Shared 契约的角色记录
 */
const createRoleItem = (id: number, code: string, overrides: Partial<AdminRoleListItem> = {}): AdminRoleListItem => {
  return {
    id,
    name: `角色${id}`,
    code,
    description: null,
    isActive: true,
    isSystem: false,
    userCount: 0,
    menuCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
};

/**
 * 构造角色分页结果夹具
 *
 * @param list 当前页记录
 * @returns 分页接口的标准返回结构
 */
const createRolePage = (list: AdminRoleListItem[]): PaginationResult<AdminRoleListItem> => {
  return { list, total: list.length, pageNum: 1, pageSize: 20 };
};

/**
 * 等待当前列表请求结束
 *
 * @param management 被测 Composable 返回值
 */
const waitForLoadingSettled = async (management: ReturnType<typeof useRoleManagement>): Promise<void> => {
  await rstest.waitFor(() => expect(management.loading.value).toBe(false));
};

describe('角色管理列表流程', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
    rstest.mocked(ElMessageBox.confirm).mockResolvedValue({} as MessageBoxData);
  });

  it('挂载后自动加载第一页角色', async () => {
    const page = createRolePage([createRoleItem(2, 'editor'), createRoleItem(1, 'super_admin', { isSystem: true })]);
    rstest.mocked(fetchAdminRoles).mockResolvedValue(page);

    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    expect(fetchAdminRoles).toHaveBeenCalledWith({ pageNum: 1, pageSize: 20 });
    expect(management.roleList.value).toEqual(page.list);
    expect(management.total.value).toBe(2);
  });

  it('首次加载失败时清零总数且列表保持为空', async () => {
    rstest.mocked(fetchAdminRoles).mockRejectedValue(new Error('网络连接失败'));

    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    expect(management.roleList.value).toEqual([]);
    expect(management.total.value).toBe(0);
  });

  it('筛选提交后查询回到第一页并携带关键词', async () => {
    rstest.mocked(fetchAdminRoles).mockResolvedValue(createRolePage([]));
    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    await management.handlePageNumChange(2);
    management.handleFilterUpdate({ keyword: 'editor' });
    await management.handleSearch();

    expect(rstest.mocked(fetchAdminRoles)).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 20, keyword: 'editor' });
  });

  it('重置筛选后恢复默认查询参数', async () => {
    rstest.mocked(fetchAdminRoles).mockResolvedValue(createRolePage([]));
    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    management.handleFilterUpdate({ keyword: 'editor', status: 'ACTIVE' });
    await management.handleReset();

    expect(rstest.mocked(fetchAdminRoles)).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 20 });
  });

  it('新增成功后回到第一页，编辑成功后刷新当前页', async () => {
    // 回显分页参数，避免固定夹具把页码重置回第一页导致断言失真
    rstest.mocked(fetchAdminRoles).mockImplementation(async (params) => {
      return { list: [], total: 0, pageNum: params.pageNum, pageSize: params.pageSize };
    });
    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    await management.handlePageNumChange(2);
    await management.handleFormSuccess('add');
    expect(rstest.mocked(fetchAdminRoles)).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 20 });

    await management.handlePageNumChange(2);
    await management.handleFormSuccess('edit');
    expect(rstest.mocked(fetchAdminRoles)).toHaveBeenLastCalledWith({ pageNum: 2, pageSize: 20 });
  });

  it('系统内置角色与确认取消都不发起删除请求', async () => {
    rstest.mocked(fetchAdminRoles).mockResolvedValue(createRolePage([]));
    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    await management.handleRoleDelete(createRoleItem(1, 'super_admin', { isSystem: true }));
    expect(ElMessageBox.confirm).not.toHaveBeenCalled();

    rstest.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'));
    await management.handleRoleDelete(createRoleItem(2, 'editor'));
    expect(deleteAdminRole).not.toHaveBeenCalled();
    expect(management.deletingId.value).toBeUndefined();
  });

  it('删除请求失败时保持列表不变并恢复删除状态', async () => {
    rstest.mocked(fetchAdminRoles).mockResolvedValue(createRolePage([createRoleItem(2, 'editor')]));
    rstest.mocked(deleteAdminRole).mockRejectedValue(new Error('角色仍绑定用户'));

    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    await management.handleRoleDelete(createRoleItem(2, 'editor'));

    expect(management.deletingId.value).toBeUndefined();
    expect(fetchAdminRoles).toHaveBeenCalledTimes(1);
    expect(rstest.mocked(ElMessage.success)).not.toHaveBeenCalled();
  });

  it('删除进行中时拒绝重复删除请求', async () => {
    rstest.mocked(fetchAdminRoles).mockResolvedValue(createRolePage([]));
    let resolveDelete!: () => void;
    rstest.mocked(deleteAdminRole).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );

    const [management] = withSetup(() => useRoleManagement());
    await waitForLoadingSettled(management);

    const firstDelete = management.handleRoleDelete(createRoleItem(2, 'editor'));
    await rstest.waitFor(() => expect(management.deletingId.value).toBe(2));

    await management.handleRoleDelete(createRoleItem(3, 'another'));
    expect(deleteAdminRole).toHaveBeenCalledTimes(1);

    resolveDelete();
    await firstDelete;
    expect(management.deletingId.value).toBeUndefined();
  });
});
