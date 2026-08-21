/**
 * 后台分页查询的基础参数
 */
export interface PaginationParams {
  /**
   * 当前页码，从 1 开始
   */
  pageNum: number;

  /**
   * 每页记录数，只允许后台约定的固定档位
   */
  pageSize: number;
}

/**
 * 后台分页接口的统一响应结构
 *
 * @template TItem 当前业务列表中的单条记录类型
 */
export interface PaginationResult<TItem> extends PaginationParams {
  /**
   * 当前页的数据列表
   */
  list: TItem[];

  /**
   * 符合筛选条件的记录总数
   */
  total: number;
}
