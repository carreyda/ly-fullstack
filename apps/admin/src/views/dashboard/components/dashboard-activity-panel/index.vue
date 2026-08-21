<template>
  <section class="dashboard-activity-panel" aria-label="最新动态">
    <header class="dashboard-activity-panel__header">
      <div>
        <p class="dashboard-activity-panel__eyebrow">操作记录</p>
        <h2 class="dashboard-activity-panel__title">最新动态</h2>
      </div>
      <span class="dashboard-activity-panel__live">
        <i aria-hidden="true"></i>
        实时
      </span>
    </header>

    <div class="dashboard-activity-panel__list">
      <article v-for="activity in activityItems" :key="activity.id" class="dashboard-activity-panel__item">
        <span class="dashboard-activity-panel__icon" :class="`dashboard-activity-panel__icon--${activity.tone}`">
          <component :is="activity.icon" :size="15" :stroke-width="1.8" />
        </span>
        <div class="dashboard-activity-panel__content">
          <p class="dashboard-activity-panel__message">
            <strong>{{ activity.actor }}</strong>
            {{ activity.action }}
            <span>{{ activity.target }}</span>
          </p>
          <time class="dashboard-activity-panel__time">{{ activity.time }}</time>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 导入动态列表使用的 Lucide 图标。
 */
import { DatabaseBackup, FileDown, Rocket, ShieldCheck, UserPlus } from '@lucide/vue';

/**
 * 首页动态演示数据。
 *
 * 当前内容覆盖用户、系统、权限与发布四类常见后台行为，真实项目应替换为审计日志或动态接口。
 */
const activityItems = [
  {
    id: 'activity-01',
    actor: '林远',
    action: '新增了用户',
    target: '赵一凡',
    time: '5 分钟前',
    tone: 'green',
    icon: UserPlus,
  },
  {
    id: 'activity-02',
    actor: '系统任务',
    action: '完成了',
    target: '每日数据库备份',
    time: '28 分钟前',
    tone: 'blue',
    icon: DatabaseBackup,
  },
  {
    id: 'activity-03',
    actor: '陈默',
    action: '更新了',
    target: '角色权限配置',
    time: '1 小时前',
    tone: 'violet',
    icon: ShieldCheck,
  },
  {
    id: 'activity-04',
    actor: '李响',
    action: '发布了',
    target: 'v0.1.0 版本',
    time: '3 小时前',
    tone: 'orange',
    icon: Rocket,
  },
  {
    id: 'activity-05',
    actor: '周宁',
    action: '导出了',
    target: '本周运营报表',
    time: '5 小时前',
    tone: 'blue',
    icon: FileDown,
  },
] as const;
</script>

<style lang="scss" src="./index.scss" scoped></style>
