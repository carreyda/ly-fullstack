import { deleteAdminUser, fetchAdminUsers } from '@/api';
import { ADMIN_USER_FILTER_MODEL } from '@/constants';
import { usePagination } from '@/composables/use-pagination';

import type { AdminUserListItem } from '@repo/shared/types';
import type { AdminUserFilterModel, DataFilterModel, OperationType } from '@/types';

/**
 * 用户管理列表与删除流程
 *
 * 统一组合分页 Composable、筛选模型同步、删除确认和末页回退。页面只负责表格渲染与打开业务弹框，
 * 不直接编排请求状态。
 */
export const useUserManagement = () => {
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
  } = usePagination<AdminUserListItem, AdminUserFilterModel>(
    { defaultFilters: ADMIN_USER_FILTER_MODEL },
    fetchAdminUsers,
  );

  /**
   * 接收筛选面板更新并保持分页参数不变
   *
   * @param value 筛选面板提交的关键词、状态和角色
   */
  const handleFilterUpdate = (value: DataFilterModel): void => {
    setFilters(value as Partial<AdminUserFilterModel>);
  };

  /**
   * 删除普通后台用户
   *
   * @param user 需要删除的用户列表记录
   */
  const handleUserDelete = async (user: AdminUserListItem): Promise<void> => {
    if (user.isSystem || deletingId.value) {
      return;
    }

    try {
      await ElMessageBox.confirm(`确定删除用户“${user.displayName || user.username}”吗？`, '删除用户', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
    } catch {
      return;
    }

    deletingId.value = user.id;
    try {
      await deleteAdminUser(user.id);
      ElMessage.success('用户已删除');

      if (itemList.value.length === 1 && filters.pageNum > 1) {
        await handlePageNumChange(filters.pageNum - 1);
      } else {
        await reload();
      }
    } catch {
      // 请求拦截器已经展示服务端保护或网络错误，当前列表保持不变。
    } finally {
      deletingId.value = undefined;
    }
  };

  /**
   * 用户表单保存成功后刷新合理分页
   *
   * @param operationType 新增或编辑操作
   */
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
    userList: itemList,
    total,
    reload,
    handleFilterUpdate,
    handleSearch,
    handleReset,
    handlePageNumChange,
    handlePageSizeChange,
    handleUserDelete,
    handleFormSuccess,
  };
};
