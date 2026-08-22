import { assignAdminUserRoles, fetchAdminUserRoleOptions } from '@/api';

import type { AdminUserListItem, AdminUserRoleOption } from '@repo/shared/types';
import type { UseUserRoleOptions } from '@/types';

/**
 * 管理普通用户角色分配弹框状态
 *
 * @param options 保存成功后的页面通知
 * @returns 角色选项、选中值和提交方法
 */
export const useUserRole = (options: UseUserRoleOptions) => {
  const dialogVisible = ref(false);
  const loading = ref(false);
  const submitting = ref(false);
  const targetUser = shallowRef<AdminUserListItem>();
  const roleOptions = shallowRef<AdminUserRoleOption[]>([]);
  const selectedRoleIds = ref<number[]>([]);
  let loadVersion = 0;

  /**
   * 打开用户角色弹框并加载最新可选角色
   *
   * @param user 当前用户列表记录
   */
  const open = async (user: AdminUserListItem): Promise<void> => {
    if (user.isSystem) {
      return;
    }

    const version = ++loadVersion;
    targetUser.value = user;
    selectedRoleIds.value = user.roles.map((role) => role.id);
    dialogVisible.value = true;
    loading.value = true;

    try {
      const optionsData = await fetchAdminUserRoleOptions();
      if (version === loadVersion) {
        roleOptions.value = optionsData.filter((role) => role.isActive && !role.isSystem);
        const assignableRoleIds = new Set(roleOptions.value.map((role) => role.id));
        selectedRoleIds.value = user.roles.map((role) => role.id).filter((roleId) => assignableRoleIds.has(roleId));
      }
    } catch {
      // 请求拦截器已展示错误，弹框保留并允许管理员重试打开。
    } finally {
      if (version === loadVersion) {
        loading.value = false;
      }
    }
  };

  /**
   * 保存目标用户的完整角色集合
   */
  const handleSubmit = async (): Promise<void> => {
    const user = targetUser.value;
    if (!user || submitting.value || loading.value) {
      return;
    }

    submitting.value = true;
    try {
      await assignAdminUserRoles(user.id, { roleIds: selectedRoleIds.value });
      dialogVisible.value = false;
      ElMessage.success('用户角色已更新');
      options.onSuccess();
    } catch {
      // 请求拦截器已经展示服务端保护或网络错误，保留当前选择供管理员重试。
    } finally {
      submitting.value = false;
    }
  };

  const handleCancel = (): void => {
    if (!submitting.value) {
      dialogVisible.value = false;
    }
  };

  onBeforeUnmount(() => {
    loadVersion += 1;
  });

  return {
    dialogVisible,
    loading,
    submitting,
    targetUser,
    roleOptions,
    selectedRoleIds,
    open,
    handleCancel,
    handleSubmit,
  };
};
