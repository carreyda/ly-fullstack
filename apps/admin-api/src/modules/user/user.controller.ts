import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AdminUserListItem, AdminUserRoleOption, PaginationResult } from '@repo/shared/types';

import {
  AdminJwtGuard,
  createDtoValidationPipe,
  CurrentAdmin,
  PermissionGuard,
  RequirePermissions,
} from '../../common';
import type { AuthenticatedAdmin } from '../../types';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserService } from './user.service';

/**
 * 用户管理 Controller
 *
 * 基础信息 CRUD、角色分配和密码重置保持独立接口。Controller 只负责 HTTP 参数、权限码与 DTO 校验，
 * 超级管理员和当前账号保护统一由 `UserService` 执行。
 */
@Controller('users')
@UseGuards(AdminJwtGuard, PermissionGuard)
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  /**
   * 分页查询后台用户
   *
   * @param query 分页与筛选参数
   * @returns 用户分页结果
   */
  @Get()
  @RequirePermissions('system:user:list')
  getUsers(
    @Query(createDtoValidationPipe(UserQueryDto)) query: UserQueryDto,
  ): Promise<PaginationResult<AdminUserListItem>> {
    return this.userService.getUsers(query);
  }

  /**
   * 获取用户筛选与角色分配使用的角色选项
   *
   * @returns 全部角色及其状态、系统角色标识
   */
  @Get('role-options')
  @RequirePermissions('system:user:list')
  getRoleOptions(): Promise<AdminUserRoleOption[]> {
    return this.userService.getRoleOptions();
  }

  /**
   * 新增后台用户
   *
   * @param dto 登录名、初始密码、展示名称和状态
   * @returns 新增后的用户记录
   */
  @Post()
  @RequirePermissions('system:user:create')
  createUser(@Body(createDtoValidationPipe(CreateUserDto)) dto: CreateUserDto): Promise<AdminUserListItem> {
    return this.userService.createUser(dto);
  }

  /**
   * 编辑用户展示名称与启用状态
   *
   * @param id 用户主键
   * @param dto 展示名称和状态
   * @param admin 当前登录管理员
   * @returns 更新后的用户记录
   */
  @Put(':id')
  @RequirePermissions('system:user:update')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(UpdateUserDto)) dto: UpdateUserDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<AdminUserListItem> {
    return this.userService.updateUser(id, dto, admin.id);
  }

  /**
   * 替换普通用户的角色关联
   *
   * @param id 用户主键
   * @param dto 需要保留的角色主键
   * @param admin 当前登录管理员
   */
  @Put(':id/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:user:assign-role')
  assignUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(AssignUserRolesDto)) dto: AssignUserRolesDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<void> {
    return this.userService.assignUserRoles(id, dto, admin.id);
  }

  /**
   * 管理员重置指定用户密码
   *
   * @param id 用户主键
   * @param dto 新密码
   */
  @Put(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:user:update')
  resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(ResetUserPasswordDto)) dto: ResetUserPasswordDto,
  ): Promise<void> {
    return this.userService.resetUserPassword(id, dto);
  }

  /**
   * 删除普通后台用户
   *
   * @param id 用户主键
   * @param admin 当前登录管理员
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:user:delete')
  deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: AuthenticatedAdmin): Promise<void> {
    return this.userService.deleteUser(id, admin.id);
  }
}
