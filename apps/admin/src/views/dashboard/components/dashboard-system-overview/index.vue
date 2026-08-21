<template>
  <section class="dashboard-system-overview" aria-label="系统运行概览">
    <header class="dashboard-system-overview__header">
      <div>
        <p class="dashboard-system-overview__eyebrow">运行状态</p>
        <h2 class="dashboard-system-overview__title">系统运行概览</h2>
        <p class="dashboard-system-overview__description">核心服务与基础资源的实时状态</p>
      </div>
      <div class="dashboard-system-overview__header-meta">
        <span class="dashboard-system-overview__healthy">
          <i aria-hidden="true"></i>
          核心服务正常
        </span>
        <span class="dashboard-system-overview__demo-tag">演示数据</span>
      </div>
    </header>

    <div class="dashboard-system-overview__services">
      <article v-for="service in serviceItems" :key="service.id" class="dashboard-system-overview__service">
        <span class="dashboard-system-overview__service-icon" aria-hidden="true">
          <component :is="service.icon" :size="17" :stroke-width="1.8" />
        </span>
        <div class="dashboard-system-overview__service-content">
          <strong>{{ service.name }}</strong>
          <span>{{ service.description }}</span>
        </div>
        <span class="dashboard-system-overview__service-status">
          <i aria-hidden="true"></i>
          {{ service.status }}
        </span>
      </article>
    </div>

    <div class="dashboard-system-overview__metrics">
      <article v-for="metric in metricItems" :key="metric.id" class="dashboard-system-overview__metric">
        <div class="dashboard-system-overview__metric-header">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </div>
        <div class="dashboard-system-overview__progress" aria-hidden="true">
          <i :style="{ width: metric.progress }"></i>
        </div>
        <p>{{ metric.description }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Lucide 图标区分 Admin API、数据库、定时任务和文件服务的运行状态。
 */
import { Cloud, Database, ServerCog, TimerReset } from '@lucide/vue';

/**
 * 核心服务演示数据。
 *
 * 当前数据用于展示健康检查面板的承载方式，真实项目应由服务端健康检查接口返回状态与摘要。
 */
const serviceItems = [
  {
    id: 'service-admin-api',
    name: 'Admin API',
    description: '平均响应 86 ms',
    status: '在线',
    icon: ServerCog,
  },
  {
    id: 'service-postgresql',
    name: 'PostgreSQL',
    description: '连接池 18 / 100',
    status: '正常',
    icon: Database,
  },
  {
    id: 'service-scheduler',
    name: '定时任务',
    description: '今日执行 24 次',
    status: '正常',
    icon: TimerReset,
  },
  {
    id: 'service-file',
    name: '文件服务',
    description: '今日传输 1.8 GB',
    status: '正常',
    icon: Cloud,
  },
] as const;

/**
 * 基础资源演示数据。
 *
 * progress 只控制进度条的视觉长度，接入真实监控后应与 value 使用同一指标来源。
 */
const metricItems = [
  { id: 'metric-cpu', label: 'CPU 使用率', value: '38%', progress: '38%', description: '8 核心平均负载' },
  { id: 'metric-memory', label: '内存占用', value: '62%', progress: '62%', description: '9.9 GB / 16 GB' },
  { id: 'metric-storage', label: '存储空间', value: '46%', progress: '46%', description: '92 GB / 200 GB' },
  { id: 'metric-success', label: '请求成功率', value: '99.98%', progress: '99.98%', description: '最近 24 小时' },
] as const;
</script>

<style lang="scss" src="./index.scss" scoped></style>
