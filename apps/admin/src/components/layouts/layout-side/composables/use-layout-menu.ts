import { resolveMenuIcon } from '@/navigation';
import { useAuthStore } from '@/stores';

import type { RbacMenuNode } from '@repo/shared/types';
import type { AdminNavItem } from '@/types';

/**
 * 把当前管理员的数据库菜单树转换为侧栏渲染模型
 *
 * 页面组件仍由本地 Vue Router 注册，数据库只决定当前管理员可以看到的层级、名称、顺序和图标。
 * 一级节点解析 Lucide 图标，二级及更深层级保持纯文本展示。
 *
 * @param menus 登录会话返回的可见菜单树
 * @param root 当前是否处于导航树根层级
 * @returns Element Plus 侧栏使用的导航节点
 */
const createNavItems = (menus: RbacMenuNode[], root = true): AdminNavItem[] => {
  return menus.map((menu) => ({
    key: menu.routePath ?? `menu-${menu.id}`,
    title: menu.name,
    path: menu.type === 'MENU' ? (menu.routePath ?? undefined) : undefined,
    icon: root ? resolveMenuIcon(menu.icon) : undefined,
    children: menu.children.length ? createNavItems(menu.children, false) : undefined,
  }));
};

/**
 * 在导航树中查找节点对应的路由地址
 *
 * @param items 导航树节点
 * @param key 菜单唯一标识
 * @returns 路由地址，不存在时返回 `undefined`
 */
const findNavPath = (items: AdminNavItem[], key: string): string | undefined => {
  for (const item of items) {
    if (item.key === key) {
      return item.path;
    }

    if (item.children?.length) {
      const childPath = findNavPath(item.children, key);
      if (childPath) {
        return childPath;
      }
    }
  }

  return undefined;
};

/**
 * 管理数据库菜单到侧栏视图的转换和路由交互
 *
 * @returns 当前菜单树、默认展开项、选中项和页面跳转方法
 */
export const useLayoutMenu = () => {
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const { menus } = storeToRefs(authStore);

  /**
   * 当前登录会话转换后的侧栏导航树
   */
  const navigationItems = computed(() => createNavItems(menus.value));

  /**
   * 当前菜单树中默认展开的一级分组
   */
  const defaultOpenedKeys = computed(() => {
    return navigationItems.value.filter((item) => item.children?.length).map((item) => item.key);
  });

  /**
   * 当前路由对应的菜单选中标识
   */
  const activeMenuKey = computed(() => route.path);

  /**
   * 打开叶子菜单绑定的页面
   *
   * @param key 菜单唯一标识
   */
  const handleMenuSelect = (key: string): void => {
    const path = findNavPath(navigationItems.value, key);
    if (path && path !== route.path) {
      void router.push(path);
    }
  };

  return {
    navigationItems,
    defaultOpenedKeys,
    activeMenuKey,
    handleMenuSelect,
  };
};
