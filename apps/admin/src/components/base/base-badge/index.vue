<template>
  <span class="base-badge" :class="`base-badge--${props.tone}`">
    <span v-if="props.dot" class="base-badge__dot" aria-hidden="true"></span>
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  /**
   * 徽标使用的业务语义色
   */
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

  /**
   * 是否在文案前展示同色状态点
   */
  dot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'neutral',
  dot: false,
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
