import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';

/**
 * 健康检查模块
 *
 * 当前只注册 `HealthController`，后续如果需要增加数据库、缓存等依赖检查，可以在该模块内继续扩展。
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
