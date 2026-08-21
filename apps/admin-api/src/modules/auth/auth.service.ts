import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import type { AdminLoginResponse } from '@repo/shared/types';

import { PrismaService } from '../../prisma/prisma.service';
import type { AdminJwtPayload } from '../../types';
import { RbacAccessService } from '../rbac/rbac-access.service';
import type { AdminLoginDto } from './dto/admin-login.dto';

/**
 * 管理端账号密码认证服务
 *
 * 负责查询 RBAC 用户、比较 bcrypt 密码、确认账号拥有有效角色并签发 Access Token。
 * Token 只包含用户主键和登录名，角色、菜单和权限由 `RbacAccessService` 从数据库实时组装。
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(RbacAccessService) private readonly rbacAccessService: RbacAccessService,
  ) {}

  /**
   * 校验管理员账号密码并签发 Access Token
   *
   * 用户不存在、账号禁用和密码错误统一返回相同文案，避免调用方枚举有效账号。密码验证通过后仍需
   * 确认至少存在一个启用角色，没有有效角色的账号不能进入后台。
   *
   * @param dto 已通过显式 DTO Pipe 校验的登录参数
   * @returns Access Token、管理员资料、可见菜单和权限集合
   * @throws 账号密码不匹配、账号禁用或没有有效角色时抛出 401
   */
  async login(dto: AdminLoginDto): Promise<AdminLoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const admin = await this.rbacAccessService.getActiveAdmin(user.id);
    if (!admin) {
      throw new UnauthorizedException('账号尚未分配有效角色');
    }

    const payload: AdminJwtPayload = {
      sub: user.id,
      username: user.username,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        roles: admin.roles,
      },
      menus: admin.menus,
      permissions: admin.permissions,
    };
  }
}
