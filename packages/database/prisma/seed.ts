import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

import { MenuType, PrismaClient } from '../generated/prisma/client.js';

import type { SeedMenu } from '../src/types/modules/seed.js';

/**
 * 系统管理模块首次初始化的按钮权限
 *
 * 名称用于菜单管理页面展示，权限码同时写入数据库按钮节点并供前端按钮与后端 Guard 使用。
 */
const SYSTEM_PERMISSION_CODES = {
  user: [
    ['查询用户', 'system:user:list'],
    ['新建用户', 'system:user:create'],
    ['修改用户', 'system:user:update'],
    ['删除用户', 'system:user:delete'],
    ['分配角色', 'system:user:assign-role'],
  ],
  role: [
    ['查询角色', 'system:role:list'],
    ['新建角色', 'system:role:create'],
    ['修改角色', 'system:role:update'],
    ['删除角色', 'system:role:delete'],
    ['分配菜单', 'system:role:assign-menu'],
  ],
  menu: [
    ['查询菜单', 'system:menu:list'],
    ['新建菜单', 'system:menu:create'],
    ['修改菜单', 'system:menu:update'],
    ['删除菜单', 'system:menu:delete'],
  ],
} as const;

/**
 * 把权限名称与权限码转换为按钮类型的菜单种子配置
 *
 * @param entries 系统管理资源对应的权限名称和三段式权限码
 * @returns 按输入顺序生成并从 1 开始排序的按钮节点
 */
const createPermissionMenus = (entries: readonly (readonly [name: string, permissionCode: string])[]): SeedMenu[] => {
  return entries.map(([name, permissionCode], index) => ({
    name,
    type: MenuType.BUTTON,
    permissionCode,
    sortOrder: index + 1,
  }));
};

/**
 * 首次初始化的完整后台导航和系统管理权限树
 *
 * 页面节点与当前 Admin 静态路由保持一致；按钮节点不进入导航，只承担 RBAC 权限分配。
 */
const SEED_MENUS: SeedMenu[] = [
  {
    name: '工作台',
    type: MenuType.MENU,
    routeName: 'dashboard',
    routePath: '/dashboard',
    component: 'dashboard/index',
    icon: 'LayoutDashboard',
    sortOrder: 1,
  },
  {
    name: '系统管理',
    type: MenuType.DIRECTORY,
    routeName: 'system',
    routePath: '/system',
    icon: 'Settings',
    sortOrder: 10,
    children: [
      {
        name: '用户管理',
        type: MenuType.MENU,
        routeName: 'system-user',
        routePath: '/system/user',
        component: 'system/user/index',
        sortOrder: 1,
        children: createPermissionMenus(SYSTEM_PERMISSION_CODES.user),
      },
      {
        name: '角色管理',
        type: MenuType.MENU,
        routeName: 'system-role',
        routePath: '/system/role',
        component: 'system/role/index',
        sortOrder: 2,
        children: createPermissionMenus(SYSTEM_PERMISSION_CODES.role),
      },
      {
        name: '菜单管理',
        type: MenuType.MENU,
        routeName: 'system-menu',
        routePath: '/system/menu',
        component: 'system/menu/index',
        sortOrder: 3,
        children: createPermissionMenus(SYSTEM_PERMISSION_CODES.menu),
      },
    ],
  },
  {
    name: '组件中心',
    type: MenuType.DIRECTORY,
    routeName: 'component',
    routePath: '/component',
    icon: 'Boxes',
    sortOrder: 20,
    children: [
      {
        name: '图标',
        type: MenuType.MENU,
        routeName: 'component-icon',
        routePath: '/component/icon',
        component: 'component/icon/index',
        sortOrder: 1,
      },
      {
        name: '视频播放器',
        type: MenuType.MENU,
        routeName: 'component-video',
        routePath: '/component/video',
        component: 'component/video/index',
        sortOrder: 2,
      },
    ],
  },
  {
    name: '展示页面',
    type: MenuType.DIRECTORY,
    routeName: 'display',
    routePath: '/display',
    icon: 'PanelsTopLeft',
    sortOrder: 30,
    children: [
      {
        name: '成功页',
        type: MenuType.MENU,
        routeName: 'display-success',
        routePath: '/display/success',
        component: 'display/success/index',
        sortOrder: 1,
      },
      {
        name: '失败页',
        type: MenuType.MENU,
        routeName: 'display-failure',
        routePath: '/display/failure',
        component: 'display/failure/index',
        sortOrder: 2,
      },
      {
        name: '404',
        type: MenuType.MENU,
        routeName: 'display-404',
        routePath: '/display/404',
        component: 'display/404/index',
        sortOrder: 3,
      },
      {
        name: '500',
        type: MenuType.MENU,
        routeName: 'display-500',
        routePath: '/display/500',
        component: 'display/500/index',
        sortOrder: 4,
      },
    ],
  },
];

/**
 * 递归幂等写入菜单树
 *
 * 页面和目录按 `routeName` 更新，按钮按 `permissionCode` 更新。脚本不会删除数据库中额外创建的菜单，
 * 避免重复执行 Setup 时误删用户数据。
 *
 * @param prisma 已连接目标 PostgreSQL 的 Prisma Client
 * @param menus 当前层级需要写入的菜单配置
 * @param parentId 当前层级的父菜单主键，根节点为空
 * @returns 当前层级及全部后代节点的数据库主键
 */
const upsertMenus = async (
  prisma: PrismaClient,
  menus: SeedMenu[],
  parentId: number | null = null,
): Promise<number[]> => {
  const menuIds: number[] = [];

  for (const menu of menus) {
    const uniqueWhere = menu.permissionCode
      ? { permissionCode: menu.permissionCode }
      : { routeName: menu.routeName as string };
    const data = {
      parentId,
      name: menu.name,
      type: menu.type,
      routePath: menu.routePath ?? null,
      routeName: menu.routeName ?? null,
      component: menu.component ?? null,
      icon: menu.icon ?? null,
      permissionCode: menu.permissionCode ?? null,
      sortOrder: menu.sortOrder,
      isVisible: menu.type !== MenuType.BUTTON,
      isActive: true,
    };
    const savedMenu = await prisma.menu.upsert({
      where: uniqueWhere,
      create: data,
      update: data,
    });

    menuIds.push(savedMenu.id);

    if (menu.children?.length) {
      menuIds.push(...(await upsertMenus(prisma, menu.children, savedMenu.id)));
    }
  }

  return menuIds;
};

/**
 * 初始化 RBAC 超级管理员、菜单和关联关系
 *
 * 首次创建 `admin` 时使用 Setup 通过进程环境提供的用户自定义密码；重复执行不会覆盖已有管理员密码。
 * 所有写入均采用 upsert 或跳过重复关联，保证 `pnpm setup` 可以安全重复执行。
 */
const main = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!databaseUrl) {
    throw new Error('执行种子数据前必须提供 DATABASE_URL。');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const role = await prisma.role.upsert({
      where: { code: 'super_admin' },
      create: {
        name: '超级管理员',
        code: 'super_admin',
        description: '系统内置角色，拥有全部菜单与操作权限。',
      },
      update: {
        name: '超级管理员',
        description: '系统内置角色，拥有全部菜单与操作权限。',
        isActive: true,
      },
    });

    const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });

    if (!existingAdmin && !initialPassword) {
      throw new Error('首次初始化必须提供 ADMIN_INITIAL_PASSWORD。');
    }

    const admin =
      existingAdmin ??
      (await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: await hash(initialPassword as string, 12),
          displayName: '管理员',
        },
      }));
    const menuIds = await upsertMenus(prisma, SEED_MENUS);

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: role.id } },
      create: { userId: admin.id, roleId: role.id },
      update: {},
    });
    await prisma.roleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId: role.id, menuId })),
      skipDuplicates: true,
    });

    process.stdout.write(`RBAC 种子数据已就绪：admin、超级管理员角色、${menuIds.length} 个菜单与权限节点。\n`);
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * 执行 RBAC 种子入口并把失败原因写入标准错误流
 *
 * 顶层不直接退出进程，统一设置非零退出码，使 Prisma CLI 能完成自身的输出与资源回收。
 */
void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`RBAC 种子数据初始化失败：${message}\n`);
  process.exitCode = 1;
});
