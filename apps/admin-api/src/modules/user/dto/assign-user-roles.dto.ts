import { ArrayUnique, IsArray, IsInt } from 'class-validator';

/**
 * 替换用户角色 DTO
 */
export class AssignUserRolesDto {
  /**
   * 用户需要绑定的普通角色主键
   */
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds!: number[];
}
