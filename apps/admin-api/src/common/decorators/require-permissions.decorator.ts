import { SetMetadata } from '@nestjs/common';

import type { PermissionCode } from '@repo/shared/types';

/**
 * 权限 Guard 读取 Controller 权限声明时使用的元数据键
 *
 * 该键只在 `RequirePermissions` 和 `PermissionGuard` 之间共享，业务模块不得直接读写该元数据。
 */
export const REQUIRED_PERMISSIONS_METADATA_KEY = 'required-permissions';

/**
 * 声明访问 Controller 或接口必须同时具备的权限
 *
 * 权限码与数据库按钮节点和前端按钮显隐共用同一份三段式标识。传入多个权限时采用 AND 语义，
 * 当前管理员必须全部拥有才允许访问。
 *
 * @param permissions 当前接口要求同时具备的权限码
 * @returns 供 NestJS 写入 Controller 元数据的装饰器
 */
export const RequirePermissions = (...permissions: PermissionCode[]): MethodDecorator & ClassDecorator => {
  return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
};
