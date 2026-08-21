<template>
  <div class="dashboard">
    <el-scrollbar class="dashboard__scrollbar">
      <div class="dashboard__content">
        <div class="dashboard__shell">
          <div class="dashboard__main">
            <section class="dashboard__metrics" aria-label="核心指标">
              <fluid-glass-card
                v-for="card in METRIC_CARDS"
                :key="card.key"
                :eyebrow="card.eyebrow"
                :title="card.title"
                :value="card.value"
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

          <aside class="dashboard__aside" aria-label="侧边内容区域">
            <dashboard-todo-panel class="dashboard__panel dashboard__aside-panel" />
            <dashboard-activity-panel class="dashboard__panel dashboard__aside-panel" />
          </aside>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
/**
 * 导入首页内容面板。
 */
import DashboardChartPanel from './components/dashboard-chart-panel/index.vue';
import DashboardActivityPanel from './components/dashboard-activity-panel/index.vue';
import DashboardTodoPanel from './components/dashboard-todo-panel/index.vue';
import DashboardSystemOverview from './components/dashboard-system-overview/index.vue';

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
