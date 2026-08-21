import { CreateMenuDto } from './create-menu.dto';

/**
 * 编辑菜单节点 DTO
 *
 * 编辑接口沿用新增接口的完整字段结构，避免部分更新后残留与当前节点类型不相容的数据。
 */
export class UpdateMenuDto extends CreateMenuDto {}
