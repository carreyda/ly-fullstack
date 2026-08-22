import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { hash } from 'bcryptjs';

import type { AdminUserListItem, AdminUserRoleOption, PaginationResult } from '@repo/shared/types';

import { SYSTEM_SUPER_ADMIN_ROLE_CODE } from '../../constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminUserRecord } from '../../types';
import type { AssignUserRolesDto } from './dto/assign-user-roles.dto';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserQueryDto } from './dto/user-query.dto';

/**
 * bcrypt 密码哈希计算轮数
 */
const PASSWORD_HASH_ROUNDS = 12;

/**
 * 用户列表与写入结果共用的数据库字段
 */
const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { roleId: 'asc' },
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
 * 用户管理业务服务
 *
 * 负责分页筛选、账号基础信息 CRUD、角色分配和密码重置。系统超级管理员通过角色编码识别，
 * 禁止停用、删除或更改角色；当前登录账号也不能停用、删除或改写自身角色，避免制造失效会话。
 */
@Injectable()
export class UserService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * 分页查询后台用户
   *
   * @param query 已通过 DTO 校验的分页与筛选参数
   * @returns 用户、角色摘要和分页信息
   */
  async getUsers(query: UserQueryDto): Promise<PaginationResult<AdminUserListItem>> {
    const keyword = query.keyword?.trim();
    const where: Prisma.UserWhereInput = {
      isActive: query.status ? query.status === 'ACTIVE' : undefined,
      roles: query.roleId ? { some: { roleId: query.roleId } } : undefined,
      OR: keyword
        ? [
            { username: { contains: keyword, mode: 'insensitive' } },
            { displayName: { contains: keyword, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        orderBy: [{ id: 'desc' }],
        skip: (query.pageNum - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      list: records.map((record) => this.mapUser(record)),
      total,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    };
  }

  /**
   * 获取角色筛选和用户角色分配使用的普通角色选项
   *
   * 返回全部角色用于准确筛选历史关联；系统角色和停用角色由前端保留筛选能力但禁止建立新关联。
   *
   * @returns 按名称排列的全部角色及状态标识
   */
  async getRoleOptions(): Promise<AdminUserRoleOption[]> {
    const roles = await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return roles.map((role) => ({
      ...role,
      isSystem: role.code === SYSTEM_SUPER_ADMIN_ROLE_CODE,
    }));
  }

  /**
   * 新增后台用户
   *
   * @param dto 登录名、初始密码、展示名称和状态
   * @returns 新增后的用户列表记录
   */
  async createUser(dto: CreateUserDto): Promise<AdminUserListItem> {
    const username = dto.username.trim().toLowerCase();
    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);

    try {
      const record = await this.prisma.user.create({
        data: {
          username,
          passwordHash,
          displayName: normalizeOptionalText(dto.displayName),
          isActive: dto.isActive ?? true,
        },
        select: ADMIN_USER_SELECT,
      });

      return this.mapUser(record);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  /**
   * 编辑用户展示名称和启用状态
   *
   * @param id 用户主键
   * @param dto 展示名称和启用状态
   * @param actorId 当前登录管理员主键
   * @returns 更新后的用户列表记录
   */
  async updateUser(id: number, dto: UpdateUserDto, actorId: number): Promise<AdminUserListItem> {
    const current = await this.getUserProtectionRecordOrThrow(id);
    if (!dto.isActive && this.isSystemUser(current)) {
      throw new BadRequestException('系统超级管理员不能停用');
    }

    if (!dto.isActive && id === actorId) {
      throw new BadRequestException('不能停用当前登录账号');
    }

    const record = await this.prisma.user.update({
      where: { id },
      data: {
        displayName: normalizeOptionalText(dto.displayName),
        isActive: dto.isActive,
      },
      select: ADMIN_USER_SELECT,
    });

    return this.mapUser(record);
  }

  /**
   * 替换普通用户的角色关联
   *
   * @param id 用户主键
   * @param dto 需要保留的普通角色主键
   * @param actorId 当前登录管理员主键
   */
  async assignUserRoles(id: number, dto: AssignUserRolesDto, actorId: number): Promise<void> {
    const current = await this.getUserProtectionRecordOrThrow(id);
    if (this.isSystemUser(current)) {
      throw new BadRequestException('系统超级管理员的角色不能修改');
    }

    if (id === actorId) {
      throw new BadRequestException('不能修改当前登录账号的角色');
    }

    const roles = dto.roleIds.length
      ? await this.prisma.role.findMany({
          where: { id: { in: dto.roleIds } },
          select: { id: true, code: true, isActive: true },
        })
      : [];
    if (
      roles.length !== dto.roleIds.length ||
      roles.some((role) => !role.isActive || role.code === SYSTEM_SUPER_ADMIN_ROLE_CODE)
    ) {
      throw new BadRequestException('角色列表中包含不存在、已停用或系统保留角色');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length) {
        await transaction.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    });
  }

  /**
   * 重新生成并覆盖指定用户的密码哈希
   *
   * @param id 用户主键
   * @param dto 新密码
   */
  async resetUserPassword(id: number, dto: ResetUserPasswordDto): Promise<void> {
    await this.getUserProtectionRecordOrThrow(id);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(dto.password, PASSWORD_HASH_ROUNDS) },
    });
  }

  /**
   * 删除普通后台用户
   *
   * @param id 用户主键
   * @param actorId 当前登录管理员主键
   */
  async deleteUser(id: number, actorId: number): Promise<void> {
    const current = await this.getUserProtectionRecordOrThrow(id);
    if (this.isSystemUser(current)) {
      throw new BadRequestException('系统超级管理员不能删除');
    }

    if (id === actorId) {
      throw new BadRequestException('不能删除当前登录账号');
    }

    await this.prisma.user.delete({ where: { id } });
  }

  /**
   * 查询用户保护判断需要的最小记录
   *
   * @param id 用户主键
   * @returns 用户主键和角色编码
   */
  private async getUserProtectionRecordOrThrow(id: number): Promise<{
    id: number;
    roles: Array<{ role: { code: string } }>;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        roles: {
          select: { role: { select: { code: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 判断用户是否绑定系统超级管理员角色
   *
   * @param user 用户保护记录
   * @returns 绑定超级管理员角色时返回 `true`
   */
  private isSystemUser(user: { roles: Array<{ role: { code: string } }> }): boolean {
    return user.roles.some(({ role }) => role.code === SYSTEM_SUPER_ADMIN_ROLE_CODE);
  }

  /**
   * 把数据库用户记录映射为浏览器安全契约
   *
   * @param record Prisma 用户列表记录
   * @returns 不包含密码哈希和关系中间表的用户记录
   */
  private mapUser(record: AdminUserRecord): AdminUserListItem {
    const roles = record.roles.map(({ role }) => role);
    return {
      id: record.id,
      username: record.username,
      displayName: record.displayName,
      isActive: record.isActive,
      isSystem: roles.some((role) => role.code === SYSTEM_SUPER_ADMIN_ROLE_CODE),
      roles,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * 把数据库唯一约束错误转换为稳定业务提示
   *
   * @param error Prisma 写入阶段抛出的未知错误
   */
  private rethrowUniqueConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('登录名已存在');
    }

    throw error;
  }
}
