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

import type { AdminRoleDetail, AdminRoleListItem, AdminRoleMenuTreeNode, PaginationResult } from '@repo/shared/types';

import { AdminJwtGuard, createDtoValidationPipe, PermissionGuard, RequirePermissions } from '../../common';
import { AssignRoleMenusDto } from './dto/assign-role-menus.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';

/**
 * 角色管理 Controller
 *
 * 基础信息 CRUD 和菜单分配分别使用独立权限码。Controller 只处理 HTTP 参数、状态码和 DTO 校验，
 * 系统角色保护、唯一性、用户绑定与菜单层级约束统一由 `RoleService` 执行。
 */
@Controller('roles')
@UseGuards(AdminJwtGuard, PermissionGuard)
export class RoleController {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  /**
   * 分页查询角色列表
   *
   * @param query 分页与筛选参数
   * @returns 角色分页结果
   */
  @Get()
  @RequirePermissions('system:role:list')
  getRoles(
    @Query(createDtoValidationPipe(RoleQueryDto)) query: RoleQueryDto,
  ): Promise<PaginationResult<AdminRoleListItem>> {
    return this.roleService.getRoles(query);
  }

  /**
   * 获取角色菜单分配使用的完整权限树
   *
   * @returns 包含目录、页面和按钮权限的菜单树
   */
  @Get('menu-tree')
  @RequirePermissions('system:role:assign-menu')
  getRoleMenuTree(): Promise<AdminRoleMenuTreeNode[]> {
    return this.roleService.getRoleMenuTree();
  }

  /**
   * 获取指定角色详情
   *
   * @param id 角色主键
   * @returns 角色基础信息和已分配菜单主键
   */
  @Get(':id')
  @RequirePermissions('system:role:list')
  getRole(@Param('id', ParseIntPipe) id: number): Promise<AdminRoleDetail> {
    return this.roleService.getRole(id);
  }

  /**
   * 新增普通角色
   *
   * @param dto 角色名称、编码、说明和状态
   * @returns 新增后的角色详情
   */
  @Post()
  @RequirePermissions('system:role:create')
  createRole(@Body(createDtoValidationPipe(CreateRoleDto)) dto: CreateRoleDto): Promise<AdminRoleDetail> {
    return this.roleService.createRole(dto);
  }

  /**
   * 编辑普通角色基础信息
   *
   * @param id 角色主键
   * @param dto 角色名称、说明和启用状态
   * @returns 更新后的角色详情
   */
  @Put(':id')
  @RequirePermissions('system:role:update')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(UpdateRoleDto)) dto: UpdateRoleDto,
  ): Promise<AdminRoleDetail> {
    return this.roleService.updateRole(id, dto);
  }

  /**
   * 替换普通角色的菜单权限
   *
   * @param id 角色主键
   * @param dto 权限树选中的菜单主键
   */
  @Put(':id/menus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:role:assign-menu')
  assignRoleMenus(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(AssignRoleMenusDto)) dto: AssignRoleMenusDto,
  ): Promise<void> {
    return this.roleService.assignRoleMenus(id, dto);
  }

  /**
   * 删除没有绑定用户的普通角色
   *
   * @param id 角色主键
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:role:delete')
  deleteRole(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roleService.deleteRole(id);
  }
}
