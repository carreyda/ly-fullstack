import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';

import type { AdminRoleDetail, AdminRoleListItem, AdminRoleMenuTreeNode, PaginationResult } from '@repo/shared/types';

import { SYSTEM_SUPER_ADMIN_ROLE_CODE } from '../../constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminRoleDetailRecord, AdminRoleMenuRecord, AdminRoleRecord } from '../../types';
import type { AssignRoleMenusDto } from './dto/assign-role-menus.dto';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { RoleQueryDto } from './dto/role-query.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';

/**
 * 角色列表与详情共用的数据库字段
 */
const ADMIN_ROLE_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      users: true,
      menus: true,
    },
  },
} as const;

/**
 * 把可选文本归一化为数据库可空字段
 *
 * @param value 表单提交的可选文本
 * @returns 去除两侧空白后的文本；空字符串返回 `null`
 */
const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

/**
 * 角色管理业务服务
 *
 * 负责分页筛选、角色基础信息 CRUD、系统角色保护和菜单权限分配。角色编码创建后不可修改，
 * 超级管理员由服务端识别并天然拥有全部有效权限，不依赖可被误删的角色菜单关联。
 */
@Injectable()
export class RoleService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * 分页查询角色列表
   *
   * @param query 已通过 DTO 校验的分页与筛选参数
   * @returns 角色列表、关联数量和分页信息
   */
  async getRoles(query: RoleQueryDto): Promise<PaginationResult<AdminRoleListItem>> {
    const keyword = query.keyword?.trim();
    const where: Prisma.RoleWhereInput = {
      isActive: query.status ? query.status === 'ACTIVE' : undefined,
      OR: keyword
        ? [{ name: { contains: keyword, mode: 'insensitive' } }, { code: { contains: keyword, mode: 'insensitive' } }]
        : undefined,
    };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        select: ADMIN_ROLE_SELECT,
        orderBy: [{ id: 'desc' }],
        skip: (query.pageNum - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      list: records.map((record) => this.mapRole(record)),
      total,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    };
  }

  /**
   * 获取角色详情及其菜单关联
   *
   * @param id 角色主键
   * @returns 角色详情和已分配菜单主键
   */
  async getRole(id: number): Promise<AdminRoleDetail> {
    const record = await this.prisma.role.findUnique({
      where: { id },
      select: {
        ...ADMIN_ROLE_SELECT,
        menus: {
          select: { menuId: true },
          orderBy: { menuId: 'asc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('角色不存在');
    }

    return this.mapRoleDetail(record);
  }

  /**
   * 获取角色菜单分配使用的完整权限树
   *
   * @returns 包含停用节点和按钮权限的完整菜单树
   */
  async getRoleMenuTree(): Promise<AdminRoleMenuTreeNode[]> {
    const records = await this.prisma.menu.findMany({
      select: {
        id: true,
        parentId: true,
        name: true,
        type: true,
        isActive: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return this.buildMenuTree(records);
  }

  /**
   * 新增普通角色
   *
   * @param dto 已通过字段校验的角色表单
   * @returns 新增后的角色详情
   */
  async createRole(dto: CreateRoleDto): Promise<AdminRoleDetail> {
    const name = dto.name.trim();
    const code = dto.code.trim().toLowerCase();
    if (!name) {
      throw new BadRequestException('角色名称不能为空');
    }

    if (code === SYSTEM_SUPER_ADMIN_ROLE_CODE) {
      throw new BadRequestException('不能创建系统保留角色编码');
    }

    await this.assertUniqueRole(name, code);

    try {
      const record = await this.prisma.role.create({
        data: {
          name,
          code,
          description: normalizeOptionalText(dto.description),
          isActive: dto.isActive ?? true,
        },
        select: {
          ...ADMIN_ROLE_SELECT,
          menus: { select: { menuId: true } },
        },
      });

      return this.mapRoleDetail(record);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  /**
   * 编辑普通角色基础信息
   *
   * @param id 角色主键
   * @param dto 角色名称、说明和启用状态
   * @returns 更新后的角色详情
   */
  async updateRole(id: number, dto: UpdateRoleDto): Promise<AdminRoleDetail> {
    const current = await this.getRoleRecordOrThrow(id);
    this.assertMutableRole(current.code);

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('角色名称不能为空');
    }

    await this.assertUniqueRole(name, undefined, id);

    try {
      const record = await this.prisma.role.update({
        where: { id },
        data: {
          name,
          description: normalizeOptionalText(dto.description),
          isActive: dto.isActive,
        },
        select: {
          ...ADMIN_ROLE_SELECT,
          menus: {
            select: { menuId: true },
            orderBy: { menuId: 'asc' },
          },
        },
      });

      return this.mapRoleDetail(record);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  /**
   * 删除没有绑定用户的普通角色
   *
   * @param id 角色主键
   */
  async deleteRole(id: number): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        code: true,
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    this.assertMutableRole(role.code);
    if (role._count.users > 0) {
      throw new BadRequestException('该角色仍绑定用户，请先解除用户角色关系');
    }

    await this.prisma.role.delete({ where: { id } });
  }

  /**
   * 替换普通角色的菜单与操作权限
   *
   * 服务端会自动补齐选中节点的全部父级，避免只分配子页面后导航树失去合法层级。停用或不存在的
   * 节点会被拒绝，超级管理员则始终通过内置规则获得全部权限，不允许手动分配。
   *
   * @param id 角色主键
   * @param dto 权限树选中的节点主键
   */
  async assignRoleMenus(id: number, dto: AssignRoleMenusDto): Promise<void> {
    const role = await this.getRoleRecordOrThrow(id);
    this.assertMutableRole(role.code);

    const menuRecords = await this.prisma.menu.findMany({
      select: { id: true, parentId: true, isActive: true },
    });
    const menusById = new Map(menuRecords.map((menu) => [menu.id, menu]));
    const assignedIds = new Set<number>();

    for (const menuId of dto.menuIds) {
      let currentId: number | null = menuId;
      while (currentId) {
        const menu = menusById.get(currentId);
        if (!menu || !menu.isActive) {
          throw new BadRequestException('菜单权限中包含不存在或已停用的节点');
        }

        assignedIds.add(menu.id);
        currentId = menu.parentId;
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.roleMenu.deleteMany({ where: { roleId: id } });
      if (assignedIds.size) {
        await transaction.roleMenu.createMany({
          data: [...assignedIds].map((menuId) => ({ roleId: id, menuId })),
        });
      }
    });
  }

  /**
   * 校验角色名称和编码没有被其他记录占用
   *
   * @param name 归一化后的角色名称
   * @param code 新增角色编码
   * @param currentId 编辑时排除的角色主键
   */
  private async assertUniqueRole(name: string, code?: string, currentId?: number): Promise<void> {
    const conflicts = await this.prisma.role.findMany({
      where: {
        id: currentId ? { not: currentId } : undefined,
        OR: [{ name }, ...(code ? [{ code }] : [])],
      },
      select: { name: true, code: true },
    });

    if (conflicts.some((role) => role.name === name)) {
      throw new ConflictException('角色名称已存在');
    }

    if (code && conflicts.some((role) => role.code === code)) {
      throw new ConflictException('角色编码已存在');
    }
  }

  /**
   * 把数据库唯一约束错误转换为稳定业务提示
   *
   * @param error Prisma 写入阶段抛出的未知错误
   */
  private rethrowUniqueConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('角色名称或编码已存在');
    }

    throw error;
  }

  /**
   * 获取角色最小记录，不存在时返回统一 404
   *
   * @param id 角色主键
   * @returns 角色主键与稳定编码
   */
  private async getRoleRecordOrThrow(id: number): Promise<{ id: number; code: string }> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, code: true },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  /**
   * 阻止修改系统内置超级管理员角色
   *
   * @param code 目标角色编码
   */
  private assertMutableRole(code: string): void {
    if (code === SYSTEM_SUPER_ADMIN_ROLE_CODE) {
      throw new BadRequestException('系统内置超级管理员角色不能修改');
    }
  }

  /**
   * 把数据库角色记录映射为浏览器安全契约
   *
   * @param record Prisma 角色列表记录
   * @returns 不暴露数据库关联对象的角色列表项
   */
  private mapRole(record: AdminRoleRecord): AdminRoleListItem {
    return {
      id: record.id,
      name: record.name,
      code: record.code,
      description: record.description,
      isActive: record.isActive,
      isSystem: record.code === SYSTEM_SUPER_ADMIN_ROLE_CODE,
      userCount: record._count.users,
      menuCount: record._count.menus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * 把数据库角色详情映射为浏览器安全契约
   *
   * @param record 包含菜单关联的 Prisma 角色记录
   * @returns 角色基础字段和已分配菜单主键
   */
  private mapRoleDetail(record: AdminRoleDetailRecord): AdminRoleDetail {
    return {
      ...this.mapRole(record),
      menuIds: record.menus.map((relation) => relation.menuId),
    };
  }

  /**
   * 把扁平菜单记录转换为角色分配使用的完整权限树
   *
   * @param records 已按同级顺序查询的菜单记录
   * @returns 包含停用节点与按钮权限的菜单树
   */
  private buildMenuTree(records: AdminRoleMenuRecord[]): AdminRoleMenuTreeNode[] {
    const nodes = new Map<number, AdminRoleMenuTreeNode>();
    const roots: AdminRoleMenuTreeNode[] = [];

    records.forEach((record) => {
      nodes.set(record.id, {
        id: record.id,
        parentId: record.parentId,
        name: record.name,
        type: record.type,
        isActive: record.isActive,
        children: [],
      });
    });

    records.forEach((record) => {
      const node = nodes.get(record.id);
      if (!node) {
        return;
      }

      const parent = record.parentId ? nodes.get(record.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
