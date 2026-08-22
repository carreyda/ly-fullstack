<template>
  <div class="base-empty-state" :class="`base-empty-state--${props.layout}`">
    <el-empty :description="props.description" :image-size="props.imageSize">
      <slot></slot>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
/**
 * 空状态在所在容器中的布局方式
 */
type EmptyStateLayout = 'fill' | 'inline';

/**
 * 通用空状态输入参数
 */
interface Props {
  /**
   * 空状态说明文案
   */
  description?: string;

  /**
   * 填满容器或跟随文档流展示
   */
  layout?: EmptyStateLayout;

  /**
   * Element Plus 空状态插图尺寸
   */
  imageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  layout: 'fill',
  imageSize: 96,
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
