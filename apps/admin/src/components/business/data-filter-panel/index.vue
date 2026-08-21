<template>
  <section class="data-filter-panel" aria-label="数据筛选">
    <el-form class="data-filter-panel__form" label-position="right" :label-width="props.labelWidth">
      <el-form-item v-for="field in props.config" :key="field.field" :label="field.label">
        <el-input
          v-if="field.type === 'input'"
          :model-value="resolveInputValue(field.field)"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :clearable="field.clearable ?? true"
          @keyup.enter="handleSearch"
          @update:model-value="handleFieldUpdate(field.field, $event)"
        />

        <el-select
          v-else-if="field.type === 'select'"
          :model-value="model[field.field]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :clearable="field.clearable ?? true"
          :loading="optionLoadingMap[field.field]"
          @update:model-value="handleFieldUpdate(field.field, $event)"
        >
          <el-option
            v-for="option in resolveSelectOptions(field)"
            :key="String(option.value)"
            :label="option.label"
            :value="option.value"
            :disabled="option.disabled"
          />
        </el-select>

        <el-date-picker
          v-else-if="field.type === 'date'"
          :model-value="model[field.field]"
          type="date"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :clearable="field.clearable ?? true"
          :format="field.format ?? 'YYYY-MM-DD'"
          :value-format="field.valueFormat ?? 'YYYY-MM-DD'"
          @update:model-value="handleFieldUpdate(field.field, $event)"
        />

        <el-date-picker
          v-else
          :model-value="model[field.field]"
          type="daterange"
          :start-placeholder="field.startPlaceholder ?? '开始日期'"
          :end-placeholder="field.endPlaceholder ?? '结束日期'"
          :disabled="field.disabled"
          :clearable="field.clearable ?? true"
          :format="field.format ?? 'YYYY-MM-DD'"
          :value-format="field.valueFormat ?? 'YYYY-MM-DD'"
          @update:model-value="handleFieldUpdate(field.field, $event)"
        />
      </el-form-item>
    </el-form>

    <div class="data-filter-panel__actions">
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDataFilterPanel } from './composables/use-data-filter-panel';

import type { DataFilterFieldConfig, DataFilterModel } from '@/types';

interface Props {
  /**
   * 点击重置时恢复的初始筛选模型
   */
  defaultModel?: DataFilterModel;

  /**
   * 决定筛选字段类型、文案和选项来源的配置
   */
  config: readonly DataFilterFieldConfig[];

  /**
   * Element Plus 表单标签宽度
   */
  labelWidth?: string | number;
}

interface Emits {
  /**
   * 用户确认按当前筛选条件查询
   */
  search: [];

  /**
   * 用户将筛选条件恢复为默认值
   */
  reset: [];
}

const model = defineModel<DataFilterModel>({ required: true });
const props = withDefaults(defineProps<Props>(), {
  defaultModel: undefined,
  labelWidth: 80,
});
const emits = defineEmits<Emits>();

const { optionLoadingMap, handleFieldUpdate, handleReset, handleSearch, resolveInputValue, resolveSelectOptions } =
  useDataFilterPanel({
    model,
    getDefaultModel: () => props.defaultModel,
    getConfig: () => props.config,
    onSearch: () => emits('search'),
    onReset: () => emits('reset'),
  });
</script>

<style lang="scss" src="./index.scss" scoped></style>
