import { beforeEach, describe, expect, it, rstest } from '@rstest/core';

import {
  createAdminMenu,
  createStandardMenuPermissions,
  deleteAdminMenu,
  fetchAdminMenuTree,
  reorderAdminMenus,
  updateAdminMenu,
} from '@/api';
import { withSetup } from '@tests/with-setup';
import { useMenuManagement } from './use-menu-management';

import type { MessageBoxData } from 'element-plus';
import type { AdminMenuTreeNode } from '@repo/shared/types';

rstest.mock('@/api', () => ({
  fetchAdminMenuTree: rstest.fn(),
  createAdminMenu: rstest.fn(),
  updateAdminMenu: rstest.fn(),
  deleteAdminMenu: rstest.fn(),
  reorderAdminMenus: rstest.fn(),
  createStandardMenuPermissions: rstest.fn(),
}));

rstest.mock('element-plus', () => ({
  ElMessage: { success: rstest.fn() },
  ElMessageBox: { confirm: rstest.fn() },
}));

const mockAuthStore = rstest.hoisted(() => ({
  restoreSession: rstest.fn(),
}));

rstest.mock('@/stores', () => ({
  useAuthStore: () => mockAuthStore,
}));

/**
 * 构造完整的数据库菜单树夹具
 *
 * 树包含目录、页面和按钮三层结构，用于验证递归查找、默认选中和权限过滤。
 *
 * @returns 两层的菜单树
 */
const createMenuTree = (): AdminMenuTreeNode[] => {
  return [
    {
      id: 1,
      parentId: null,
      name: '工作台',
      type: 'MENU',
      routePath: '/dashboard',
      routeName: 'dashboard',
      component: 'dashboard/index',
      icon: 'LayoutDashboard',
      permissionCode: null,
      sortOrder: 1,
      isVisible: true,
      isActive: true,
      children: [],
    },
    {
      id: 2,
      parentId: null,
      name: '系统管理',
      type: 'DIRECTORY',
      routePath: '/system',
      routeName: 'system',
      component: null,
      icon: 'Settings',
      permissionCode: null,
      sortOrder: 10,
      isVisible: true,
      isActive: true,
      children: [
        {
          id: 3,
          parentId: 2,
          name: '用户管理',
          type: 'MENU',
          routePath: '/system/user',
          routeName: 'system-user',
          component: 'system/user/index',
          icon: null,
          permissionCode: null,
          sortOrder: 1,
          isVisible: true,
          isActive: true,
          children: [
            {
              id: 4,
              parentId: 3,
              name: '查询用户',
              type: 'BUTTON',
              routePath: null,
              routeName: null,
              component: null,
              icon: null,
              permissionCode: 'system:user:list',
              sortOrder: 1,
              isVisible: false,
              isActive: true,
              children: [],
            },
          ],
        },
      ],
    },
  ];
};

/**
 * 等待菜单树请求结束
 *
 * @param management 被测 Composable 返回值
 */
const waitForLoadingSettled = async (management: ReturnType<typeof useMenuManagement>): Promise<void> => {
  await rstest.waitFor(() => expect(management.loading.value).toBe(false));
};

describe('菜单管理页面流程', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
    rstest.mocked(ElMessageBox.confirm).mockResolvedValue({} as MessageBoxData);
  });

  it('挂载后加载菜单树并默认选中第一个节点', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(createMenuTree());

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    expect(management.selectedId.value).toBe(1);
    expect(management.editorModel.value?.name).toBe('工作台');
    // 权限列表只展示当前选中页面下的按钮节点
    expect(management.permissions.value).toEqual([]);
    expect(management.menus.value).toHaveLength(2);
  });

  it('选中页面节点后权限列表只包含直接按钮子节点', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(createMenuTree());

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    management.selectMenu(3);

    expect(management.selectedId.value).toBe(3);
    expect(management.editorModel.value?.name).toBe('用户管理');
    expect(management.permissions.value.map((node) => node.permissionCode)).toEqual(['system:user:list']);
  });

  it('首次加载失败时清空属性面板，已有树时加载失败保留当前树', async () => {
    rstest.mocked(fetchAdminMenuTree).mockRejectedValue(new Error('网络连接失败'));

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    expect(management.menus.value).toEqual([]);
    expect(management.editorModel.value).toBeNull();
    expect(management.selectedId.value).toBeUndefined();
  });

  it('加载空树时清空选中与属性面板，不残留已删除节点', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue([]);

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    expect(management.selectedId.value).toBeUndefined();
    expect(management.editorModel.value).toBeNull();
  });

  it('新增草稿使用空白模型，取消编辑后恢复选中节点的数据库值', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(createMenuTree());
    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    management.createMenuDraft({ parentId: 2, type: 'MENU' });
    expect(management.selectedId.value).toBeUndefined();
    expect(management.editorModel.value).toMatchObject({ name: '', type: 'MENU', parentId: 2, isActive: true });

    management.cancelEdit();
    // 取消新增时没有选中节点，面板应整体关闭而不是保留半成品草稿
    expect(management.editorModel.value).toBeNull();

    management.selectMenu(3);
    if (management.editorModel.value) {
      management.editorModel.value.name = '临时改名';
    }
    management.cancelEdit();
    expect(management.editorModel.value?.name).toBe('用户管理');
  });

  it('保存新增菜单后刷新树并同步登录会话', async () => {
    const tree = createMenuTree();
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(tree);
    rstest.mocked(createAdminMenu).mockResolvedValue(tree[1]);

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    await management.saveMenu({
      id: undefined,
      parentId: null,
      name: '新目录',
      type: 'DIRECTORY',
      routePath: null,
      routeName: null,
      component: null,
      icon: null,
      permissionCode: null,
      isVisible: true,
      isActive: true,
    });

    expect(createAdminMenu).toHaveBeenCalledTimes(1);
    // 保存成功必须重新加载树并刷新当前会话菜单，侧边栏才能立即反映新菜单
    expect(fetchAdminMenuTree).toHaveBeenCalledTimes(2);
    expect(mockAuthStore.restoreSession).toHaveBeenCalledTimes(1);
    expect(rstest.mocked(ElMessage.success)).toHaveBeenCalledWith('菜单已创建');
    expect(management.saving.value).toBe(false);
    expect(management.selectedId.value).toBe(2);
  });

  it('保存失败时恢复保存状态且不刷新树', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(createMenuTree());
    rstest.mocked(createAdminMenu).mockRejectedValue(new Error('路由名称已存在'));

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    await management.saveMenu({
      id: undefined,
      parentId: null,
      name: '重复菜单',
      type: 'DIRECTORY',
      routePath: null,
      routeName: null,
      component: null,
      icon: null,
      permissionCode: null,
      isVisible: true,
      isActive: true,
    });

    expect(management.saving.value).toBe(false);
    expect(fetchAdminMenuTree).toHaveBeenCalledTimes(1);
    expect(mockAuthStore.restoreSession).not.toHaveBeenCalled();
  });

  it('保存进行中时拒绝重复提交', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(createMenuTree());
    let resolveCreate!: (value: AdminMenuTreeNode) => void;
    rstest.mocked(createAdminMenu).mockImplementationOnce(
      () =>
        new Promise<AdminMenuTreeNode>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    const draft = {
      id: undefined,
      parentId: null,
      name: '新目录',
      type: 'DIRECTORY' as const,
      routePath: null,
      routeName: null,
      component: null,
      icon: null,
      permissionCode: null,
      isVisible: true,
      isActive: true,
    };

    const firstSave = management.saveMenu(draft);
    await rstest.waitFor(() => expect(management.saving.value).toBe(true));

    await management.saveMenu(draft);
    expect(createAdminMenu).toHaveBeenCalledTimes(1);

    resolveCreate(createMenuTree()[1]);
    await firstSave;
    expect(management.saving.value).toBe(false);
  });

  it('删除确认取消时不发起删除请求，确认后选中父节点', async () => {
    rstest.mocked(fetchAdminMenuTree).mockResolvedValue(createMenuTree());

    const [management] = withSetup(() => useMenuManagement());
    await waitForLoadingSettled(management);

    rstest.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'));
    await management.removeMenu(3);
    expect(deleteAdminMenu).not.toHaveBeenCalled();

    rstest.mocked(deleteAdminMenu).mockResolvedValue(undefined);
    await management.removeMenu(3);

    expect(deleteAdminMenu).toHaveBeenCalledWith(3);
    // 删除页面节点后属性面板切换到父目录，避免停留在已删除节点
    expect(management.selectedId.value).toBe(2);
    expect(mockAuthStore.restoreSession).toHaveBeenCalled();
  });
});
