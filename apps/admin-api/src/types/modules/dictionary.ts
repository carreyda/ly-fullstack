/**
 * 字典列表查询读取的数据库记录
 */
export interface AdminDictionaryRecord {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
  };
}

/**
 * 字典项列表查询读取的数据库记录
 */
export interface AdminDictionaryItemRecord {
  id: number;
  dictionaryId: number;
  label: string;
  value: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
