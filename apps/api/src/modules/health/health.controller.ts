import { Controller, Get } from '@nestjs/common';

import type { HealthStatus } from '@repo/shared/types';

import { HEALTH_SERVICE_NAME } from '../../constants';

/**
 * 默认 C 端 API 健康检查 Controller
 */
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: HEALTH_SERVICE_NAME,
      timestamp: new Date().toISOString(),
    };
  }
}
