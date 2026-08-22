<template>
  <el-popover v-model:visible="popoverVisible" :width="600" placement="bottom-start" trigger="click">
    <template #reference>
      <button class="menu-icon-picker__trigger" type="button" :disabled="props.disabled">
        <component :is="selectedIcon" v-if="selectedIcon" :size="20" :stroke-width="1.8" />
        <span>{{ selectedOption?.label ?? '选择图标' }}</span>
      </button>
    </template>

    <div class="menu-icon-picker">
      <header class="menu-icon-picker__header">
        <strong>选择菜单图标</strong>
        <el-input v-model="keyword" clearable placeholder="搜索名称或用途" />
      </header>

      <div class="menu-icon-picker__categories">
        <button
          v-for="category in categories"
          :key="category"
          class="menu-icon-picker__category"
          :class="{ 'menu-icon-picker__category--active': activeCategory === category }"
          type="button"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <div v-if="pagedOptions.length" class="menu-icon-picker__grid">
        <button
          v-for="option in pagedOptions"
          :key="option.name"
          class="menu-icon-picker__option"
          :class="{ 'menu-icon-picker__option--selected': option.name === props.modelValue }"
          type="button"
          :title="`${option.label} · ${option.name}`"
          @click="selectIcon(option.name)"
        >
          <component :is="option.component" :size="22" :stroke-width="1.7" />
          <span>{{ option.label }}</span>
        </button>
      </div>

      <el-empty v-else class="menu-icon-picker__empty" description="没有匹配的图标" :image-size="64" />

      <footer class="menu-icon-picker__footer">
        <button class="menu-icon-picker__clear" type="button" @click="selectIcon(null)">清除图标</button>
        <el-pagination
          v-if="filteredOptions.length > PAGE_SIZE"
          v-model:current-page="currentPage"
          background
          layout="prev, pager, next"
          :page-size="PAGE_SIZE"
          :total="filteredOptions.length"
        />
      </footer>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { MENU_ICON_CATEGORIES, MENU_ICON_OPTIONS } from '@/constants';
import { resolveMenuIcon } from '@/utils';

import type { MenuIconCategory } from '@/types';

/**
 * 图标选择器每页展示数量
 *
 * 32 个图标在 600px 浮层内形成稳定的八列四行网格，避免一次渲染完整白名单。
 */
const PAGE_SIZE = 32;

/**
 * 图标选择器输入参数
 */
interface Props {
  /**
   * 当前菜单保存的 Lucide 图标名称
   */
  modelValue: string | null;

  /**
   * 是否禁止打开和修改图标
   */
  disabled?: boolean;
}

/**
 * 图标选择器输出事件
 */
interface Emits {
  /**
   * 用户选择或清除图标时同步新的图标名称
   */
  (event: 'update:modelValue', value: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const emit = defineEmits<Emits>();
const categories: readonly (MenuIconCategory | '全部')[] = ['全部', ...MENU_ICON_CATEGORIES];
const popoverVisible = ref(false);
const keyword = ref('');
const activeCategory = ref<MenuIconCategory | '全部'>('全部');
const currentPage = ref(1);

/**
 * 当前选中图标的目录信息
 */
const selectedOption = computed(() => MENU_ICON_OPTIONS.find((option) => option.name === props.modelValue));

/**
 * 当前选中图标对应的 Vue 组件
 */
const selectedIcon = computed(() => resolveMenuIcon(props.modelValue));

/**
 * 根据分类和搜索文本筛选图标白名单
 */
const filteredOptions = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return MENU_ICON_OPTIONS.filter((option) => {
    const categoryMatched = activeCategory.value === '全部' || option.category === activeCategory.value;
    const keywordMatched =
      !normalizedKeyword ||
      `${option.name} ${option.label} ${option.keywords}`.toLowerCase().includes(normalizedKeyword);

    return categoryMatched && keywordMatched;
  });
});

/**
 * 当前分页需要渲染的图标选项
 */
const pagedOptions = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredOptions.value.slice(start, start + PAGE_SIZE);
});

/**
 * 保存图标选择并关闭浮层
 *
 * @param name 选中的 Lucide 图标名称；清除时为空
 */
const selectIcon = (name: string | null): void => {
  emit('update:modelValue', name);
  popoverVisible.value = false;
};

watch([keyword, activeCategory], () => {
  currentPage.value = 1;
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
