import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * 默认 C 端 API 的全局数据库模块
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
