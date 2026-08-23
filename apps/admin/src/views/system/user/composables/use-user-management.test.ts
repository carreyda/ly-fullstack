import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import { deleteAdminUser, fetchAdminUsers } from '@/api';
import { withSetup } from '@/testing/with-setup';
import { useUserManagement } from './use-user-management';

import type { MessageBoxData } from 'element-plus';
import type { AdminUserListItem, PaginationResult } from '@repo/shared/types';

rstest.mock('@/api', () => ({
  fetchAdminUsers: rstest.fn(),
  deleteAdminUser: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
  ElMessageBox: { confirm: rstest.fn() },
}));

/**
 * 构造用户列表记录夹具
 *
 * @param id 用户主键
 * @param username 登录名
 * @param overrides 需要覆盖的字段
 * @returns 满足 Shared 契约的用户记录
 */
const createUserItem = (
  id: number,
  username: string,
  overrides: Partial<AdminUserListItem> = {},
): AdminUserListItem => {
  return {
    id,
    username,
    displayName: `用户${id}`,
    isActive: true,
    isSystem: false,
    roles: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
};

/**
 * 构造用户分页结果夹具
 *
 * @param list 当前页记录
 * @param pageNum 当前页码
 * @returns 分页接口的标准返回结构
 */
const createUserPage = (list: AdminUserListItem[], pageNum = 1): PaginationResult<AdminUserListItem> => {
  return { list, total: 30, pageNum, pageSize: 20 };
};

/**
 * 构造可在外部手动决议的 Promise
 *
 * 用于把删除请求卡在进行中状态，验证 Composable 的重复提交保护。
 */
interface ManualDeferred {
  /**
   * 尚未决议的请求 Promise
   */
  promise: Promise<void>;

  /**
   * 决议请求 Promise 的外部句柄
   */
  resolve: () => void;
}

const createManualDeferred = (): ManualDeferred => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

/**
 * 等待当前列表请求结束
 *
 * @param management 被测 Composable 返回值
 */
const waitForLoadingSettled = async (management: ReturnType<typeof useUserManagement>): Promise<void> => {
  await rstest.waitFor(() => expect(management.loading.value).toBe(false));
};

describe('用户管理列表流程', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
    rstest.mocked(ElMessageBox.confirm).mockResolvedValue({} as MessageBoxData);
  });

  it('挂载后自动加载第一页并写入列表与总数', async () => {
    const page = createUserPage([createUserItem(2, 'operator'), createUserItem(1, 'admin')]);
    rstest.mocked(fetchAdminUsers).mockResolvedValue(page);

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    // 空字符串与 undefined 筛选字段不进入查询参数
    expect(fetchAdminUsers).toHaveBeenCalledWith({ pageNum: 1, pageSize: 20 });
    expect(management.userList.value).toEqual(page.list);
    expect(management.total.value).toBe(30);
  });

  it('首次加载失败时清零总数且列表保持为空', async () => {
    rstest.mocked(fetchAdminUsers).mockRejectedValue(new Error('网络连接失败'));

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    expect(management.userList.value).toEqual([]);
    expect(management.total.value).toBe(0);
  });

  it('筛选提交后查询回到第一页并携带筛选条件', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([]));
    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handlePageNumChange(3);
    management.handleFilterUpdate({ keyword: 'admin', status: 'ACTIVE' });
    await management.handleSearch();

    expect(rstest.mocked(fetchAdminUsers)).toHaveBeenLastCalledWith({
      pageNum: 1,
      pageSize: 20,
      keyword: 'admin',
      status: 'ACTIVE',
    });
  });

  it('切换每页数量后回到第一页，重置筛选后恢复默认参数', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([]));
    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    management.handleFilterUpdate({ keyword: 'admin' });
    await management.handlePageSizeChange(50);
    expect(rstest.mocked(fetchAdminUsers)).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 50, keyword: 'admin' });

    await management.handleReset();
    expect(rstest.mocked(fetchAdminUsers)).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 20 });
  });

  it('新增成功后回到第一页，编辑成功后刷新当前页', async () => {
    // 回显分页参数，避免固定夹具把页码重置回第一页导致断言失真
    rstest.mocked(fetchAdminUsers).mockImplementation(async (params) => {
      return { list: [], total: 0, pageNum: params.pageNum, pageSize: params.pageSize };
    });
    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handlePageNumChange(3);
    await management.handleFormSuccess('add');
    expect(rstest.mocked(fetchAdminUsers)).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 20 });

    await management.handlePageNumChange(3);
    await management.handleFormSuccess('edit');
    expect(rstest.mocked(fetchAdminUsers)).toHaveBeenLastCalledWith({ pageNum: 3, pageSize: 20 });
  });

  it('删除确认被取消时不发起删除请求', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([createUserItem(2, 'operator')]));
    rstest.mocked(ElMessageBox.confirm).mockRejectedValue(new Error('cancel'));

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handleUserDelete(createUserItem(2, 'operator'));

    expect(deleteAdminUser).not.toHaveBeenCalled();
    expect(management.deletingId.value).toBeUndefined();
  });

  it('系统内置用户不进入删除流程', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([]));

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handleUserDelete(createUserItem(1, 'admin', { isSystem: true }));

    expect(ElMessageBox.confirm).not.toHaveBeenCalled();
    expect(deleteAdminUser).not.toHaveBeenCalled();
  });

  it('删除成功后刷新当前页并恢复删除状态', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([createUserItem(2, 'operator')]));
    rstest.mocked(deleteAdminUser).mockResolvedValue(undefined);

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handleUserDelete(createUserItem(2, 'operator'));

    expect(deleteAdminUser).toHaveBeenCalledWith(2);
    expect(rstest.mocked(ElMessage.success)).toHaveBeenCalledWith('用户已删除');
    expect(management.deletingId.value).toBeUndefined();
    expect(fetchAdminUsers).toHaveBeenCalledTimes(2);
  });

  it('删除当前页最后一条且不在第一页时回退上一页', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([createUserItem(41, 'operator')], 3));
    rstest.mocked(deleteAdminUser).mockResolvedValue(undefined);

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handleUserDelete(createUserItem(41, 'operator'));

    expect(rstest.mocked(fetchAdminUsers)).toHaveBeenLastCalledWith({ pageNum: 2, pageSize: 20 });
  });

  it('删除请求失败时保持列表不变并恢复删除状态', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([createUserItem(2, 'operator')]));
    rstest.mocked(deleteAdminUser).mockRejectedValue(new Error('存在关联数据'));

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    await management.handleUserDelete(createUserItem(2, 'operator'));

    expect(management.deletingId.value).toBeUndefined();
    // 删除失败不触发刷新，当前列表保持不变
    expect(fetchAdminUsers).toHaveBeenCalledTimes(1);
    expect(rstest.mocked(ElMessage.success)).not.toHaveBeenCalled();
  });

  it('删除进行中时拒绝重复删除请求', async () => {
    rstest.mocked(fetchAdminUsers).mockResolvedValue(createUserPage([]));
    const deferred = createManualDeferred();
    rstest.mocked(deleteAdminUser).mockReturnValueOnce(deferred.promise);

    const [management] = withSetup(() => useUserManagement());
    await waitForLoadingSettled(management);

    const firstDelete = management.handleUserDelete(createUserItem(2, 'operator'));
    await rstest.waitFor(() => expect(management.deletingId.value).toBe(2));

    await management.handleUserDelete(createUserItem(3, 'another'));
    expect(deleteAdminUser).toHaveBeenCalledTimes(1);

    deferred.resolve();
    await firstDelete;
    expect(management.deletingId.value).toBeUndefined();
  });
});
