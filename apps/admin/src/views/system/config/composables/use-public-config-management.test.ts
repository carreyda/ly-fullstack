import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import { deleteAdminPublicConfig, fetchAdminPublicConfigs } from '@/api';
import { withSetup } from '@tests/with-setup';
import { usePublicConfigManagement } from './use-public-config-management';

import type { MessageBoxData } from 'element-plus';
import type { AdminPublicConfigListItem, PaginationResult } from '@repo/shared/types';

rstest.mock('@/api', () => ({
  fetchAdminPublicConfigs: rstest.fn(),
  deleteAdminPublicConfig: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
  ElMessageBox: { confirm: rstest.fn() },
}));

const createConfig = (): AdminPublicConfigListItem => ({
  id: 1,
  key: 'site.name',
  value: 'LY Fullstack',
  description: '站点名称',
  createdAt: '2026-08-24T00:00:00.000Z',
  updatedAt: '2026-08-24T00:00:00.000Z',
});

const createPage = (list: AdminPublicConfigListItem[]): PaginationResult<AdminPublicConfigListItem> => ({
  list,
  total: list.length,
  pageNum: 1,
  pageSize: 20,
});

describe('公共配置管理列表流程', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
    rstest.mocked(ElMessageBox.confirm).mockResolvedValue({} as MessageBoxData);
  });

  it('挂载后加载公共配置列表', async () => {
    rstest.mocked(fetchAdminPublicConfigs).mockResolvedValue(createPage([createConfig()]));

    const [management] = withSetup(() => usePublicConfigManagement());
    await rstest.waitFor(() => expect(management.loading.value).toBe(false));

    expect(fetchAdminPublicConfigs).toHaveBeenCalledWith({ pageNum: 1, pageSize: 20 });
    expect(management.configList.value[0]?.key).toBe('site.name');
  });

  it('确认删除后调用接口并刷新列表', async () => {
    rstest.mocked(fetchAdminPublicConfigs).mockResolvedValue(createPage([createConfig()]));
    rstest.mocked(deleteAdminPublicConfig).mockResolvedValue();
    const [management] = withSetup(() => usePublicConfigManagement());
    await rstest.waitFor(() => expect(management.loading.value).toBe(false));

    await management.handleDelete(createConfig());

    expect(deleteAdminPublicConfig).toHaveBeenCalledWith(1);
    expect(fetchAdminPublicConfigs).toHaveBeenCalledTimes(2);
  });
});
