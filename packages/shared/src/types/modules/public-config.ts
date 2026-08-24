import type { PaginationParams } from './pagination';

/**
 * 公共配置管理列表查询参数
 */
export interface AdminPublicConfigQueryParams extends PaginationParams {
  /**
   * 同时匹配配置键和说明的搜索词
   */
  keyword?: string;
}

/**
 * 公共配置管理列表记录
 */
export interface AdminPublicConfigListItem {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 新增公共配置请求参数
 */
export interface CreateAdminPublicConfigParams {
  key: string;
  value: string;
  description?: string | null;
}

/**
 * 编辑公共配置请求参数
 */
export interface UpdateAdminPublicConfigParams {
  value: string;
  description?: string | null;
}

/**
 * 公共 API 返回的单条配置
 */
export interface PublicConfigValue {
  key: string;
  value: string;
}
