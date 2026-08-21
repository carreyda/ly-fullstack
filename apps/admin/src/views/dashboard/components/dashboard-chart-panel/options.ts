/**
 * 导入公共图表配置类型。
 */
import type { ChartOption } from '@repo/charts';

/**
 * 导入 Dashboard 图表类型。
 */
import type { DashboardChartVariant } from '@/types';

/**
 * Dashboard 演示图表的标题与辅助信息。
 *
 * 这些内容只用于展示管理后台的图表承载能力，不代表具体项目的业务指标口径。
 */
export const DASHBOARD_CHART_PANEL_CONFIG = {
  traffic: {
    eyebrow: '访问趋势',
    title: '近 7 日访问趋势',
    description: '访问量与独立访客的变化情况',
    legends: ['访问量', '独立访客'],
    chartLabel: '近七日访问量与独立访客折线图，数据仅用于界面展示',
  },
  module: {
    eyebrow: '模块分布',
    title: '本周模块调用量',
    description: '常用后台模块的累计调用次数',
    legends: ['调用次数'],
    chartLabel: '本周各后台模块调用次数柱状图，数据仅用于界面展示',
  },
} as const;

/**
 * 读取当前主题的 CSS 语义变量。
 *
 * 图表由 Canvas 绘制，无法直接消费 CSS 变量，因此在每次主题切换后读取最终色值并重建配置。
 *
 * @param variableName CSS 自定义变量名称。
 * @param fallback 变量不存在时使用的兜底颜色。
 * @returns 当前主题下已经解析的颜色值。
 */
const getThemeColor = (variableName: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallback;

/**
 * 将十六进制颜色转换为带透明度的 RGBA 颜色。
 *
 * @param color 六位十六进制颜色。
 * @param opacity 目标透明度。
 * @returns 可供 Canvas 渲染器使用的 RGBA 颜色。
 */
const withOpacity = (color: string, opacity: number): string => {
  const normalizedColor = color.replace('#', '');

  if (!/^[\da-f]{6}$/i.test(normalizedColor)) {
    return color;
  }

  const red = Number.parseInt(normalizedColor.slice(0, 2), 16);
  const green = Number.parseInt(normalizedColor.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedColor.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

/**
 * 创建纵向渐隐色，用于折线面积和柱体高光。
 *
 * @param color 顶部强调色。
 * @param opacity 顶部颜色透明度。
 * @returns ECharts Canvas 渐变配置。
 */
const createVerticalGradient = (color: string, opacity: number) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: withOpacity(color, opacity) },
    { offset: 1, color: withOpacity(color, 0) },
  ],
  global: false,
});

/**
 * 创建 Dashboard 演示图表配置。
 *
 * 图表数据只负责展示模板的视觉和交互能力；接入真实项目时应由业务接口替换横轴与序列数据。
 *
 * @param variant 需要生成的图表类型。
 * @returns 与公共图表包注册能力一致的 ECharts 配置。
 */
export const createDashboardChartOption = (variant: DashboardChartVariant): ChartOption => {
  const primaryColor = getThemeColor('--color-primary', '#1de9a0');
  const secondaryColor = getThemeColor('--chart-secondary-color', '#5b8cff');
  const barHoverColor = getThemeColor('--chart-bar-hover-color', '#59efba');
  const primaryTextColor = getThemeColor('--color-text-primary', '#f2f8f5');
  const secondaryTextColor = getThemeColor('--color-text-tertiary', '#718079');
  const borderColor = getThemeColor('--border-color', 'rgba(198, 255, 229, 0.09)');
  const tooltipBackground = getThemeColor('--chart-tooltip-background', 'rgba(12, 19, 16, 0.96)');
  const barTrackColor = getThemeColor('--chart-bar-track-color', 'rgba(198, 255, 229, 0.045)');
  const commonOption: ChartOption = {
    animationDuration: 720,
    animationEasing: 'cubicOut',
    grid: {
      top: 30,
      right: 20,
      bottom: 18,
      left: 18,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: tooltipBackground,
      borderColor,
      borderWidth: 1,
      padding: [9, 12],
      textStyle: {
        color: primaryTextColor,
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: withOpacity(primaryColor, 0.28),
          width: 1,
        },
      },
      extraCssText: 'border-radius: 8px; box-shadow: 0 14px 34px rgba(0, 0, 0, 0.16);',
    },
    xAxis: {
      type: 'category',
      boundaryGap: variant === 'module',
      axisLine: {
        lineStyle: {
          color: borderColor,
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 12,
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 12,
        margin: 12,
      },
      splitLine: {
        lineStyle: {
          color: borderColor,
          type: 'dashed',
        },
      },
    },
  };

  if (variant === 'traffic') {
    return {
      ...commonOption,
      xAxis: {
        ...commonOption.xAxis,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      },
      series: [
        {
          name: '访问量',
          type: 'line',
          data: [1680, 1920, 1780, 2360, 2180, 2670, 2890],
          smooth: 0.42,
          showSymbol: false,
          lineStyle: {
            width: 2.5,
            color: primaryColor,
          },
          areaStyle: {
            color: createVerticalGradient(primaryColor, 0.3),
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: '独立访客',
          type: 'line',
          data: [920, 1080, 1010, 1320, 1260, 1490, 1640],
          smooth: 0.42,
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: secondaryColor,
          },
          areaStyle: {
            color: createVerticalGradient(secondaryColor, 0.14),
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }

  return {
    ...commonOption,
    xAxis: {
      ...commonOption.xAxis,
      data: ['用户', '权限', '内容', '文件', '通知', '日志'],
    },
    series: [
      {
        name: '调用次数',
        type: 'bar',
        data: [1860, 1420, 2180, 1280, 1640, 960],
        barWidth: 18,
        showBackground: true,
        backgroundStyle: {
          color: barTrackColor,
          borderRadius: 6,
        },
        itemStyle: {
          color: createVerticalGradient(primaryColor, 1),
          borderRadius: [6, 6, 2, 2],
        },
        emphasis: {
          itemStyle: {
            color: barHoverColor,
          },
        },
      },
    ],
  };
};
