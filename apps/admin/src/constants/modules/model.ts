import type { DataFilterFieldConfig, SelectOption } from '@/types';
import type { AdminRoleFilterModel, AdminRoleFormModel } from '@/types';

/**
 * 管理后台分页组件允许选择的每页记录数
 */
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * 角色启用状态筛选选项
 */
export const ADMIN_ROLE_STATUS_OPTIONS: SelectOption[] = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
];

/**
 * 角色列表默认筛选参数
 */
export const ADMIN_ROLE_FILTER_MODEL: AdminRoleFilterModel = {
  pageNum: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
};

/**
 * 角色列表筛选字段配置
 */
export const ADMIN_ROLE_FILTER_CONFIG: DataFilterFieldConfig[] = [
  {
    type: 'input',
    field: 'keyword',
    label: '关键词',
    placeholder: '角色名称或编码',
  },
  {
    type: 'select',
    field: 'status',
    label: '角色状态',
    placeholder: '全部状态',
    options: ADMIN_ROLE_STATUS_OPTIONS,
  },
];

/**
 * 角色新增表单默认值
 */
export const ADMIN_ROLE_FORM_MODEL: AdminRoleFormModel = {
  name: '',
  code: '',
  description: '',
  isActive: true,
};
