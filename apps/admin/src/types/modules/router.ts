/**
 * 可绑定后台菜单的页面路由元数据
 */
export interface AdminPageBindingMeta {
  /**
   * 数据库存储的页面组件稳定标识
   */
  component: string;

  /**
   * 生成标准 CRUD 权限时使用的权限前缀
   */
  permissionPrefix: `${string}:${string}` | null;
}

/**
 * Router 派生的菜单可绑定页面选项
 */
export interface AdminPageOption extends AdminPageBindingMeta {
  /**
   * 与菜单表 `routeName` 对应的稳定路由名称
   */
  routeName: string;

  /**
   * 管理员选择页面时看到的业务名称
   */
  title: string;

  /**
   * Router 根据父子路由片段计算的绝对访问路径
   */
  routePath: string;
}

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * 页面标题
     */
    title?: string;

    /**
     * 无需登录即可访问
     */
    public?: boolean;

    /**
     * 存在时允许菜单节点绑定该页面
     */
    pageBinding?: AdminPageBindingMeta;
  }
}
