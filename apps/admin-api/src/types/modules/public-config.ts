/**
 * 公共配置列表查询读取的数据库记录
 */
export interface AdminPublicConfigRecord {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
