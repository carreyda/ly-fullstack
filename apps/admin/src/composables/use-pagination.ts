import type { PaginationResult } from '@repo/shared/types';

import type { PaginationFilters, UsePaginationOptions } from '@/types';

const DEFAULT_PAGE_NUM = 1;

/**
 * 克隆分页筛选参数前解除 Vue 响应式代理
 *
 * @param value 可能来自 reactive 的分页筛选模型
 * @returns 可以安全清理空字段的独立参数
 */
const cloneValue = <TValue>(value: TValue): TValue => {
  return structuredClone(toRaw(value));
};

/**
 * 判断筛选值是否不应该进入查询字符串
 *
 * @param value 单个筛选字段值
 * @returns 空字符串、空值或空数组返回 `true`
 */
const isEmptyRequestValue = (value: unknown): boolean => {
  return value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);
};

/**
 * 管理后台分页列表通用状态
 *
 * Composable 统一管理筛选参数、页码、列表、Loading 和请求竞态；具体接口函数由页面传入，避免分页能力
 * 依赖任何业务模块。搜索、重置和切换每页数量时都会回到第一页。
 *
 * @param options 默认筛选参数和首次请求策略
 * @param fetchPage 页面提供的类型安全分页请求函数
 * @returns 列表页面渲染与分页交互需要的状态和方法
 */
export const usePagination = <TItem, TFilters extends PaginationFilters>(
  options: UsePaginationOptions<TFilters>,
  fetchPage: (params: TFilters) => Promise<PaginationResult<TItem>>,
) => {
  const loading = ref(false);
  const filters = reactive(cloneValue(options.defaultFilters)) as TFilters;
  const itemList = shallowRef<TItem[]>([]);
  const total = ref(0);
  let requestVersion = 0;

  /**
   * 构建不包含空筛选字段的接口查询参数
   *
   * @returns 当前分页和有效筛选条件的独立快照
   */
  const getRequestParams = (): TFilters => {
    const params = cloneValue(filters);
    const keys = Object.keys(params) as Array<keyof TFilters>;

    keys.forEach((key) => {
      if (isEmptyRequestValue(params[key])) {
        delete params[key];
      }
    });

    return params;
  };

  /**
   * 按当前分页与筛选条件重新加载列表
   *
   * 版本号保证快速查询和页面卸载后，旧请求不会覆盖最新列表或 Loading 状态。
   */
  const reload = async (): Promise<void> => {
    const version = ++requestVersion;
    loading.value = true;

    try {
      const pageData = await fetchPage(getRequestParams());
      if (version !== requestVersion) {
        return;
      }

      itemList.value = pageData.list ?? [];
      total.value = pageData.total;
      filters.pageNum = pageData.pageNum;
      filters.pageSize = pageData.pageSize;
    } catch {
      if (version === requestVersion && !itemList.value.length) {
        total.value = 0;
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false;
      }
    }
  };

  /**
   * 合并筛选面板提交的字段
   *
   * @param value 需要同步到当前筛选模型的字段
   */
  const setFilters = (value: Partial<TFilters>): void => {
    Object.assign(filters, value);
  };

  const handleSearch = async (): Promise<void> => {
    filters.pageNum = DEFAULT_PAGE_NUM;
    await reload();
  };

  const handleReset = async (): Promise<void> => {
    Object.assign(filters, cloneValue(options.defaultFilters));
    await reload();
  };

  /**
   * 切换页码并加载目标页
   *
   * @param pageNum 新页码
   */
  const handlePageNumChange = async (pageNum: number): Promise<void> => {
    filters.pageNum = pageNum;
    await reload();
  };

  /**
   * 切换每页数量并从第一页重新加载
   *
   * @param pageSize 新的每页数量
   */
  const handlePageSizeChange = async (pageSize: number): Promise<void> => {
    filters.pageNum = DEFAULT_PAGE_NUM;
    filters.pageSize = pageSize;
    await reload();
  };

  onMounted(() => {
    if (options.immediate ?? true) {
      void reload();
    }
  });

  onBeforeUnmount(() => {
    requestVersion += 1;
  });

  return {
    loading,
    filters,
    itemList,
    total,
    setFilters,
    reload,
    handleSearch,
    handleReset,
    handlePageNumChange,
    handlePageSizeChange,
  };
};
