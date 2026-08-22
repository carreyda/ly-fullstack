import {
  createAdminMenu,
  createStandardMenuPermissions,
  deleteAdminMenu,
  fetchAdminMenuTree,
  reorderAdminMenus,
  updateAdminMenu,
} from '@/api';
import { useAuthStore } from '@/stores';

import type { AdminMenuReorderItem, AdminMenuTreeNode, CreateAdminMenuParams } from '@repo/shared/types';
import type { AdminMenuCreateContext, AdminMenuEditorModel } from '@/types';

/**
 * 在完整菜单树中查找指定节点
 *
 * @param nodes 当前层级菜单节点
 * @param id 需要查找的菜单主键
 * @returns 找到的菜单节点；不存在时返回 `undefined`
 */
const findMenuNode = (nodes: AdminMenuTreeNode[], id: number): AdminMenuTreeNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const child = findMenuNode(node.children, id);
    if (child) {
      return child;
    }
  }

  return undefined;
};

/**
 * 把后端菜单节点转换为属性面板可编辑模型
 *
 * @param node 后端完整菜单节点
 * @returns 不包含子节点和排序字段的表单模型
 */
const createEditorModel = (node: AdminMenuTreeNode): AdminMenuEditorModel => ({
  id: node.id,
  parentId: node.parentId,
  name: node.name,
  type: node.type,
  routePath: node.routePath,
  routeName: node.routeName,
  component: node.component,
  icon: node.icon,
  permissionCode: node.permissionCode,
  isVisible: node.isVisible,
  isActive: node.isActive,
});

/**
 * 把属性面板模型转换为新增或编辑接口参数
 *
 * @param model 已通过 Element Plus 表单校验的编辑模型
 * @returns 不包含数据库主键的 Shared 菜单参数
 */
const createMutationParams = (model: AdminMenuEditorModel): CreateAdminMenuParams => ({
  parentId: model.parentId,
  name: model.name,
  type: model.type,
  routePath: model.routePath,
  routeName: model.routeName,
  component: model.component,
  icon: model.icon,
  permissionCode: model.permissionCode,
  isVisible: model.isVisible,
  isActive: model.isActive,
});

/**
 * 菜单管理页面状态与业务流程
 *
 * 统一负责树加载、节点选择、CRUD、拖拽排序、标准权限生成和侧边栏会话刷新。页面组件只组合左右
 * 面板，不直接持有请求竞态和防重复提交细节。
 */
export const useMenuManagement = () => {
  const authStore = useAuthStore();
  const menus = shallowRef<AdminMenuTreeNode[]>([]);
  const selectedId = ref<number>();
  const editorModel = ref<AdminMenuEditorModel | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  let requestVersion = 0;

  /**
   * 当前属性面板对应的完整数据库菜单节点
   */
  const selectedNode = computed(() => {
    return selectedId.value ? findMenuNode(menus.value, selectedId.value) : undefined;
  });

  /**
   * 当前页面菜单下集中展示的按钮权限
   */
  const permissions = computed(() => {
    return selectedNode.value?.children.filter((node) => node.type === 'BUTTON') ?? [];
  });

  /**
   * 选择已有节点并用数据库最新数据重置属性面板
   *
   * @param id 菜单主键
   */
  const selectMenu = (id: number): void => {
    const node = findMenuNode(menus.value, id);
    if (!node) {
      return;
    }

    selectedId.value = id;
    editorModel.value = createEditorModel(node);
  };

  /**
   * 获取菜单树并恢复合理的选中节点
   *
   * 版本号防止快速刷新时旧请求覆盖新树；空数据时清理属性面板，不保留已经不存在的节点。
   *
   * @param preferredId CRUD 完成后希望继续选中的菜单主键
   */
  const loadMenus = async (preferredId?: number): Promise<void> => {
    const version = ++requestVersion;
    loading.value = true;

    try {
      const result = await fetchAdminMenuTree();
      if (version !== requestVersion) {
        return;
      }

      menus.value = result ?? [];
      const targetId = preferredId ?? selectedId.value ?? menus.value[0]?.id;
      const target = targetId ? findMenuNode(menus.value, targetId) : undefined;

      if (target) {
        selectMenu(target.id);
      } else {
        selectedId.value = undefined;
        editorModel.value = null;
      }
    } catch {
      if (version === requestVersion && !menus.value.length) {
        editorModel.value = null;
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false;
      }
    }
  };

  /**
   * 打开新增目录或页面的空白属性面板
   *
   * @param context 左侧树提供的父节点和新节点类型
   */
  const createMenuDraft = (context: AdminMenuCreateContext): void => {
    selectedId.value = undefined;
    editorModel.value = {
      parentId: context.parentId,
      name: '',
      type: context.type,
      routePath: null,
      routeName: null,
      component: null,
      icon: null,
      permissionCode: null,
      isVisible: true,
      isActive: true,
    };
  };

  /**
   * 保存新增或编辑菜单并刷新树与当前登录会话
   *
   * @param model 属性面板提交的完整模型
   */
  const saveMenu = async (model: AdminMenuEditorModel): Promise<void> => {
    if (saving.value) {
      return;
    }

    saving.value = true;
    try {
      const params = createMutationParams(model);
      const saved = model.id ? await updateAdminMenu(model.id, params) : await createAdminMenu(params);

      await loadMenus(saved.id);
      await authStore.restoreSession();
      ElMessage.success(model.id ? '菜单已更新' : '菜单已创建');
    } catch {
      // 请求拦截器已经展示服务端错误，Composable 只负责阻止事件 Promise 形成未处理拒绝。
    } finally {
      saving.value = false;
    }
  };

  /**
   * 删除指定菜单节点并恢复父节点选择
   *
   * @param id 菜单或按钮权限主键
   */
  const removeMenu = async (id: number): Promise<void> => {
    if (saving.value) {
      return;
    }

    const node = findMenuNode(menus.value, id);
    if (!node) {
      return;
    }

    try {
      await ElMessageBox.confirm(`确定删除“${node.name}”吗？`, '删除菜单', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
    } catch {
      return;
    }

    saving.value = true;
    try {
      await deleteAdminMenu(id);
      await loadMenus(node.parentId ?? undefined);
      await authStore.restoreSession();
      ElMessage.success('菜单已删除');
    } catch {
      // 请求拦截器已经展示服务端错误，保留当前树供用户修正子节点或权限关系。
    } finally {
      saving.value = false;
    }
  };

  /**
   * 保存拖拽排序并在失败时恢复服务端菜单树
   *
   * @param items 全部非按钮节点的最终位置快照
   */
  const saveMenuOrder = async (items: AdminMenuReorderItem[]): Promise<void> => {
    if (saving.value) {
      await loadMenus(selectedId.value);
      return;
    }

    saving.value = true;
    try {
      await reorderAdminMenus({ items });
      await loadMenus(selectedId.value);
      await authStore.restoreSession();
      ElMessage.success('菜单顺序已保存');
    } catch {
      await loadMenus(selectedId.value);
    } finally {
      saving.value = false;
    }
  };

  /**
   * 为页面菜单补齐标准 CRUD 权限
   *
   * @param id 页面菜单主键
   * @param permissionPrefix 两段式权限前缀
   */
  const generateStandardPermissions = async (id: number, permissionPrefix: `${string}:${string}`): Promise<void> => {
    if (saving.value) {
      return;
    }

    saving.value = true;
    try {
      const result = await createStandardMenuPermissions(id, { permissionPrefix });
      await loadMenus(id);
      await authStore.restoreSession();
      ElMessage.success(result.createdCount ? `已新增 ${result.createdCount} 个标准权限` : '标准权限已经齐全');
    } catch {
      // 请求拦截器已经展示服务端错误，属性面板保持当前页面，允许用户调整绑定后重试。
    } finally {
      saving.value = false;
    }
  };

  /**
   * 取消新增时关闭空白面板，取消编辑时恢复数据库最新值
   */
  const cancelEdit = (): void => {
    if (selectedId.value) {
      selectMenu(selectedId.value);
    } else {
      editorModel.value = null;
    }
  };

  onMounted(() => {
    void loadMenus();
  });

  onUnmounted(() => {
    requestVersion += 1;
  });

  return {
    menus,
    selectedId,
    editorModel,
    permissions,
    loading,
    saving,
    selectMenu,
    createMenuDraft,
    saveMenu,
    removeMenu,
    saveMenuOrder,
    generateStandardPermissions,
    cancelEdit,
  };
};
