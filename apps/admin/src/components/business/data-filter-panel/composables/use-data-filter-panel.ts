import type { Ref } from 'vue';
import type {
  DataFilterFieldConfig,
  DataFilterModel,
  DataFilterSelectField,
  DataFilterValue,
  SelectOption,
} from '@/types';

interface UseDataFilterPanelOptions {
  /**
   * 页面通过 v-model 持有的筛选模型
   */
  model: Ref<DataFilterModel>;

  /**
   * 读取重置时需要恢复的默认筛选模型
   */
  getDefaultModel: () => DataFilterModel | undefined;

  /**
   * 读取当前字段配置，配置引用变化时重新加载异步选项
   */
  getConfig: () => readonly DataFilterFieldConfig[];

  /**
   * 通知页面按当前条件查询列表
   */
  onSearch: () => void;

  /**
   * 通知页面已完成筛选条件重置
   */
  onReset: () => void;
}

/**
 * 克隆筛选模型，避免重置时复用默认对象引用
 *
 * @param model 页面提供的默认筛选模型
 * @returns 可以安全写入的独立筛选模型
 */
const cloneModel = (model: DataFilterModel): DataFilterModel => {
  return structuredClone(toRaw(model));
};

/**
 * 管理筛选面板的受控模型、异步选项和查询交互
 *
 * 异步选项使用递增批次隔离配置变化产生的旧请求，组件卸载后也不会继续回写响应式状态。
 * 页面专属选项仍应由页面加载后通过静态 `options` 传入。
 *
 * @param options 筛选模型、字段配置和页面事件回调
 * @returns 筛选控件渲染与交互所需的状态和方法
 */
export const useDataFilterPanel = (options: UseDataFilterPanelOptions) => {
  const asyncOptionsMap = shallowRef<Record<string, readonly SelectOption[]>>({});
  const optionLoadingMap = shallowRef<Record<string, boolean>>({});
  let loadBatch = 0;

  /**
   * 更新单个筛选字段，同时保持 v-model 的受控数据流
   *
   * @param field 需要更新的筛选字段名
   * @param value 控件提交的新值
   */
  const handleFieldUpdate = (field: string, value: DataFilterValue): void => {
    options.model.value = {
      ...options.model.value,
      [field]: value,
    };
  };

  /**
   * 将 Input 不支持的数组和空值收敛为未填写状态
   *
   * @param field 输入框对应的筛选字段名
   * @returns Input 可以直接消费的文本或数字
   */
  const resolveInputValue = (field: string): string | number | undefined => {
    const value = options.model.value[field];

    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
  };

  /**
   * 优先返回页面传入的固定选项，否则读取组件已经加载的通用远程选项
   *
   * @param field Select 字段配置
   * @returns 当前下拉框需要展示的选项
   */
  const resolveSelectOptions = (field: DataFilterSelectField): readonly SelectOption[] => {
    return field.options ?? asyncOptionsMap.value[field.field] ?? [];
  };

  /**
   * 加载一项通用远程选项，并阻止过期批次覆盖最新配置
   *
   * @param field 包含异步加载函数的 Select 字段
   * @param batch 当前配置对应的加载批次
   */
  const loadFieldOptions = async (field: DataFilterSelectField, batch: number): Promise<void> => {
    if (!field.asyncOptions) {
      return;
    }

    optionLoadingMap.value = {
      ...optionLoadingMap.value,
      [field.field]: true,
    };

    try {
      const fieldOptions = await field.asyncOptions();

      if (batch === loadBatch) {
        asyncOptionsMap.value = {
          ...asyncOptionsMap.value,
          [field.field]: fieldOptions,
        };
      }
    } catch {
      if (batch === loadBatch) {
        ElMessage.error(`${field.label}选项加载失败，请稍后重试`);
      }
    } finally {
      if (batch === loadBatch) {
        optionLoadingMap.value = {
          ...optionLoadingMap.value,
          [field.field]: false,
        };
      }
    }
  };

  /**
   * 在字段配置变化后重新建立异步选项状态
   */
  const loadAsyncOptions = (): void => {
    const batch = ++loadBatch;
    const selectFields = options
      .getConfig()
      .filter((field): field is DataFilterSelectField => field.type === 'select' && Boolean(field.asyncOptions));

    asyncOptionsMap.value = {};
    optionLoadingMap.value = {};
    selectFields.forEach((field) => {
      void loadFieldOptions(field, batch);
    });
  };

  const handleSearch = (): void => {
    options.onSearch();
  };

  /**
   * 恢复页面提供的默认值后，再通知页面重置分页并重新请求列表
   */
  const handleReset = (): void => {
    const defaultModel = options.getDefaultModel();

    if (defaultModel) {
      options.model.value = cloneModel(defaultModel);
    }

    options.onReset();
  };

  watch(options.getConfig, loadAsyncOptions, { immediate: true });

  onBeforeUnmount(() => {
    loadBatch += 1;
  });

  return {
    optionLoadingMap,
    handleFieldUpdate,
    handleReset,
    handleSearch,
    resolveInputValue,
    resolveSelectOptions,
  };
};
