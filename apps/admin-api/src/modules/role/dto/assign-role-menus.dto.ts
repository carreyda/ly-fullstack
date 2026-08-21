import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

/**
 * 角色菜单分配 DTO
 */
export class AssignRoleMenusDto {
  /**
   * 权限树选中的菜单、目录和按钮权限主键
   */
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  menuIds!: number[];
}
