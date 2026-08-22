import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MenuType } from '@repo/database';

import type { AdminMenuTreeNode, CreateStandardMenuPermissionsResult, PermissionCode } from '@repo/shared/types';

import { STANDARD_MENU_PERMISSIONS } from '../../constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminMenuRecord } from '../../types';
import type { CreateMenuDto } from './dto/create-menu.dto';
import type { CreateStandardPermissionsDto } from './dto/create-standard-permissions.dto';
import type { ReorderMenusDto } from './dto/reorder-menus.dto';
import type { UpdateMenuDto } from './dto/update-menu.dto';

/**
 * 菜单管理查询统一使用的数据库字段
 *
 * 所有接口共享同一选择器，避免列表、创建和编辑响应因遗漏字段而形成不同契约。
 */
const ADMIN_MENU_SELECT = {
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
  isActive: true,
} as const;

/**
 * 判断数据库字符串是否符合三段式权限码结构
 *
 * @param value 数据库中的权限码
 * @returns 字符串可以安全映射为 Shared 权限码时返回 `true`
 */
const isPermissionCode = (value: string): value is PermissionCode => {
  return /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(value);
};

/**
 * 把空字符串和两侧空白归一化为数据库可选文本
 *
 * @param value DTO 中的可选文本
 * @returns 清理后的文本；空值返回 `null`
 */
const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

/**
 * 菜单管理业务服务
 *
 * 负责完整菜单树查询、节点字段组合校验、父子层级约束、拖拽排序和标准 CRUD 权限生成。
 * Controller 不直接访问 Prisma，前端传入的路由与权限字段也不能绕过这里的领域校验。
 */
@Injectable()
export class MenuService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * 获取包含停用、隐藏和按钮权限的完整菜单树
   *
   * @returns 按同级顺序排列的菜单管理树
   */
  async getMenuTree(): Promise<AdminMenuTreeNode[]> {
    const records = await this.prisma.menu.findMany({
      select: ADMIN_MENU_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return this.buildMenuTree(records);
  }

  /**
   * 新增菜单、目录或按钮权限节点
   *
   * 新节点自动排在同级末尾；按钮只能属于页面菜单，非根节点图标会被清空。
   *
   * @param dto 已通过字段类型校验的新增参数
   * @returns 新增后的完整菜单节点
   */
  async createMenu(dto: CreateMenuDto): Promise<AdminMenuTreeNode> {
    const parentId = dto.parentId ?? null;
    await this.assertParentAllowed(dto.type, parentId);
    await this.assertUniqueBindings(dto.routeName, dto.permissionCode);

    const sibling = await this.prisma.menu.aggregate({
      where: { parentId },
      _max: { sortOrder: true },
    });
    const record = await this.prisma.menu.create({
      data: this.createMenuData(dto, parentId, (sibling._max.sortOrder ?? -1) + 1),
      select: ADMIN_MENU_SELECT,
    });

    return this.mapMenuNode(record);
  }

  /**
   * 编辑菜单节点并校验新的父子关系
   *
   * @param id 需要编辑的菜单主键
   * @param dto 已通过字段类型校验的完整编辑参数
   * @returns 更新后的完整菜单节点
   */
  async updateMenu(id: number, dto: UpdateMenuDto): Promise<AdminMenuTreeNode> {
    const current = await this.getMenuOrThrow(id);
    const parentId = dto.parentId ?? null;

    await this.assertParentAllowed(dto.type, parentId, id);
    await this.assertChildrenAllowed(id, dto.type);
    await this.assertUniqueBindings(dto.routeName, dto.permissionCode, id);

    const record = await this.prisma.menu.update({
      where: { id },
      data: {
        ...this.createMenuData(dto, parentId, current.sortOrder),
        sortOrder: current.sortOrder,
      },
      select: ADMIN_MENU_SELECT,
    });

    return this.mapMenuNode(record);
  }

  /**
   * 删除没有子节点的菜单记录
   *
   * 角色关联由数据库外键级联清理；存在子节点时拒绝删除，避免一次误操作移除整棵权限树。
   *
   * @param id 需要删除的菜单主键
   */
  async deleteMenu(id: number): Promise<void> {
    await this.getMenuOrThrow(id);
    const childCount = await this.prisma.menu.count({ where: { parentId: id } });

    if (childCount > 0) {
      throw new BadRequestException('请先删除当前节点下的子菜单或操作权限');
    }

    await this.prisma.menu.delete({ where: { id } });
  }

  /**
   * 批量保存导航树拖拽后的父级和顺序
   *
   * 请求必须包含全部非按钮节点，服务端会在事务前验证节点集合、父节点类型、重复顺序和循环引用，
   * 防止部分拖拽结果把菜单树写成不可恢复的结构。
   *
   * @param dto 当前导航树的完整位置快照
   */
  async reorderMenus(dto: ReorderMenusDto): Promise<void> {
    const records = await this.prisma.menu.findMany({
      select: { id: true, parentId: true, type: true },
    });
    const navigations = records.filter((record) => record.type !== MenuType.BUTTON);
    const itemIds = new Set(dto.items.map((item) => item.id));

    if (itemIds.size !== dto.items.length || navigations.some((record) => !itemIds.has(record.id))) {
      throw new BadRequestException('菜单排序数据必须包含全部且不重复的导航节点');
    }

    const recordsById = new Map(records.map((record) => [record.id, record]));
    const parentById = new Map(dto.items.map((item) => [item.id, item.parentId]));
    const siblingPositions = new Set<string>();

    for (const item of dto.items) {
      const record = recordsById.get(item.id);
      const parent = item.parentId ? recordsById.get(item.parentId) : undefined;

      if (!record || record.type === MenuType.BUTTON) {
        throw new BadRequestException('菜单排序包含不存在或不可拖拽的节点');
      }

      if (item.parentId && (!parent || parent.type === MenuType.BUTTON)) {
        throw new BadRequestException('菜单不能移动到操作权限节点下');
      }

      const positionKey = `${item.parentId ?? 'root'}:${item.sortOrder}`;
      if (siblingPositions.has(positionKey)) {
        throw new BadRequestException('同级菜单排序值不能重复');
      }
      siblingPositions.add(positionKey);

      let ancestorId = item.parentId;
      const visited = new Set<number>();
      while (ancestorId) {
        if (ancestorId === item.id || visited.has(ancestorId)) {
          throw new BadRequestException('菜单拖拽结果不能形成循环父子关系');
        }

        visited.add(ancestorId);
        ancestorId = parentById.get(ancestorId) ?? recordsById.get(ancestorId)?.parentId ?? null;
      }
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.menu.update({
          where: { id: item.id },
          data: {
            parentId: item.parentId,
            sortOrder: item.sortOrder,
            icon: item.parentId ? null : undefined,
          },
        }),
      ),
    );
  }

  /**
   * 为页面菜单补齐查询、新增、编辑和删除四个标准权限
   *
   * 已经存在于当前页面下的权限保持不变；相同权限码被其他页面占用时返回冲突，避免权限归属含糊。
   *
   * @param id 页面菜单主键
   * @param dto 两段式权限前缀
   * @returns 本次实际新增的权限数量
   */
  async createStandardPermissions(
    id: number,
    dto: CreateStandardPermissionsDto,
  ): Promise<CreateStandardMenuPermissionsResult> {
    const menu = await this.getMenuOrThrow(id);
    if (menu.type !== MenuType.MENU) {
      throw new BadRequestException('只有页面菜单可以生成标准操作权限');
    }

    const permissionCodes = STANDARD_MENU_PERMISSIONS.map(
      (permission) => `${dto.permissionPrefix}:${permission.key}` as PermissionCode,
    );
    const occupiedPermissions = await this.prisma.menu.findMany({
      where: { permissionCode: { in: permissionCodes } },
      select: { parentId: true, permissionCode: true },
    });
    const occupiedByOtherMenu = occupiedPermissions.find((permission) => permission.parentId !== id);

    if (occupiedByOtherMenu?.permissionCode) {
      throw new ConflictException(`权限码 ${occupiedByOtherMenu.permissionCode} 已被其他菜单使用`);
    }

    const existingCodes = new Set(occupiedPermissions.map((permission) => permission.permissionCode));
    const lastPermission = await this.prisma.menu.aggregate({
      where: { parentId: id },
      _max: { sortOrder: true },
    });
    const startOrder = (lastPermission._max.sortOrder ?? -1) + 1;
    const newPermissions = STANDARD_MENU_PERMISSIONS.flatMap((permission, index) => {
      const permissionCode = `${dto.permissionPrefix}:${permission.key}`;
      return existingCodes.has(permissionCode)
        ? []
        : [
            {
              parentId: id,
              name: permission.name,
              type: MenuType.BUTTON,
              permissionCode,
              sortOrder: startOrder + index,
              isVisible: false,
              isActive: true,
            },
          ];
    });

    if (newPermissions.length) {
      await this.prisma.menu.createMany({ data: newPermissions });
    }

    return { createdCount: newPermissions.length };
  }

  /**
   * 根据节点类型生成可以安全写入数据库的数据
   *
   * @param dto 新增或编辑表单
   * @param parentId 已校验的父节点主键
   * @param sortOrder 当前节点需要使用的同级顺序
   * @returns 已清理不相容字段的 Prisma 写入数据
   */
  private createMenuData(dto: CreateMenuDto, parentId: number | null, sortOrder: number) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('菜单名称不能为空');
    }

    const routePath = normalizeOptionalText(dto.routePath);
    const routeName = normalizeOptionalText(dto.routeName);
    const component = normalizeOptionalText(dto.component);
    const permissionCode = normalizeOptionalText(dto.permissionCode);

    if (dto.type === MenuType.MENU && (!routePath || !routeName || !component)) {
      throw new BadRequestException('页面菜单必须绑定前端页面');
    }

    if (dto.type === MenuType.BUTTON && !permissionCode) {
      throw new BadRequestException('操作权限必须填写三段式权限码');
    }

    return {
      parentId,
      name,
      type: dto.type,
      routePath: dto.type === MenuType.BUTTON ? null : routePath,
      routeName: dto.type === MenuType.BUTTON ? null : routeName,
      component: dto.type === MenuType.MENU ? component : null,
      icon: parentId || dto.type === MenuType.BUTTON ? null : normalizeOptionalText(dto.icon),
      permissionCode: dto.type === MenuType.BUTTON ? permissionCode : null,
      sortOrder,
      isVisible: dto.type === MenuType.BUTTON ? false : (dto.isVisible ?? true),
      isActive: dto.isActive ?? true,
    };
  }

  /**
   * 校验父节点类型和循环引用
   *
   * @param type 当前节点准备保存的类型
   * @param parentId 新父节点主键
   * @param currentId 编辑场景下的当前节点主键
   */
  private async assertParentAllowed(type: MenuType, parentId: number | null, currentId?: number): Promise<void> {
    if (!parentId) {
      if (type === MenuType.BUTTON) {
        throw new BadRequestException('操作权限必须属于一个页面菜单');
      }
      return;
    }

    if (parentId === currentId) {
      throw new BadRequestException('菜单不能把自己设为父节点');
    }

    const records = await this.prisma.menu.findMany({
      select: { id: true, parentId: true, type: true },
    });
    const recordsById = new Map(records.map((record) => [record.id, record]));
    const parent = recordsById.get(parentId);

    if (!parent) {
      throw new NotFoundException('父菜单不存在');
    }

    if (parent.type === MenuType.BUTTON || (type === MenuType.BUTTON && parent.type !== MenuType.MENU)) {
      throw new BadRequestException('当前节点类型不能放在所选父菜单下');
    }

    let ancestorId: number | null = parentId;
    while (ancestorId) {
      if (ancestorId === currentId) {
        throw new BadRequestException('菜单不能移动到自己的子节点下');
      }
      ancestorId = recordsById.get(ancestorId)?.parentId ?? null;
    }
  }

  /**
   * 校验类型变化后现有子节点是否仍然合法
   *
   * @param id 当前菜单主键
   * @param type 准备保存的新类型
   */
  private async assertChildrenAllowed(id: number, type: MenuType): Promise<void> {
    const children = await this.prisma.menu.findMany({
      where: { parentId: id },
      select: { type: true },
    });

    if (type === MenuType.BUTTON && children.length) {
      throw new BadRequestException('存在子节点的菜单不能改为操作权限');
    }

    if (type === MenuType.DIRECTORY && children.some((child) => child.type === MenuType.BUTTON)) {
      throw new BadRequestException('包含操作权限的页面菜单不能直接改为目录');
    }
  }

  /**
   * 校验路由标识和权限码没有被其他节点占用
   *
   * @param routeName 前端 Router 的稳定页面标识
   * @param permissionCode 三段式权限码
   * @param currentId 编辑时排除的当前节点主键
   */
  private async assertUniqueBindings(
    routeName: string | null | undefined,
    permissionCode: string | null | undefined,
    currentId?: number,
  ): Promise<void> {
    const normalizedRouteName = normalizeOptionalText(routeName);
    const normalizedPermissionCode = normalizeOptionalText(permissionCode);

    if (!normalizedRouteName && !normalizedPermissionCode) {
      return;
    }

    const conflicts = await this.prisma.menu.findMany({
      where: {
        id: currentId ? { not: currentId } : undefined,
        OR: [
          ...(normalizedRouteName ? [{ routeName: normalizedRouteName }] : []),
          ...(normalizedPermissionCode ? [{ permissionCode: normalizedPermissionCode }] : []),
        ],
      },
      select: { routeName: true, permissionCode: true },
    });

    if (normalizedRouteName && conflicts.some((record) => record.routeName === normalizedRouteName)) {
      throw new ConflictException('该前端页面已经绑定其他菜单');
    }

    if (normalizedPermissionCode && conflicts.some((record) => record.permissionCode === normalizedPermissionCode)) {
      throw new ConflictException('该权限码已经被其他节点使用');
    }
  }

  /**
   * 获取菜单记录，不存在时返回统一 404
   *
   * @param id 菜单主键
   * @returns 完整菜单数据库记录
   */
  private async getMenuOrThrow(id: number): Promise<AdminMenuRecord> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: ADMIN_MENU_SELECT,
    });

    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }

    return menu;
  }

  /**
   * 把数据库记录映射为浏览器可用的菜单节点
   *
   * @param record Prisma 菜单记录
   * @returns 不包含子节点的 Shared 菜单节点
   */
  private mapMenuNode(record: AdminMenuRecord): AdminMenuTreeNode {
    const permissionCode = record.permissionCode;

    return {
      ...record,
      permissionCode: permissionCode && isPermissionCode(permissionCode) ? permissionCode : null,
      children: [],
    };
  }

  /**
   * 把扁平菜单记录转换为完整管理树
   *
   * @param records 已按同级顺序查询的数据库菜单记录
   * @returns 包含按钮权限的完整树
   */
  private buildMenuTree(records: AdminMenuRecord[]): AdminMenuTreeNode[] {
    const nodes = new Map(records.map((record) => [record.id, this.mapMenuNode(record)]));
    const roots: AdminMenuTreeNode[] = [];

    for (const record of records) {
      const node = nodes.get(record.id);
      if (!node) {
        continue;
      }

      const parent = record.parentId ? nodes.get(record.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
