import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { RbacAccessService } from './rbac-access.service';

/**
 * RBAC 访问上下文模块
 *
 * 当前只提供认证链路需要的角色、菜单和权限查询服务。后续用户、角色、菜单 CRUD 可以分别建立
 * 业务模块并依赖该能力，不把 JWT、Controller 或浏览器契约放入数据库包。
 */
@Module({
  imports: [PrismaModule],
  providers: [RbacAccessService],
  exports: [RbacAccessService],
})
export class RbacModule {}
