<template>
  <section class="dashboard-todo-panel" aria-label="待办事项">
    <header class="dashboard-todo-panel__header">
      <div>
        <p class="dashboard-todo-panel__eyebrow">任务清单</p>
        <h2 class="dashboard-todo-panel__title">待办事项</h2>
      </div>
      <span class="dashboard-todo-panel__count">{{ pendingCount }} 项待处理</span>
    </header>

    <div class="dashboard-todo-panel__list">
      <button
        v-for="item in todoItems"
        :key="item.id"
        class="dashboard-todo-panel__item"
        :class="{ 'dashboard-todo-panel__item--completed': item.completed }"
        type="button"
        :aria-pressed="item.completed"
        @click="handleTodoToggle(item.id)"
      >
        <span class="dashboard-todo-panel__check" aria-hidden="true">
          <check v-if="item.completed" :size="13" :stroke-width="2.5" />
        </span>
        <span class="dashboard-todo-panel__content">
          <strong class="dashboard-todo-panel__item-title">{{ item.title }}</strong>
          <span class="dashboard-todo-panel__meta">
            <clock-3 :size="12" :stroke-width="1.8" />
            {{ item.time }}
          </span>
        </span>
        <span v-if="item.priority" class="dashboard-todo-panel__priority">{{ item.priority }}</span>
      </button>
    </div>

    <button class="dashboard-todo-panel__more" type="button">
      查看全部任务
      <arrow-right :size="14" :stroke-width="1.8" />
    </button>
  </section>
</template>

<script setup lang="ts">
/**
 * 待办列表在页面内维护演示完成状态，并由计算属性实时统计未完成数量。
 */
import { computed, ref } from 'vue';

/**
 * Lucide 图标用于任务完成标记、计划时间和查看全部入口。
 */
import { ArrowRight, Check, Clock3 } from '@lucide/vue';

/**
 * 首页待办演示数据。
 *
 * 当前只用于展示任务面板的视觉与交互能力，真实项目应替换为登录用户的任务接口数据。
 */
const todoItems = ref([
  { id: 'todo-01', title: '审核新用户资料', time: '今天 09:30', priority: '紧急', completed: false },
  { id: 'todo-02', title: '完成角色权限配置', time: '今天 11:00', priority: '', completed: true },
  { id: 'todo-03', title: '检查本周数据报告', time: '今天 15:30', priority: '', completed: false },
  { id: 'todo-04', title: '更新部署说明', time: '明天 10:00', priority: '', completed: false },
  { id: 'todo-05', title: '整理下周迭代计划', time: '明天 14:00', priority: '', completed: false },
]);

/**
 * 尚未完成的任务数量。
 */
const pendingCount = computed(() => todoItems.value.filter((item) => !item.completed).length);

/**
 * 切换演示任务的完成状态。
 *
 * @param todoId 待办任务唯一标识。
 */
const handleTodoToggle = (todoId: string): void => {
  const todoItem = todoItems.value.find((item) => item.id === todoId);

  if (todoItem) {
    todoItem.completed = !todoItem.completed;
  }
};
</script>

<style lang="scss" src="./index.scss" scoped></style>
