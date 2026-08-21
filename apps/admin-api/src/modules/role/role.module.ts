import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

/**
 * 角色管理模块
 *
 * 复用管理端认证与 RBAC Guard，并通过 Prisma 模块维护角色、用户角色和角色菜单关系。
 */
@Module({
  imports: [AuthModule, RbacModule, PrismaModule],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
