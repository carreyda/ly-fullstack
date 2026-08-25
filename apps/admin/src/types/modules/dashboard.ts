/**
 * Dashboard 演示图表类型。
 *
 * traffic 展示访问趋势折线图，module 展示后台模块调用量柱状图。
 */
export type DashboardChartVariant = 'traffic' | 'module';

/**
 * Fluid Glass 指标卡片的 WebGL 渲染参数
 */
export interface FluidGlassRenderOptions {
  /**
   * 第一层流体颜色
   */
  colorA: string;

  /**
   * 第二层流体颜色
   */
  colorB: string;

  /**
   * 阴影与层次颜色
   */
  colorC: string;

  /**
   * 动画速度
   */
  speed: number;

  /**
   * 流体强度
   */
  intensity: number;

  /**
   * 指针扰动强度
   */
  pointer: number;

  /**
   * 表面不透明度
   */
  surface: number;

  /**
   * 单张卡片的随机种子
   */
  seed: number;
}
