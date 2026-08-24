import { serviceBase } from '@/services/service-base';

import { API_ADMIN_PUBLIC_CONFIGS, getAdminPublicConfigApi } from './api';

import type {
  AdminPublicConfigListItem,
  AdminPublicConfigQueryParams,
  CreateAdminPublicConfigParams,
  PaginationResult,
  UpdateAdminPublicConfigParams,
} from '@repo/shared/types';

export const fetchAdminPublicConfigs = (
  params: AdminPublicConfigQueryParams,
): Promise<PaginationResult<AdminPublicConfigListItem>> =>
  serviceBase.get<PaginationResult<AdminPublicConfigListItem>, AdminPublicConfigQueryParams>(
    API_ADMIN_PUBLIC_CONFIGS,
    params,
  );

export const createAdminPublicConfig = (params: CreateAdminPublicConfigParams): Promise<AdminPublicConfigListItem> =>
  serviceBase.post<AdminPublicConfigListItem, CreateAdminPublicConfigParams>(API_ADMIN_PUBLIC_CONFIGS, params);

export const updateAdminPublicConfig = (
  id: number,
  params: UpdateAdminPublicConfigParams,
): Promise<AdminPublicConfigListItem> =>
  serviceBase.put<AdminPublicConfigListItem, UpdateAdminPublicConfigParams>(getAdminPublicConfigApi(id), params);

export const deleteAdminPublicConfig = (id: number): Promise<void> =>
  serviceBase.delete<void>(getAdminPublicConfigApi(id));
