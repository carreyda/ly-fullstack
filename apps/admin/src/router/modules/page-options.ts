import type { RouteRecordRaw } from 'vue-router';
import type { AdminPageOption } from '@/types';

/**
 * 将父子路由片段合并为规范的绝对路径
 *
 * @param parentPath 父路由绝对路径
 * @param routePath 当前路由路径
 * @returns 当前路由的绝对访问路径
 */
const resolveRoutePath = (parentPath: string, routePath: string): string => {
  if (routePath.startsWith('/')) {
    return routePath;
  }

  return `/${[parentPath, routePath]
    .flatMap((path) => path.split('/'))
    .filter(Boolean)
    .join('/')}`;
};

/**
 * 从静态路由树派生菜单管理可绑定的页面选项
 *
 * 路由 `name`、访问路径和 `meta` 是页面注册信息的唯一真相源。只有声明 `meta.pageBinding`
 * 的路由会进入选择列表，目录、登录页和兜底页不会暴露给菜单编辑器。
 *
 * @param routes 管理后台静态业务路由
 * @param parentPath 当前递归层级的父路由路径
 * @returns 菜单管理可以绑定的页面注册项
 */
export const createAdminPageOptions = (
  routes: readonly RouteRecordRaw[],
  parentPath = '',
): readonly AdminPageOption[] => {
  return routes.flatMap((route) => {
    const routePath = resolveRoutePath(parentPath, route.path);
    const childOptions = route.children ? createAdminPageOptions(route.children, routePath) : [];
    const binding = route.meta?.pageBinding;

    if (!binding || typeof route.name !== 'string' || typeof route.meta?.title !== 'string') {
      return childOptions;
    }

    return [
      {
        routeName: route.name,
        title: route.meta.title,
        routePath,
        component: binding.component,
        permissionPrefix: binding.permissionPrefix,
      },
      ...childOptions,
    ];
  });
};
