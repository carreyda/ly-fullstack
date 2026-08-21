/**
 * Aurora 渐变的三个颜色停靠点
 *
 * 颜色按画布水平方向从起点、中点到终点排列。每一项既可以使用十六进制颜色，也可以使用
 * 当前组件根节点上可解析的 CSS 自定义属性，例如 `var(--login-aurora-color-start)`。
 */
export type AuroraColorStops = [string, string, string];

/**
 * Aurora WebGL 渲染参数
 */
export interface AuroraRenderOptions {
  /**
   * 从左到右参与混合的三个颜色停靠点
   */
  colorStops: AuroraColorStops;

  /**
   * 噪声随时间变化的速度系数
   */
  speed: number;

  /**
   * 极光边缘的颜色混合宽度
   */
  blend: number;

  /**
   * 极光波形在垂直方向的振幅
   */
  amplitude: number;

  /**
   * 可选的固定时间值，适合截图或需要停止动画的场景
   */
  time?: number;
}

/**
 * Aurora 渲染器控制器
 *
 * Vue 组件通过该控制器同步响应式参数，并在卸载时主动释放帧循环、观察器和 WebGL 上下文。
 */
export interface AuroraRendererControl {
  /**
   * 使用最新参数更新着色器 uniform
   *
   * @param options 最新 Aurora 渲染参数
   */
  update: (options: AuroraRenderOptions) => void;

  /**
   * 停止动画并释放 WebGL 资源
   */
  destroy: () => void;
}
