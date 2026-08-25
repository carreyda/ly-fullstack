<template>
  <div class="dashboard">
    <el-scrollbar class="dashboard__scrollbar">
      <div class="dashboard__content">
        <div class="dashboard__main">
          <section class="dashboard__metrics" aria-label="核心指标">
            <fluid-glass-card
              v-for="card in METRIC_CARDS"
              :key="card.key"
              :eyebrow="card.eyebrow"
              :title="card.title"
              :value="card.value"
              :icon="card.icon"
              :meta-label="card.metaLabel"
              :trend-text="card.trendText"
              :trend-tone="card.trendTone"
              :speed="card.speed"
              :intensity="card.intensity"
              :pointer="card.pointer"
              :seed="card.seed"
            />
          </section>

          <div class="dashboard__lower">
            <dashboard-chart-panel variant="traffic" />
            <dashboard-chart-panel variant="module" />
          </div>

          <dashboard-system-overview class="dashboard__panel dashboard__overview" />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
/**
 * Lucide 图标用于区分用户、会话、请求和告警四类核心指标。
 */
import { ChartNoAxesCombined, TriangleAlert, UserPlus, Users } from '@lucide/vue';

/**
 * 首页由指标卡片、图表和系统状态面板组合；页面入口只负责布局与演示数据装配。
 */
import DashboardChartPanel from './components/dashboard-chart-panel/index.vue';
import DashboardSystemOverview from './components/dashboard-system-overview/index.vue';
import FluidGlassCard from './components/fluid-glass-card/index.vue';

/**
 * 首页指标卡片展示数据
 *
 * 当前沿用首页视觉草稿中的指标文案和数值。
 */
const METRIC_CARDS = [
  {
    key: 'metric-01',
    eyebrow: '今日新增',
    title: '新增用户',
    value: '128',
    icon: UserPlus,
    metaLabel: '较昨日',
    trendText: '↑ 12.8%',
    trendTone: 'positive',
    speed: 0.92,
    intensity: 1.02,
    pointer: 0.82,
    seed: 1.7,
  },
  {
    key: 'metric-02',
    eyebrow: '活跃会话',
    title: '在线用户',
    value: '286',
    icon: Users,
    metaLabel: '当前峰值',
    trendText: '↑ 8.6%',
    trendTone: 'positive',
    speed: 0.84,
    intensity: 1.08,
    pointer: 0.8,
    seed: 4.9,
  },
  {
    key: 'metric-03',
    eyebrow: '接口调用',
    title: '今日请求',
    value: '56k',
    icon: ChartNoAxesCombined,
    metaLabel: '成功率',
    trendText: '99.98%',
    trendTone: 'positive',
    speed: 0.76,
    intensity: 0.98,
    pointer: 0.72,
    seed: 8.4,
  },
  {
    key: 'metric-04',
    eyebrow: '待处理',
    title: '系统告警',
    value: '03',
    icon: TriangleAlert,
    metaLabel: '较昨日',
    trendText: '↓ 40%',
    trendTone: 'negative',
    speed: 0.88,
    intensity: 1.05,
    pointer: 0.86,
    seed: 12.1,
  },
] as const;
</script>

<style lang="scss" src="./index.scss" scoped></style>
