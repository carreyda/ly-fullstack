import { Module } from '@nestjs/common';

import { PublicConfigController } from './public-config.controller';
import { PublicConfigService } from './public-config.service';

/**
 * 面向 C 端的公共配置模块
 */
@Module({
  controllers: [PublicConfigController],
  providers: [PublicConfigService],
})
export class PublicConfigModule {}
