<template>
  <section class="dashboard-chart-panel" :aria-label="panelConfig.title">
    <header class="dashboard-chart-panel__header">
      <div class="dashboard-chart-panel__heading">
        <span class="dashboard-chart-panel__icon" aria-hidden="true">
          <trending-up v-if="props.variant === 'traffic'" :size="17" :stroke-width="1.8" />
          <chart-no-axes-column-increasing v-else :size="17" :stroke-width="1.8" />
        </span>
        <div class="dashboard-chart-panel__heading-text">
          <p class="dashboard-chart-panel__eyebrow">{{ panelConfig.eyebrow }}</p>
          <h2 class="dashboard-chart-panel__title">{{ panelConfig.title }}</h2>
          <p class="dashboard-chart-panel__description">{{ panelConfig.description }}</p>
        </div>
      </div>

      <div class="dashboard-chart-panel__summary">
        <span class="dashboard-chart-panel__demo-tag">演示数据</span>
        <div class="dashboard-chart-panel__legends" aria-label="图例">
          <span v-for="(legend, index) in panelConfig.legends" :key="legend" class="dashboard-chart-panel__legend">
            <i
              class="dashboard-chart-panel__legend-dot"
              :class="`dashboard-chart-panel__legend-dot--${index + 1}`"
              aria-hidden="true"
            ></i>
            {{ legend }}
          </span>
        </div>
      </div>
    </header>

    <div ref="chartRef" class="dashboard-chart-panel__chart" role="img" :aria-label="panelConfig.chartLabel"></div>
  </section>
</template>

<script setup lang="ts">
/**
 * 图表挂载节点使用模板引用，面板标题和图例由 variant 计算得到。
 */
import { computed, useTemplateRef } from 'vue';

/**
 * 标题图标用于区分折线趋势与柱状分布两类演示图表。
 */
import { ChartNoAxesColumnIncreasing, TrendingUp } from '@lucide/vue';

/**
 * 图表 Composable 统一处理实例初始化、主题刷新、尺寸监听和资源释放。
 */
import { useDashboardChart } from '../../composables/use-dashboard-chart';

/**
 * 图表配置工厂读取当前主题变量，并为每种 variant 生成对应的 ECharts 配置。
 */
import { createDashboardChartOption, DASHBOARD_CHART_PANEL_CONFIG } from './options';

/**
 * 图表变体类型限制页面只能选择已经实现的流量趋势或模块分布。
 */
import type { DashboardChartVariant } from '@/types';

/**
 * Dashboard 图表面板输入属性。
 */
interface Props {
  /**
   * 图表展示类型，traffic 为访问趋势，module 为模块调用量。
   */
  variant: DashboardChartVariant;
}

/**
 * 定义 props。
 */
const props = defineProps<Props>();

/**
 * 定义图表挂载节点。
 */
const chartRef = useTemplateRef<HTMLElement>('chartRef');

/**
 * 当前图表的标题、说明及图例配置。
 */
const panelConfig = computed(() => DASHBOARD_CHART_PANEL_CONFIG[props.variant]);

/**
 * 挂载图表并接入主题切换和容器缩放。
 */
useDashboardChart(chartRef, () => createDashboardChartOption(props.variant));
</script>

<style lang="scss" src="./index.scss" scoped></style>
