import { Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * PostgreSQL 数据访问模块
 *
 * 业务模块必须显式导入该模块后才能注入 `PrismaService`，使数据库依赖在模块边界中保持可见。
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
