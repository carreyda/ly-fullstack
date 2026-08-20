import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/database';

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

/**
 * PostgreSQL 数据访问服务
 *
 * 应用只创建一个 Prisma Client 实例，避免每个业务模块各自维护连接池。模块初始化时主动连接，
 * 连接失败会阻止 API 服务启动；进程收到关闭信号时断开连接，避免开发热重启残留数据库连接。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ConfigService) configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 300_000,
    });

    super({ adapter });
  }

  /**
   * 建立 PostgreSQL 连接并尽早暴露无效连接配置。
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * 释放 Prisma 持有的数据库连接。
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
