import { Color, Mesh, Program, Renderer, Triangle } from 'ogl';

import type { AuroraColorStops, AuroraRendererControl, AuroraRenderOptions } from '@/types';

/**
 * Aurora 顶点着色器
 *
 * OGL 的全屏三角形已经提供裁剪空间坐标，这里只负责把坐标直接写入 WebGL2 输出。
 */
const VERTEX_SHADER = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Aurora 片元着色器
 *
 * 着色器通过二维 simplex noise 生成连续波形，再按三个水平颜色停靠点完成渐变混合。
 * 最终输出透明像素，使极光可以叠加到登录页自身的主题背景上。
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x
      + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) { \
  int index = 0; \
  for (int i = 0; i < 2; i++) { \
    ColorStop currentColor = colors[i]; \
    bool isInBetween = currentColor.position <= factor; \
    index = int(mix(float(index), float(i), float(isInBetween))); \
  } \
  ColorStop currentColor = colors[index]; \
  ColorStop nextColor = colors[index + 1]; \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = uv.y * 2.0 - height + 0.2;
  float intensity = 0.6 * height;
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

/**
 * 解析颜色停靠点中的 CSS 自定义属性
 *
 * 普通十六进制颜色原样返回；`var(--name)` 会从 Aurora 根元素的最终计算样式中读取，使调用方
 * 可以继续通过主题 SCSS 管理颜色，而不必把主题色硬编码在 Vue 脚本中。
 *
 * @param host Aurora 根元素
 * @param color 原始颜色或 CSS 自定义属性表达式
 * @returns OGL Color 可以解析的颜色字符串
 */
const resolveColor = (host: HTMLElement, color: string): string => {
  const computedStyle = getComputedStyle(host);
  const visitedVariables = new Set<string>();
  let resolvedColor = color;

  while (true) {
    const variableName = resolvedColor.match(/^var\((--[a-z0-9-]+)\)$/i)?.[1];
    if (!variableName || visitedVariables.has(variableName)) {
      break;
    }

    visitedVariables.add(variableName);
    resolvedColor = computedStyle.getPropertyValue(variableName).trim();
  }

  return resolvedColor || '#000000';
};

/**
 * 把三个颜色停靠点转换成 OGL uniform 使用的 RGB 数组
 *
 * @param host Aurora 根元素，用于解析主题 CSS 自定义属性
 * @param colorStops 三个颜色停靠点
 * @returns 归一化后的三组 RGB 数值
 */
const createColorStopValues = (host: HTMLElement, colorStops: AuroraColorStops): number[][] =>
  colorStops.map((color) => {
    const parsedColor = new Color(resolveColor(host, color));
    return [parsedColor.r, parsedColor.g, parsedColor.b];
  });

/**
 * 创建 Aurora OGL 渲染器
 *
 * 渲染器使用 ResizeObserver 跟踪真实容器尺寸，并按浏览器动画帧连续绘制；页面不可见或组件离开视口时
 * 会跳过 GPU 绘制。系统开启“减少动态效果”后只绘制静态帧。初始化失败时调用降级回调，登录页
 * 仍保留普通主题背景和全部交互能力。
 *
 * @param host 承载 WebGL canvas 的 Aurora 根元素
 * @param initialOptions 首次挂载时使用的完整渲染参数
 * @param onFallback WebGL2 初始化或着色器编译失败时的降级回调
 * @returns 可更新参数并释放资源的渲染器控制器；初始化失败时返回 undefined
 */
export const createAuroraRenderer = (
  host: HTMLElement,
  initialOptions: AuroraRenderOptions,
  onFallback: () => void,
): AuroraRendererControl | undefined => {
  let renderer: Renderer;

  try {
    renderer = new Renderer({
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      powerPreference: 'high-performance',
    });
  } catch {
    onFallback();
    return undefined;
  }

  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.canvas.style.display = 'block';
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  gl.canvas.style.backgroundColor = 'transparent';

  let geometry: Triangle;
  let program: Program;
  let mesh: Mesh;

  try {
    geometry = new Triangle(gl);
    delete geometry.attributes.uv;
    program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: initialOptions.amplitude },
        uColorStops: { value: createColorStopValues(host, initialOptions.colorStops) },
        uResolution: { value: [1, 1] },
        uBlend: { value: initialOptions.blend },
      },
    });
    mesh = new Mesh(gl, { geometry, program });
  } catch {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    onFallback();
    return undefined;
  }

  host.appendChild(gl.canvas);

  let options = initialOptions;
  let animationFrame = 0;
  let isVisible = true;
  let destroyed = false;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * 绘制单帧 Aurora
   *
   * @param timestamp 浏览器提供的高精度时间戳
   */
  const drawFrame = (timestamp: number): void => {
    const time = options.time ?? timestamp * 0.01;
    program.uniforms.uTime.value = time * options.speed * 0.1;
    renderer.render({ scene: mesh });
  };

  /**
   * 按浏览器动画帧推进极光噪声
   *
   * @param timestamp 浏览器提供的高精度时间戳
   */
  const renderLoop = (timestamp: number): void => {
    animationFrame = window.requestAnimationFrame(renderLoop);

    if (destroyed || !isVisible || document.hidden) {
      return;
    }

    drawFrame(timestamp);
  };

  /**
   * 根据容器尺寸同步 OGL 画布和分辨率 uniform
   */
  const resize = (): void => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];

    if (reducedMotionQuery.matches) {
      drawFrame(0);
    }
  };

  /**
   * 根据系统动态效果偏好启动动画或保留静态帧
   */
  const syncMotionPreference = (): void => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;

    if (reducedMotionQuery.matches) {
      drawFrame(0);
      return;
    }

    animationFrame = window.requestAnimationFrame(renderLoop);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const intersectionObserver = new IntersectionObserver((entries) => {
    isVisible = entries[0]?.isIntersecting !== false;
  });
  intersectionObserver.observe(host);
  reducedMotionQuery.addEventListener('change', syncMotionPreference);

  resize();
  syncMotionPreference();

  /**
   * 使用最新参数同步 Aurora 着色器 uniform
   *
   * @param nextOptions 最新 Aurora 渲染参数
   */
  const update = (nextOptions: AuroraRenderOptions): void => {
    options = nextOptions;
    program.uniforms.uAmplitude.value = options.amplitude;
    program.uniforms.uBlend.value = options.blend;
    program.uniforms.uColorStops.value = createColorStopValues(host, options.colorStops);

    if (reducedMotionQuery.matches) {
      drawFrame(0);
    }
  };

  /**
   * 停止 Aurora 动画并释放观察器、着色器、几何体和 WebGL 上下文
   */
  const destroy = (): void => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    reducedMotionQuery.removeEventListener('change', syncMotionPreference);
    geometry.remove();
    program.remove();

    if (gl.canvas.parentNode === host) {
      host.removeChild(gl.canvas);
    }

    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return { update, destroy };
};
