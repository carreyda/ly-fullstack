import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { MenuType } from '@repo/database';

/**
 * 新增菜单节点 DTO
 *
 * 字段组合与父子层级等领域约束由菜单 Service 校验；DTO 只负责阻止未知字段、错误类型、超长文本和
 * 非法权限码进入业务层。
 */
export class CreateMenuDto {
  /**
   * 父节点主键；根节点为空
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number | null;

  /**
   * 菜单、目录或权限的展示名称
   */
  @IsString()
  @MaxLength(50)
  name!: string;

  /**
   * 目录、页面菜单或按钮权限类型
   */
  @IsEnum(MenuType)
  type!: MenuType;

  /**
   * 页面菜单的浏览器访问地址
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  routePath?: string | null;

  /**
   * 前端 Router 使用的稳定页面标识
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  routeName?: string | null;

  /**
   * 前端 Router 页面绑定元数据中的组件标识
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  component?: string | null;

  /**
   * 一级导航使用的 Lucide 图标名称
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string | null;

  /**
   * 按钮权限使用的三段式权限码
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/)
  permissionCode?: string | null;

  /**
   * 是否在管理后台导航中展示
   */
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  /**
   * 是否启用当前节点
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
