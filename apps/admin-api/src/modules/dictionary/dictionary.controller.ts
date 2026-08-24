import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AdminDictionaryItemListItem, AdminDictionaryListItem, PaginationResult } from '@repo/shared/types';

import { AdminJwtGuard, createDtoValidationPipe, PermissionGuard, RequirePermissions } from '../../common';
import { DictionaryService } from './dictionary.service';
import { CreateDictionaryDto } from './dto/create-dictionary.dto';
import { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import { DictionaryItemQueryDto } from './dto/dictionary-item-query.dto';
import { DictionaryQueryDto } from './dto/dictionary-query.dto';
import { UpdateDictionaryDto } from './dto/update-dictionary.dto';
import { UpdateDictionaryItemDto } from './dto/update-dictionary-item.dto';

/**
 * 字典和字典项管理 Controller
 */
@Controller('dictionaries')
@UseGuards(AdminJwtGuard, PermissionGuard)
export class DictionaryController {
  constructor(@Inject(DictionaryService) private readonly dictionaryService: DictionaryService) {}

  @Get()
  @RequirePermissions('system:dictionary:list')
  getDictionaries(
    @Query(createDtoValidationPipe(DictionaryQueryDto)) query: DictionaryQueryDto,
  ): Promise<PaginationResult<AdminDictionaryListItem>> {
    return this.dictionaryService.getDictionaries(query);
  }

  @Post()
  @RequirePermissions('system:dictionary:create')
  createDictionary(
    @Body(createDtoValidationPipe(CreateDictionaryDto)) dto: CreateDictionaryDto,
  ): Promise<AdminDictionaryListItem> {
    return this.dictionaryService.createDictionary(dto);
  }

  @Put(':id')
  @RequirePermissions('system:dictionary:update')
  updateDictionary(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(UpdateDictionaryDto)) dto: UpdateDictionaryDto,
  ): Promise<AdminDictionaryListItem> {
    return this.dictionaryService.updateDictionary(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:dictionary:delete')
  deleteDictionary(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dictionaryService.deleteDictionary(id);
  }

  @Get(':dictionaryId/items')
  @RequirePermissions('system:dictionary-item:list')
  getDictionaryItems(
    @Param('dictionaryId', ParseIntPipe) dictionaryId: number,
    @Query(createDtoValidationPipe(DictionaryItemQueryDto)) query: DictionaryItemQueryDto,
  ): Promise<PaginationResult<AdminDictionaryItemListItem>> {
    return this.dictionaryService.getDictionaryItems(dictionaryId, query);
  }

  @Post(':dictionaryId/items')
  @RequirePermissions('system:dictionary-item:create')
  createDictionaryItem(
    @Param('dictionaryId', ParseIntPipe) dictionaryId: number,
    @Body(createDtoValidationPipe(CreateDictionaryItemDto)) dto: CreateDictionaryItemDto,
  ): Promise<AdminDictionaryItemListItem> {
    return this.dictionaryService.createDictionaryItem(dictionaryId, dto);
  }

  @Put(':dictionaryId/items/:itemId')
  @RequirePermissions('system:dictionary-item:update')
  updateDictionaryItem(
    @Param('dictionaryId', ParseIntPipe) dictionaryId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body(createDtoValidationPipe(UpdateDictionaryItemDto)) dto: UpdateDictionaryItemDto,
  ): Promise<AdminDictionaryItemListItem> {
    return this.dictionaryService.updateDictionaryItem(dictionaryId, itemId, dto);
  }

  @Delete(':dictionaryId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:dictionary-item:delete')
  deleteDictionaryItem(
    @Param('dictionaryId', ParseIntPipe) dictionaryId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<void> {
    return this.dictionaryService.deleteDictionaryItem(dictionaryId, itemId);
  }
}
