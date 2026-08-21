import { IsString, Matches, MaxLength } from 'class-validator';

/**
 * 为页面菜单生成标准 CRUD 权限 DTO
 */
export class CreateStandardPermissionsDto {
  /**
   * 权限码的模块与资源前缀，例如 `system:user`
   */
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/)
  permissionPrefix!: string;
}
