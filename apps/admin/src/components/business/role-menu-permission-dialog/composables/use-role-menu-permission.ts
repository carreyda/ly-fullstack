import type { TreeInstance } from 'element-plus';
import type { AdminRoleListItem, AdminRoleMenuTreeNode } from '@repo/shared/types';

import { assignAdminRoleMenus, fetchAdminRole, fetchAdminRoleMenuTree } from '@/api';
import { useDialogSize } from '@/hooks/use-dialog-size';

import type { AdminRoleMenuTreeViewNode } from '@/types';

interface UseRoleMenuPermissionOptions {
  /**
   * 菜单权限保存成功后的页面回调
   */
  onSuccess: () => void;
}

/**
 * 把接口菜单树转换为 Element Plus Tree 可以直接消费的节点
 *
 * @param nodes 后端返回的完整菜单权限树
 * @returns 附加停用状态的递归视图树
 */
const createTreeView = (nodes: AdminRoleMenuTreeNode[], ancestorDisabled = false): AdminRoleMenuTreeViewNode[] => {
  return nodes.map((node) => ({
    ...node,
    disabled: ancestorDisabled || !node.isActive,
    children: createTreeView(node.children, ancestorDisabled || !node.isActive),
  }));
};

/**
 * 计算可以还原非严格关联关系的叶子选中项
 *
 * 后端会保存选中节点的全部父级。如果直接把父级交给非严格 Tree，组件会把所有兄弟节点一起选中；
 * 因此这里只设置没有已选子节点的末端节点，再由 Tree 自动恢复父级全选或半选状态。
 *
 * @param nodes 当前权限树
 * @param selectedIds 后端保存的完整菜单关联集合
 * @returns 需要交给 `setCheckedKeys` 的末端节点主键
 */
const resolveCheckedLeafIds = (nodes: AdminRoleMenuTreeViewNode[], selectedIds: Set<number>): number[] => {
  const checkedIds: number[] = [];

  nodes.forEach((node) => {
    const selectedChildren = node.children.filter((child) => selectedIds.has(child.id));
    if (selectedIds.has(node.id) && !selectedChildren.length && !node.disabled) {
      checkedIds.push(node.id);
    }
    checkedIds.push(...resolveCheckedLeafIds(node.children, selectedIds));
  });

  return checkedIds;
};

/**
 * 管理角色菜单权限弹框的加载、选中还原和保存流程
 *
 * @param options 保存成功后的页面通知
 * @returns 权限树弹框需要的状态和方法
 */
export const useRoleMenuPermission = (options: UseRoleMenuPermissionOptions) => {
  const treeRef = useTemplateRef<TreeInstance>('treeRef');
  const { dialogVisible, dialogHeight, openDialog, closeDialog } = useDialogSize(620);
  const roleId = ref<number>();
  const roleName = ref('');
  const loading = ref(false);
  const submitting = ref(false);
  const menuTree = shallowRef<AdminRoleMenuTreeViewNode[]>([]);
  let requestVersion = 0;

  /**
   * 当前权限弹框标题
   */
  const dialogTitle = computed(() => `分配菜单权限 - ${roleName.value}`);

  /**
   * 打开弹框并并行读取角色详情与最新菜单树
   *
   * @param role 需要分配权限的角色列表项
   */
  const open = async (role: AdminRoleListItem): Promise<void> => {
    const version = ++requestVersion;
    roleId.value = role.id;
    roleName.value = role.name;
    menuTree.value = [];
    openDialog();
    loading.value = true;

    try {
      const [detail, tree] = await Promise.all([fetchAdminRole(role.id), fetchAdminRoleMenuTree()]);
      if (version !== requestVersion) {
        return;
      }

      menuTree.value = createTreeView(tree ?? []);
      await nextTick();
      treeRef.value?.setCheckedKeys(resolveCheckedLeafIds(menuTree.value, new Set(detail.menuIds)), false);
    } catch {
      if (version === requestVersion) {
        menuTree.value = [];
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false;
      }
    }
  };

  /**
   * 保存当前全选和半选节点，确保后端获得完整导航祖先链
   */
  const handleSubmit = async (): Promise<void> => {
    if (submitting.value || !roleId.value) {
      return;
    }

    const checkedKeys = treeRef.value?.getCheckedKeys(false) ?? [];
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() ?? [];
    const menuIds = [...new Set([...checkedKeys, ...halfCheckedKeys])].filter(
      (key): key is number => typeof key === 'number',
    );

    submitting.value = true;
    try {
      await assignAdminRoleMenus(roleId.value, { menuIds });
      closeDialog();
      ElMessage.success('角色菜单权限已更新');
      options.onSuccess();
    } catch {
      // 请求拦截器已经展示服务端错误，保留当前勾选状态供管理员继续调整。
    } finally {
      submitting.value = false;
    }
  };

  const handleCancel = (): void => {
    if (!submitting.value) {
      closeDialog();
    }
  };

  const handleClosed = (): void => {
    requestVersion += 1;
    roleId.value = undefined;
    roleName.value = '';
    menuTree.value = [];
    loading.value = false;
  };

  onBeforeUnmount(() => {
    requestVersion += 1;
  });

  return {
    treeRef,
    dialogVisible,
    dialogHeight,
    dialogTitle,
    loading,
    submitting,
    menuTree,
    open,
    handleCancel,
    handleClosed,
    handleSubmit,
  };
};
