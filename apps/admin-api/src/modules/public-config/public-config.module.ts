import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { PublicConfigController } from './public-config.controller';
import { PublicConfigService } from './public-config.service';

/**
 * 公共配置管理模块
 */
@Module({
  imports: [AuthModule, RbacModule, PrismaModule],
  controllers: [PublicConfigController],
  providers: [PublicConfigService],
})
export class PublicConfigModule {}
