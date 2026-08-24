import type { AdminPublicConfigQueryParams, CreateAdminPublicConfigParams } from '@repo/shared/types';

import type { DataFilterModel, OperationType } from './base';

export type AdminPublicConfigFilterModel = AdminPublicConfigQueryParams & DataFilterModel;

export interface AdminPublicConfigFormModel extends Required<Omit<CreateAdminPublicConfigParams, 'description'>> {
  description: string;
}

export interface UsePublicConfigFormOptions {
  onSuccess: (operationType: OperationType) => void;
}
