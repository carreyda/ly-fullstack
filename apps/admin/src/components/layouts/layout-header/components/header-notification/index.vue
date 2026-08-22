<template>
  <section class="header-notification-panel">
    <header class="header-notification-panel__header">
      <div>
        <strong>通知中心</strong>
        <span>{{ unreadCount }} 条未读</span>
      </div>

      <button type="button" :disabled="unreadCount === 0" @click="handleReadAll">
        <check-check :size="15" :stroke-width="1.8" />
        全部已读
      </button>
    </header>

    <nav class="header-notification-panel__tabs" aria-label="通知分类">
      <button
        v-for="tab in tabList"
        :key="tab.value"
        type="button"
        :class="{ 'header-notification-panel__tab--active': activeCategory === tab.value }"
        @click="handleCategoryChange(tab.value)"
      >
        {{ tab.label }}
        <span>{{ tab.count }}</span>
      </button>
    </nav>

    <el-scrollbar max-height="320px">
      <ul v-if="visibleList.length" class="header-notification-panel__list">
        <li v-for="item in visibleList" :key="item.id">
          <button type="button" @click="handleItemRead(item.id)">
            <span class="header-notification-panel__icon" :class="`header-notification-panel__icon--${item.kind}`">
              <server-cog v-if="item.kind === 'system'" :size="17" :stroke-width="1.8" />
              <shield-check v-else-if="item.kind === 'security'" :size="17" :stroke-width="1.8" />
              <list-checks v-else :size="17" :stroke-width="1.8" />
            </span>

            <span class="header-notification-panel__content">
              <strong>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
              <small>{{ item.time }}</small>
            </span>

            <span v-if="!item.read" class="header-notification-panel__unread" aria-label="未读"></span>
          </button>
        </li>
      </ul>

      <base-empty-state v-else description="当前分类暂无内容" layout="inline" :image-size="72" />
    </el-scrollbar>
  </section>
</template>

<script setup lang="ts">
import { CheckCheck, ListChecks, ServerCog, ShieldCheck } from '@lucide/vue';

import { useHeaderNotification } from './composables/use-header-notification';

/**
 * 通知面板向顶栏同步未读数量
 */
interface Emits {
  /**
   * 未读数量发生变化
   */
  unreadChange: [count: number];
}

const emits = defineEmits<Emits>();
const { activeCategory, unreadCount, tabList, visibleList, handleCategoryChange, handleItemRead, handleReadAll } =
  useHeaderNotification();

/**
 * 未读数量变化后同步顶栏红点状态
 */
watch(
  unreadCount,
  (count) => {
    emits('unreadChange', count);
  },
  { immediate: true },
);
</script>

<style lang="scss" src="./index.scss" scoped></style>
