import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import { deleteAdminDictionaryItem, fetchAdminDictionaryItems } from '@/api';
import { createDeferred } from '@tests/deferred';
import { withSetup } from '@tests/with-setup';
import { useDictionaryItems } from './use-dictionary-items';

import type { MessageBoxData } from 'element-plus';
import type { AdminDictionaryItemListItem, AdminDictionaryListItem, PaginationResult } from '@repo/shared/types';

rstest.mock('@/api', () => ({
  createAdminDictionaryItem: rstest.fn(),
  deleteAdminDictionaryItem: rstest.fn(),
  fetchAdminDictionaryItems: rstest.fn(),
  updateAdminDictionaryItem: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
  ElMessageBox: { confirm: rstest.fn() },
}));

/**
 * 构造字典列表夹具
 *
 * @param id 字典主键
 * @returns 可以传给弹框 open 方法的字典记录
 */
const createDictionary = (id: number): AdminDictionaryListItem => ({
  id,
  name: `字典 ${id}`,
  code: `dictionary_${id}`,
  description: null,
  isActive: true,
  itemCount: 1,
  createdAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
});

/**
 * 构造字典项夹具
 *
 * @param id 字典项主键
 * @returns 字典项列表记录
 */
const createItem = (id: number): AdminDictionaryItemListItem => ({
  id,
  dictionaryId: 1,
  label: `选项 ${id}`,
  value: `item_${id}`,
  description: null,
  sortOrder: id,
  isActive: true,
  createdAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
});

/**
 * 构造分页响应
 *
 * @param item 字典项记录
 * @returns 只包含目标记录的分页结果
 */
const createPage = (item: AdminDictionaryItemListItem): PaginationResult<AdminDictionaryItemListItem> => ({
  list: [item],
  total: 1,
  pageNum: 1,
  pageSize: 20,
});

describe('字典项弹框流程', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
    rstest.mocked(ElMessageBox.confirm).mockResolvedValue({} as MessageBoxData);
  });

  it('快速切换字典时只应用最后一次列表响应', async () => {
    const firstRequest = createDeferred<PaginationResult<AdminDictionaryItemListItem>>();
    const secondRequest = createDeferred<PaginationResult<AdminDictionaryItemListItem>>();
    rstest
      .mocked(fetchAdminDictionaryItems)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const [management] = withSetup(() => useDictionaryItems());
    management.open(createDictionary(1));
    management.open(createDictionary(2));

    secondRequest.resolve(createPage(createItem(2)));
    await rstest.waitFor(() => expect(management.itemList.value[0]?.id).toBe(2));

    firstRequest.resolve(createPage(createItem(1)));
    await firstRequest.promise;

    expect(management.itemList.value[0]?.id).toBe(2);
    expect(management.loading.value).toBe(false);
  });

  it('关闭弹框后忽略仍在途中的列表响应', async () => {
    const request = createDeferred<PaginationResult<AdminDictionaryItemListItem>>();
    rstest.mocked(fetchAdminDictionaryItems).mockReturnValue(request.promise);

    const [management] = withSetup(() => useDictionaryItems());
    management.open(createDictionary(1));
    management.handleClosed();
    request.resolve(createPage(createItem(1)));
    await request.promise;

    expect(management.itemList.value).toEqual([]);
    expect(management.loading.value).toBe(false);
  });

  it('列表加载失败时结束 Loading 并保留已有数据', async () => {
    rstest
      .mocked(fetchAdminDictionaryItems)
      .mockResolvedValueOnce(createPage(createItem(1)))
      .mockRejectedValueOnce(new Error('网络异常'));

    const [management] = withSetup(() => useDictionaryItems());
    management.open(createDictionary(1));
    await rstest.waitFor(() => expect(management.itemList.value[0]?.id).toBe(1));

    await expect(management.loadItems()).resolves.toBeUndefined();

    expect(management.itemList.value[0]?.id).toBe(1);
    expect(management.loading.value).toBe(false);
  });

  it('删除失败时恢复按钮状态且不刷新列表', async () => {
    rstest.mocked(fetchAdminDictionaryItems).mockResolvedValue(createPage(createItem(1)));
    rstest.mocked(deleteAdminDictionaryItem).mockRejectedValue(new Error('删除失败'));

    const [management] = withSetup(() => useDictionaryItems());
    management.open(createDictionary(1));
    await rstest.waitFor(() => expect(management.loading.value).toBe(false));

    await expect(management.handleDelete(createItem(1))).resolves.toBeUndefined();

    expect(deleteAdminDictionaryItem).toHaveBeenCalledWith(1, 1);
    expect(fetchAdminDictionaryItems).toHaveBeenCalledTimes(1);
    expect(management.deletingId.value).toBeUndefined();
    expect(ElMessage.success).not.toHaveBeenCalled();
  });
});
