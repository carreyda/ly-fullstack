import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * 用户管理模块
 *
 * 复用管理端认证与 RBAC Guard，并通过 Prisma 模块维护用户和用户角色关系。
 */
@Module({
  imports: [AuthModule, RbacModule, PrismaModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
