import type { PaginationParams } from './pagination';

/**
 * 字典和字典项列表支持的启用状态筛选值
 */
export type AdminDictionaryStatusFilter = 'ACTIVE' | 'INACTIVE';

/**
 * 字典管理列表查询参数
 */
export interface AdminDictionaryQueryParams extends PaginationParams {
  /**
   * 同时匹配字典名称和编码的搜索词
   */
  keyword?: string;

  /**
   * 字典启用状态
   */
  status?: AdminDictionaryStatusFilter;
}

/**
 * 字典管理列表记录
 */
export interface AdminDictionaryListItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 新增字典请求参数
 */
export interface CreateAdminDictionaryParams {
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 编辑字典请求参数
 */
export interface UpdateAdminDictionaryParams {
  name: string;
  description?: string | null;
  isActive: boolean;
}

/**
 * 字典项列表查询参数
 */
export interface AdminDictionaryItemQueryParams extends PaginationParams {
  keyword?: string;
  status?: AdminDictionaryStatusFilter;
}

/**
 * 字典项管理列表记录
 */
export interface AdminDictionaryItemListItem {
  id: number;
  dictionaryId: number;
  label: string;
  value: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 新增字典项请求参数
 */
export interface CreateAdminDictionaryItemParams {
  label: string;
  value: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * 编辑字典项请求参数
 */
export interface UpdateAdminDictionaryItemParams extends CreateAdminDictionaryItemParams {
  sortOrder: number;
  isActive: boolean;
}

/**
 * 公共 API 返回的字典项
 */
export interface PublicDictionaryItem {
  label: string;
  value: string;
}

/**
 * 公共 API 返回的字典数据
 */
export interface PublicDictionary {
  code: string;
  name: string;
  items: PublicDictionaryItem[];
}
