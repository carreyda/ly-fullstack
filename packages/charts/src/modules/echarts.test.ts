import { describe, expect, rs, test } from '@rstest/core';
import { init } from 'echarts/core';

import { initChart } from './echarts';

import type { ChartInstance } from '../types';

rs.mock('echarts/core', () => ({
  init: rs.fn(),
  use: rs.fn(),
}));

rs.mock('echarts/charts', () => ({
  BarChart: { type: 'bar' },
  LineChart: { type: 'line' },
}));

rs.mock('echarts/components', () => ({
  GridComponent: { type: 'grid' },
  MarkLineComponent: { type: 'markLine' },
  TooltipComponent: { type: 'tooltip' },
}));

rs.mock('echarts/renderers', () => ({
  CanvasRenderer: { type: 'canvas' },
  SVGRenderer: { type: 'svg' },
}));

describe('echarts module', () => {
  test('仅注册公共模块声明的图表能力', async () => {
    rs.resetModules();
    const { use } = await import('echarts/core');
    await import('./echarts');

    expect(use).toHaveBeenCalledOnce();
    expect(use).toHaveBeenCalledWith([
      { type: 'bar' },
      { type: 'line' },
      { type: 'grid' },
      { type: 'markLine' },
      { type: 'tooltip' },
      { type: 'canvas' },
      { type: 'svg' },
    ]);
  });

  test('使用 ECharts 核心模块创建图表实例', () => {
    const element = {} as HTMLElement;
    const chartInstance = {} as ChartInstance;
    rs.mocked(init).mockReturnValue(chartInstance);

    expect(initChart(element, { renderer: 'svg' })).toBe(chartInstance);
    expect(init).toHaveBeenCalledWith(element, null, { renderer: 'svg' });
  });
});
