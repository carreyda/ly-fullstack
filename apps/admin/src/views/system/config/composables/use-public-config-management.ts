import { deleteAdminPublicConfig, fetchAdminPublicConfigs } from '@/api';
import { ADMIN_PUBLIC_CONFIG_FILTER_MODEL } from '@/constants';
import { usePagination } from '@/composables/use-pagination';

import type { AdminPublicConfigListItem } from '@repo/shared/types';
import type { AdminPublicConfigFilterModel, DataFilterModel, OperationType } from '@/types';

/**
 * 公共配置列表与删除流程
 */
export const usePublicConfigManagement = () => {
  const deletingId = ref<number>();
  const {
    loading,
    filters,
    itemList,
    total,
    setFilters,
    reload,
    handleSearch,
    handleReset,
    handlePageNumChange,
    handlePageSizeChange,
  } = usePagination<AdminPublicConfigListItem, AdminPublicConfigFilterModel>(
    { defaultFilters: ADMIN_PUBLIC_CONFIG_FILTER_MODEL },
    fetchAdminPublicConfigs,
  );

  const handleFilterUpdate = (value: DataFilterModel): void => {
    setFilters(value as Partial<AdminPublicConfigFilterModel>);
  };

  const handleDelete = async (config: AdminPublicConfigListItem): Promise<void> => {
    if (deletingId.value) return;
    try {
      await ElMessageBox.confirm(`确定删除公共配置“${config.key}”吗？`, '删除公共配置', { type: 'warning' });
    } catch {
      return;
    }
    deletingId.value = config.id;
    try {
      await deleteAdminPublicConfig(config.id);
      ElMessage.success('公共配置已删除');
      if (itemList.value.length === 1 && filters.pageNum > 1) {
        await handlePageNumChange(filters.pageNum - 1);
      } else {
        await reload();
      }
    } finally {
      deletingId.value = undefined;
    }
  };

  const handleFormSuccess = async (operationType: OperationType): Promise<void> => {
    if (operationType === 'add') {
      await handlePageNumChange(1);
      return;
    }
    await reload();
  };

  return {
    loading,
    deletingId,
    filters,
    configList: itemList,
    total,
    handleFilterUpdate,
    handleSearch,
    handleReset,
    handlePageNumChange,
    handlePageSizeChange,
    handleDelete,
    handleFormSuccess,
  };
};
