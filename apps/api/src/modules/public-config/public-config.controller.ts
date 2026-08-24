import { Controller, Get, Inject, Param } from '@nestjs/common';

import type { PublicConfigValue } from '@repo/shared/types';

import { PublicConfigService } from './public-config.service';

/**
 * 面向 C 端的免登录公共配置接口
 */
@Controller('public/configs')
export class PublicConfigController {
  constructor(@Inject(PublicConfigService) private readonly service: PublicConfigService) {}

  @Get(':key')
  getConfig(@Param('key') key: string): Promise<PublicConfigValue> {
    return this.service.getConfig(key);
  }
}
