import { Inject, Injectable } from '@nestjs/common';
import { MenuType } from '@repo/database';

import type { PermissionCode, RbacMenuNode } from '@repo/shared/types';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedAdmin, RbacAccessMenuRecord } from '../../types';

/**
 * 登录会话与权限 Guard 读取菜单时使用的最小数据库字段
 */
const RBAC_ACCESS_MENU_SELECT = {
  id: true,
  parentId: true,
  name: true,
  type: true,
  routePath: true,
  routeName: true,
  component: true,
  icon: true,
  permissionCode: true,
  sortOrder: true,
  isVisible: true,
} as const;

/**
 * 判断数据库字符串是否符合三段式权限码结构
 *
 * @param value 菜单记录中未经类型收窄的权限码
 * @returns 包含且只包含三个冒号分段时返回 `true`
 */
const isPermissionCode = (value: string): value is PermissionCode => {
  return value.split(':').length === 3;
};

/**
 * 管理员 RBAC 访问上下文查询服务
 *
 * 统一读取启用账号关联的有效角色和菜单，负责多角色菜单去重、权限码去重以及导航树构建。
 * 认证 Guard 和登录 Service 共用该服务，避免两条链路形成不同的权限计算规则。
 */
@Injectable()
export class RbacAccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * 获取启用账号的最新 RBAC 访问快照
   *
   * 查询只选择对外会话需要的字段，不读取密码哈希。账号禁用、没有启用角色或记录不存在时统一返回
   * `null`，由认证调用方根据当前场景转换为 401 文案。
   *
   * @param userId 管理员用户主键
   * @returns 账号不存在、禁用或没有启用角色时返回 `null`
   */
  async getActiveAdmin(userId: number): Promise<AuthenticatedAdmin | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        tokenVersion: true,
        roles: {
          where: { role: { isActive: true } },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                code: true,
                menus: {
                  where: { menu: { isActive: true } },
                  select: {
                    menu: {
                      select: RBAC_ACCESS_MENU_SELECT,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.isActive || !user.roles.length) {
      return null;
    }

    const assignedMenuMap = new Map<number, RbacAccessMenuRecord>();
    const roles = user.roles.map(({ role }) => {
      for (const { menu } of role.menus) {
        assignedMenuMap.set(menu.id, menu);
      }

      return {
        id: role.id,
        name: role.name,
        code: role.code,
      };
    });
    const isSuperAdmin = roles.some((role) => role.code === 'super_admin');
    const menuRecords = isSuperAdmin
      ? await this.prisma.menu.findMany({
          where: { isActive: true },
          select: RBAC_ACCESS_MENU_SELECT,
        })
      : [...assignedMenuMap.values()];
    const permissions = menuRecords.flatMap((menu) => {
      const permissionCode = menu.permissionCode;
      return permissionCode && isPermissionCode(permissionCode) ? [permissionCode] : [];
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      tokenVersion: user.tokenVersion,
      roles,
      menus: this.buildMenuTree(menuRecords),
      permissions: [...new Set(permissions)].sort(),
    };
  }

  /**
   * 把角色关联的扁平菜单记录转换为管理端导航树
   *
   * 按钮节点只进入权限集合，不进入导航；同级节点按照 `sortOrder` 和主键稳定排序。
   * 当角色只关联了子节点但没有关联父节点时，该子节点会作为根节点返回，避免权限数据被静默丢弃。
   *
   * @param records 当前管理员所有有效角色关联并去重后的菜单记录
   * @returns 不包含按钮节点的可见导航树
   */
  private buildMenuTree(records: RbacAccessMenuRecord[]): RbacMenuNode[] {
    const visibleRecords = records.filter((menu) => menu.type !== MenuType.BUTTON && menu.isVisible);
    const nodes = new Map<number, RbacMenuNode>();

    for (const menu of visibleRecords) {
      nodes.set(menu.id, {
        id: menu.id,
        name: menu.name,
        type: menu.type,
        routePath: menu.routePath,
        routeName: menu.routeName,
        component: menu.component,
        icon: menu.icon,
        permissionCode: null,
        sortOrder: menu.sortOrder,
        children: [],
      });
    }

    const roots: RbacMenuNode[] = [];
    for (const menu of visibleRecords) {
      const node = nodes.get(menu.id);
      if (!node) {
        continue;
      }

      const parent = menu.parentId ? nodes.get(menu.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (items: RbacMenuNode[]): void => {
      items.sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
      items.forEach((item) => sortNodes(item.children));
    };
    sortNodes(roots);

    return roots;
  }
}
