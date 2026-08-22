import { nextTick, onBeforeUnmount, onMounted } from 'vue';
import type { ShallowRef } from 'vue';
import { initChart } from '@repo/charts';
import { emitter } from '@/emitter';
import type { ChartInstance, ChartOption } from '@repo/charts';

/**
 * 管理 Dashboard 图表实例的创建、主题刷新、容器缩放和资源释放。
 *
 * @param containerRef 图表挂载节点。
 * @param createOption 根据当前 CSS 主题变量生成图表配置的方法。
 */
export const useDashboardChart = (
  containerRef: Readonly<ShallowRef<HTMLElement | null>>,
  createOption: () => ChartOption,
): void => {
  let chartInstance: ChartInstance | undefined;
  let resizeObserver: ResizeObserver | undefined;

  /**
   * 使用当前主题重新设置图表配置。
   */
  const renderChart = (): void => {
    chartInstance?.setOption(createOption(), {
      notMerge: true,
    });
  };

  /**
   * 主题 DOM 属性更新后重新读取 CSS 变量，确保 Canvas 颜色与页面主题同步。
   */
  const handleThemeChange = (): void => {
    void nextTick(() => {
      renderChart();
    });
  };

  /**
   * 初始化图表实例及元素级尺寸监听。
   */
  const setup = (): void => {
    if (!containerRef.value) {
      return;
    }

    chartInstance = initChart(containerRef.value, {
      renderer: 'canvas',
    });
    renderChart();
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize();
    });
    resizeObserver.observe(containerRef.value);
  };

  /**
   * 生命周期函数。
   */
  onMounted(() => {
    emitter.on('EVENT_THEME_CHANGE', handleThemeChange);
    setup();
  });

  onBeforeUnmount(() => {
    emitter.off('EVENT_THEME_CHANGE', handleThemeChange);
    resizeObserver?.disconnect();
    chartInstance?.dispose();
  });
};
