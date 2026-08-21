import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

/**
 * 单个菜单节点拖拽完成后的父级和顺序
 */
export class MenuReorderItemDto {
  /**
   * 菜单节点主键
   */
  @IsInt()
  @Min(1)
  id!: number;

  /**
   * 新父节点主键；根节点为空
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId!: number | null;

  /**
   * 新的同级顺序，从零开始
   */
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

/**
 * 批量保存菜单树拖拽结果 DTO
 */
export class ReorderMenusDto {
  /**
   * 当前导航树中全部非按钮节点的最终位置快照
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => MenuReorderItemDto)
  items!: MenuReorderItemDto[];
}
