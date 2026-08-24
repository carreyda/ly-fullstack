import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';

/**
 * 默认 C 端 API 健康检查模块
 */
@Module({ controllers: [HealthController] })
export class HealthModule {}
