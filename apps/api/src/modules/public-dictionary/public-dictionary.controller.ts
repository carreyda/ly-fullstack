import { Controller, Get, Inject, Param } from '@nestjs/common';

import type { PublicDictionary } from '@repo/shared/types';

import { PublicDictionaryService } from './public-dictionary.service';

/**
 * 面向 C 端的免登录字典接口
 */
@Controller('public/dictionaries')
export class PublicDictionaryController {
  constructor(@Inject(PublicDictionaryService) private readonly service: PublicDictionaryService) {}

  @Get(':code')
  getDictionary(@Param('code') code: string): Promise<PublicDictionary> {
    return this.service.getDictionary(code);
  }
}
