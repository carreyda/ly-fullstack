import { deleteAdminDictionary, fetchAdminDictionaries } from '@/api';
import { ADMIN_DICTIONARY_FILTER_MODEL } from '@/constants';
import { usePagination } from '@/composables/use-pagination';

import type { AdminDictionaryListItem } from '@repo/shared/types';
import type { AdminDictionaryFilterModel, DataFilterModel, OperationType } from '@/types';

/**
 * 字典管理列表与删除流程
 */
export const useDictionaryManagement = () => {
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
  } = usePagination<AdminDictionaryListItem, AdminDictionaryFilterModel>(
    { defaultFilters: ADMIN_DICTIONARY_FILTER_MODEL },
    fetchAdminDictionaries,
  );

  const handleFilterUpdate = (value: DataFilterModel): void => {
    setFilters(value as Partial<AdminDictionaryFilterModel>);
  };

  const handleDictionaryDelete = async (dictionary: AdminDictionaryListItem): Promise<void> => {
    if (deletingId.value) {
      return;
    }
    try {
      await ElMessageBox.confirm(`确定删除字典“${dictionary.name}”吗？`, '删除字典', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
    } catch {
      return;
    }
    deletingId.value = dictionary.id;
    try {
      await deleteAdminDictionary(dictionary.id);
      ElMessage.success('字典已删除');
      if (itemList.value.length === 1 && filters.pageNum > 1) {
        await handlePageNumChange(filters.pageNum - 1);
      } else {
        await reload();
      }
    } catch {
      // 请求拦截器已经展示字典删除保护或网络错误。
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
    dictionaryList: itemList,
    total,
    reload,
    handleFilterUpdate,
    handleSearch,
    handleReset,
    handlePageNumChange,
    handlePageSizeChange,
    handleDictionaryDelete,
    handleFormSuccess,
  };
};
