import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';

/**
 * 字典管理模块
 */
@Module({
  imports: [AuthModule, RbacModule, PrismaModule],
  controllers: [DictionaryController],
  providers: [DictionaryService],
})
export class DictionaryModule {}
