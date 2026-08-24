import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@repo/shared/types';

import { HEALTH_SERVICE_NAME } from '../../constants';

/**
 * 健康检查控制器
 *
 * 只暴露服务存活状态，不访问数据库，也不承载业务鉴权逻辑，便于本地开发和部署探针快速判断 API 服务是否启动。
 */
@Controller('health')
export class HealthController {
  /**
   * 获取 API 服务健康状态
   *
   * @returns 当前 API 服务的健康检查结果
   */
  @Get()
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: HEALTH_SERVICE_NAME,
      timestamp: new Date().toISOString(),
    };
  }
}
