import { Module } from '@nestjs/common';

import { PublicDictionaryController } from './public-dictionary.controller';
import { PublicDictionaryService } from './public-dictionary.service';

/**
 * 面向 C 端的公共字典模块
 */
@Module({
  controllers: [PublicDictionaryController],
  providers: [PublicDictionaryService],
})
export class PublicDictionaryModule {}
