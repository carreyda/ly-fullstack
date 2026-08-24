import type {
  AdminDictionaryItemQueryParams,
  AdminDictionaryQueryParams,
  CreateAdminDictionaryItemParams,
  CreateAdminDictionaryParams,
} from '@repo/shared/types';

import type { DataFilterModel, OperationType } from './base';

export type AdminDictionaryFilterModel = AdminDictionaryQueryParams & DataFilterModel;
export type AdminDictionaryItemFilterModel = AdminDictionaryItemQueryParams & DataFilterModel;

export interface AdminDictionaryFormModel extends Required<Omit<CreateAdminDictionaryParams, 'description'>> {
  description: string;
}

export interface AdminDictionaryItemFormModel extends Required<Omit<CreateAdminDictionaryItemParams, 'description'>> {
  description: string;
}

export interface UseDictionaryFormOptions {
  onSuccess: (operationType: OperationType) => void;
}

export interface UseDictionaryItemFormOptions {
  onSuccess: () => void;
}
