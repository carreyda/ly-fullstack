<template>
  <section
    class="display-result-page"
    :class="[
      `display-result-page--${props.variant}`,
      props.code ? 'display-result-page--exception' : 'display-result-page--outcome',
    ]"
  >
    <el-scrollbar class="display-result-page__scrollbar">
      <div class="display-result-page__content">
        <article class="display-result-page__card">
          <div class="display-result-page__visual" aria-hidden="true">
            <template v-if="props.code">
              <span class="display-result-page__orbit display-result-page__orbit--outer"></span>
              <span class="display-result-page__orbit display-result-page__orbit--inner"></span>
            </template>
            <span v-if="props.code" class="display-result-page__code">{{ props.code }}</span>
            <span class="display-result-page__icon-wrap">
              <component :is="resultIcon" :size="46" :stroke-width="1.45" />
            </span>
          </div>

          <div class="display-result-page__copy">
            <p v-if="props.eyebrow" class="display-result-page__eyebrow">{{ props.eyebrow }}</p>
            <h1 class="display-result-page__title">{{ props.title }}</h1>
            <p class="display-result-page__description">{{ props.description }}</p>

            <section v-if="props.detailList?.length" class="display-result-page__details">
              <h2 v-if="props.detailTitle" class="display-result-page__details-title">{{ props.detailTitle }}</h2>
              <ul class="display-result-page__detail-list">
                <li v-for="detail in props.detailList" :key="detail" class="display-result-page__detail-item">
                  <span class="display-result-page__detail-dot" aria-hidden="true"></span>
                  {{ detail }}
                </li>
              </ul>
            </section>

            <div class="display-result-page__actions">
              <el-button type="primary" @click="emit('primary')">{{ props.primaryText }}</el-button>
              <el-button v-if="props.secondaryText" @click="emit('secondary')">{{ props.secondaryText }}</el-button>
              <el-button v-if="props.tertiaryText" @click="emit('tertiary')">{{ props.tertiaryText }}</el-button>
            </div>
          </div>
        </article>
      </div>
    </el-scrollbar>
  </section>
</template>

<script setup lang="ts">
import { CircleCheck, CircleX, SearchX, ServerCrash } from '@lucide/vue';
import type { DisplayResultVariant } from '@/types';

/**
 * 展示结果页输入属性。
 */
interface Props {
  /**
   * 页面状态类型。
   */
  variant: DisplayResultVariant;

  /**
   * 页面短标签。
   */
  eyebrow?: string;

  /**
   * 页面主标题。
   */
  title: string;

  /**
   * 页面说明文案。
   */
  description: string;

  /**
   * 异常状态码。
   */
  code?: string;

  /**
   * 详情区域标题。
   */
  detailTitle?: string;

  /**
   * 详情条目。
   */
  detailList?: string[];

  /**
   * 主要操作文案。
   */
  primaryText: string;

  /**
   * 次要操作文案。
   */
  secondaryText?: string;

  /**
   * 第三个操作文案。
   */
  tertiaryText?: string;
}

/**
 * 展示结果页交互事件。
 */
interface Emits {
  /**
   * 点击主要操作。
   */
  primary: [];

  /**
   * 点击次要操作。
   */
  secondary: [];

  /**
   * 点击第三个操作。
   */
  tertiary: [];
}

/**
 * 定义 props。
 */
const props = defineProps<Props>();

/**
 * 定义交互事件。
 */
const emit = defineEmits<Emits>();

/**
 * 不同结果状态对应的 Lucide 图标。
 */
const RESULT_ICON_MAP = {
  success: CircleCheck,
  failure: CircleX,
  'not-found': SearchX,
  'server-error': ServerCrash,
} as const;

/**
 * 当前结果页图标。
 */
const resultIcon = computed(() => RESULT_ICON_MAP[props.variant]);
</script>

<style lang="scss" src="./index.scss" scoped></style>
