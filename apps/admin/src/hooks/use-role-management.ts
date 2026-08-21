import { deleteAdminRole, fetchAdminRoles } from '@/api';
import { ADMIN_ROLE_FILTER_MODEL } from '@/constants';
import { usePagination } from '@/hooks/use-pagination';

import type { AdminRoleListItem } from '@repo/shared/types';
import type { AdminRoleFilterModel, DataFilterModel, OperationType } from '@/types';

/**
 * 角色管理列表与删除流程
 *
 * 统一组合分页 Hook、筛选模型同步、删除确认和末页回退。页面只负责表格渲染与打开业务弹框，
 * 不直接编排请求状态。
 */
export const useRoleManagement = () => {
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
  } = usePagination<AdminRoleListItem, AdminRoleFilterModel>(
    { defaultFilters: ADMIN_ROLE_FILTER_MODEL },
    fetchAdminRoles,
  );

  /**
   * 接收筛选面板更新并保持分页参数不变
   *
   * @param value 筛选面板提交的关键词和状态
   */
  const handleFilterUpdate = (value: DataFilterModel): void => {
    setFilters(value as Partial<AdminRoleFilterModel>);
  };

  /**
   * 删除没有绑定用户的普通角色
   *
   * 最后一条记录被删除时自动回到上一页，避免停留在超出总页数的空分页。
   *
   * @param role 需要删除的角色列表记录
   */
  const handleRoleDelete = async (role: AdminRoleListItem): Promise<void> => {
    if (role.isSystem || deletingId.value) {
      return;
    }

    try {
      await ElMessageBox.confirm(`确定删除角色“${role.name}”吗？`, '删除角色', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
    } catch {
      return;
    }

    deletingId.value = role.id;
    try {
      await deleteAdminRole(role.id);
      ElMessage.success('角色已删除');

      if (itemList.value.length === 1 && filters.pageNum > 1) {
        await handlePageNumChange(filters.pageNum - 1);
      } else {
        await reload();
      }
    } catch {
      // 请求拦截器已经展示删除保护或网络错误，当前列表保持不变。
    } finally {
      deletingId.value = undefined;
    }
  };

  /**
   * 角色表单保存成功后刷新合理分页
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
    roleList: itemList,
    total,
    reload,
    handleFilterUpdate,
    handleSearch,
    handleReset,
    handlePageNumChange,
    handlePageSizeChange,
    handleRoleDelete,
    handleFormSuccess,
  };
};
