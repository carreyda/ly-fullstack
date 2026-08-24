import { serviceBase } from '@/services/service-base';

import {
  API_ADMIN_DICTIONARIES,
  getAdminDictionaryApi,
  getAdminDictionaryItemApi,
  getAdminDictionaryItemsApi,
} from './api';

import type {
  AdminDictionaryItemListItem,
  AdminDictionaryItemQueryParams,
  AdminDictionaryListItem,
  AdminDictionaryQueryParams,
  CreateAdminDictionaryItemParams,
  CreateAdminDictionaryParams,
  PaginationResult,
  UpdateAdminDictionaryItemParams,
  UpdateAdminDictionaryParams,
} from '@repo/shared/types';

export const fetchAdminDictionaries = (
  params: AdminDictionaryQueryParams,
): Promise<PaginationResult<AdminDictionaryListItem>> =>
  serviceBase.get<PaginationResult<AdminDictionaryListItem>, AdminDictionaryQueryParams>(
    API_ADMIN_DICTIONARIES,
    params,
  );

export const createAdminDictionary = (params: CreateAdminDictionaryParams): Promise<AdminDictionaryListItem> =>
  serviceBase.post<AdminDictionaryListItem, CreateAdminDictionaryParams>(API_ADMIN_DICTIONARIES, params);

export const updateAdminDictionary = (
  id: number,
  params: UpdateAdminDictionaryParams,
): Promise<AdminDictionaryListItem> =>
  serviceBase.put<AdminDictionaryListItem, UpdateAdminDictionaryParams>(getAdminDictionaryApi(id), params);

export const deleteAdminDictionary = (id: number): Promise<void> => serviceBase.delete<void>(getAdminDictionaryApi(id));

export const fetchAdminDictionaryItems = (
  dictionaryId: number,
  params: AdminDictionaryItemQueryParams,
): Promise<PaginationResult<AdminDictionaryItemListItem>> =>
  serviceBase.get<PaginationResult<AdminDictionaryItemListItem>, AdminDictionaryItemQueryParams>(
    getAdminDictionaryItemsApi(dictionaryId),
    params,
  );

export const createAdminDictionaryItem = (
  dictionaryId: number,
  params: CreateAdminDictionaryItemParams,
): Promise<AdminDictionaryItemListItem> =>
  serviceBase.post<AdminDictionaryItemListItem, CreateAdminDictionaryItemParams>(
    getAdminDictionaryItemsApi(dictionaryId),
    params,
  );

export const updateAdminDictionaryItem = (
  dictionaryId: number,
  itemId: number,
  params: UpdateAdminDictionaryItemParams,
): Promise<AdminDictionaryItemListItem> =>
  serviceBase.put<AdminDictionaryItemListItem, UpdateAdminDictionaryItemParams>(
    getAdminDictionaryItemApi(dictionaryId, itemId),
    params,
  );

export const deleteAdminDictionaryItem = (dictionaryId: number, itemId: number): Promise<void> =>
  serviceBase.delete<void>(getAdminDictionaryItemApi(dictionaryId, itemId));
