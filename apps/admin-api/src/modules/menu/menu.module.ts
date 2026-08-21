import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

/**
 * 菜单管理模块
 *
 * 复用认证模块导出的 JWT 与权限 Guard，通过 RBAC 模块满足认证守卫的访问上下文依赖，并通过
 * Prisma 模块访问五表 RBAC 中的菜单和角色关联。
 */
@Module({
  imports: [AuthModule, RbacModule, PrismaModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
