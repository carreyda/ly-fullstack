import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import { deleteAdminDictionary, fetchAdminDictionaries } from '@/api';
import { withSetup } from '@tests/with-setup';
import { useDictionaryManagement } from './use-dictionary-management';

import type { MessageBoxData } from 'element-plus';
import type { AdminDictionaryListItem, PaginationResult } from '@repo/shared/types';

rstest.mock('@/api', () => ({
  fetchAdminDictionaries: rstest.fn(),
  deleteAdminDictionary: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
  ElMessageBox: { confirm: rstest.fn() },
}));

const createDictionary = (): AdminDictionaryListItem => ({
  id: 1,
  code: 'user_gender',
  name: '用户性别',
  description: null,
  isActive: true,
  itemCount: 2,
  createdAt: '2026-08-24T00:00:00.000Z',
  updatedAt: '2026-08-24T00:00:00.000Z',
});

const createPage = (list: AdminDictionaryListItem[]): PaginationResult<AdminDictionaryListItem> => ({
  list,
  total: list.length,
  pageNum: 1,
  pageSize: 20,
});

describe('字典管理列表流程', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
    rstest.mocked(ElMessageBox.confirm).mockResolvedValue({} as MessageBoxData);
  });

  it('挂载后加载字典列表', async () => {
    rstest.mocked(fetchAdminDictionaries).mockResolvedValue(createPage([createDictionary()]));

    const [management] = withSetup(() => useDictionaryManagement());
    await rstest.waitFor(() => expect(management.loading.value).toBe(false));

    expect(fetchAdminDictionaries).toHaveBeenCalledWith({ pageNum: 1, pageSize: 20 });
    expect(management.dictionaryList.value[0]?.itemCount).toBe(2);
  });

  it('删除成功后刷新列表并恢复删除状态', async () => {
    rstest.mocked(fetchAdminDictionaries).mockResolvedValue(createPage([createDictionary()]));
    rstest.mocked(deleteAdminDictionary).mockResolvedValue();
    const [management] = withSetup(() => useDictionaryManagement());
    await rstest.waitFor(() => expect(management.loading.value).toBe(false));

    await management.handleDictionaryDelete(createDictionary());

    expect(deleteAdminDictionary).toHaveBeenCalledWith(1);
    expect(fetchAdminDictionaries).toHaveBeenCalledTimes(2);
    expect(management.deletingId.value).toBeUndefined();
  });
});
