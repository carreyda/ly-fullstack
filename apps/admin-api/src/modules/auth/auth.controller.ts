import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';

import type { AdminLoginResponse, AdminSession } from '@repo/shared/types';

import { AdminJwtGuard, createDtoValidationPipe, CurrentAdmin } from '../../common';
import type { AuthenticatedAdmin } from '../../types';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

/**
 * 管理端登录与当前会话 Controller
 *
 * 登录接口公开访问；当前会话接口必须先经过 JWT Guard。Controller 只负责 HTTP 参数和响应映射，
 * 密码校验、Token 签发与 RBAC 查询全部留在 Service 层。
 */
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * 使用管理员账号和密码登录
   *
   * @param dto 已通过字段白名单、长度和类型校验的登录参数
   * @returns Access Token 和当前管理员 RBAC 会话
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(createDtoValidationPipe(AdminLoginDto)) dto: AdminLoginDto): Promise<AdminLoginResponse> {
    return this.authService.login(dto);
  }

  /**
   * 获取数据库最新的当前管理员会话
   *
   * JWT Guard 已经完成验签和数据库状态复查，此处只把内部访问上下文映射为 Shared HTTP 契约，
   * 不暴露密码哈希和 Prisma 关联记录。
   *
   * @param admin JWT Guard 写入请求的当前管理员访问上下文
   * @returns 管理员资料、可见菜单树和权限码
   */
  @Get('me')
  @UseGuards(AdminJwtGuard)
  getCurrentSession(@CurrentAdmin() admin: AuthenticatedAdmin): AdminSession {
    return {
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
