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

import type { AdminPublicConfigListItem, PaginationResult } from '@repo/shared/types';

import { AdminJwtGuard, createDtoValidationPipe, PermissionGuard, RequirePermissions } from '../../common';
import { CreatePublicConfigDto } from './dto/create-public-config.dto';
import { PublicConfigQueryDto } from './dto/public-config-query.dto';
import { UpdatePublicConfigDto } from './dto/update-public-config.dto';
import { PublicConfigService } from './public-config.service';

/**
 * 公共配置管理 Controller
 */
@Controller('public-configs')
@UseGuards(AdminJwtGuard, PermissionGuard)
export class PublicConfigController {
  constructor(@Inject(PublicConfigService) private readonly publicConfigService: PublicConfigService) {}

  @Get()
  @RequirePermissions('system:config:list')
  getConfigs(
    @Query(createDtoValidationPipe(PublicConfigQueryDto)) query: PublicConfigQueryDto,
  ): Promise<PaginationResult<AdminPublicConfigListItem>> {
    return this.publicConfigService.getConfigs(query);
  }

  @Post()
  @RequirePermissions('system:config:create')
  createConfig(
    @Body(createDtoValidationPipe(CreatePublicConfigDto)) dto: CreatePublicConfigDto,
  ): Promise<AdminPublicConfigListItem> {
    return this.publicConfigService.createConfig(dto);
  }

  @Put(':id')
  @RequirePermissions('system:config:update')
  updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body(createDtoValidationPipe(UpdatePublicConfigDto)) dto: UpdatePublicConfigDto,
  ): Promise<AdminPublicConfigListItem> {
    return this.publicConfigService.updateConfig(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system:config:delete')
  deleteConfig(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.publicConfigService.deleteConfig(id);
  }
}
