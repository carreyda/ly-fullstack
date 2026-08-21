import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

import type { ChartInitOptions, ChartInstance } from '../types';

echarts.use([BarChart, LineChart, GridComponent, MarkLineComponent, TooltipComponent, CanvasRenderer, SVGRenderer]);

/**
 * 创建按需注册能力范围内的 ECharts 实例。
 *
 * 当前仅注册柱状图、折线图、直角坐标系、标线、提示框以及 Canvas/SVG 渲染器。新增图表能力时，
 * 必须同步扩展注册项与 ChartOption，确保运行时能力和类型声明一致。
 *
 * @param element 图表容器
 * @param options 初始化选项，默认使用 Canvas 渲染器
 * @returns ECharts 实例
 * @remarks 调用方应在容器卸载时调用实例的 dispose 方法释放资源。
 */
export const initChart = (element: HTMLElement, options?: ChartInitOptions): ChartInstance =>
  echarts.init(element, null, options);
