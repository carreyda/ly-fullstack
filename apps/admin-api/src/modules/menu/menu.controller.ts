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
  UseGuards,
} from '@nestjs/common';

import type { AdminMenuTreeNode, CreateStandardMenuPermissionsResult } from '@repo/shared/types';

import { AdminJwtGuard, createDtoValidationPipe, PermissionGuard, RequirePermissions } from '../../common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateStandardPermissionsDto } from './dto/create-standard-permissions.dto';
import { ReorderMenusDto } from './dto/reorder-menus.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuService } from './menu.service';

/**
 * 菜单管理 Controller
 *
 * 所有接口都先校验管理端 JWT，再按数据库按钮权限执行细粒度授权。Controller 只负责 HTTP 参数和
 * 响应状态，树结构、父子约束和数据库事务统一交给 `MenuService`。
 */
@Controller('menus')
@UseGuards(AdminJwtGuard, PermissionGuard)
export class MenuController {
  constructor(@Inject(MenuService) private readonly menuService: MenuService) {}

  /**
   * 获取包含按钮权限和停用节点的完整菜单管理树
   *
   * @returns 完整菜单树
   */
  @Get('tree')
  @RequirePermissions('system:menu:list')
  getMenuTree(): Promise<AdminMenuTreeNode[]> {
    return this.menuService.getMenuTree();
  }

  /**
   * 新增菜单、目录或操作权限
   *
   * @param dto 已通过显式 DTO Pipe 校验的新增参数
   * @returns 新增后的菜单节点
   */
  @Post()
  @RequirePermissions('system:menu:create')
  createMenu(@Body(createDtoValidationPipe(CreateMenuDto)) dto: CreateMenuDto): Promise<AdminMenuTreeNode> {
    return this.menuService.createMenu(dto);
  }

  /**
   * 批量保存拖拽后的菜单父级和排序
   *
   * @param dto 全部非按钮节点的最终位置快照
   */
  @Put('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:menu:update')
  reorderMenus(@Body(createDtoValidationPipe(ReorderMenusDto)) dto: ReorderMenusDto): Promise<void> {
    return this.menuService.reorderMenus(dto);
  }

  /**
   * 编辑指定菜单节点
   *
   * @param id 菜单主键
   * @param dto 已通过显式 DTO Pipe 校验的完整编辑参数
   * @returns 更新后的菜单节点
   */
  @Put(':id')
  @RequirePermissions('system:menu:update')
  updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(UpdateMenuDto)) dto: UpdateMenuDto,
  ): Promise<AdminMenuTreeNode> {
    return this.menuService.updateMenu(id, dto);
  }

  /**
   * 为页面菜单补齐标准 CRUD 权限
   *
   * @param id 页面菜单主键
   * @param dto 两段式权限前缀
   * @returns 本次实际新增的权限数量
   */
  @Post(':id/standard-permissions')
  @RequirePermissions('system:menu:create')
  createStandardPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(CreateStandardPermissionsDto)) dto: CreateStandardPermissionsDto,
  ): Promise<CreateStandardMenuPermissionsResult> {
    return this.menuService.createStandardPermissions(id, dto);
  }

  /**
   * 删除没有子节点的菜单或操作权限
   *
   * @param id 菜单主键
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:menu:delete')
  deleteMenu(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.menuService.deleteMenu(id);
  }
}
