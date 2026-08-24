import type { FluidGlassRenderOptions, ThemeName } from '@/types';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * .5 + .5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const DARK_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec2 u_mouseVelocity;
  uniform float u_mouseMix;
  uniform float u_time;
  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_pointer;
  uniform float u_seed;
  uniform float u_surfaceOpacity;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = .53;
    mat2 rot = mat2(.80, -.60, .60, .80);
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p = rot * p * 2.02 + vec2(17.13, 9.27);
      amp *= .49;
    }
    return value;
  }

  float softBlob(vec2 p, vec2 center, float radius, float softness) {
    return 1.0 - smoothstep(radius - softness, radius + softness, length(p - center));
  }

  void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / max(1.0, u_resolution.y);
    vec2 p = (uv - .5) * vec2(aspect, 1.0);
    vec2 mouse = (u_mouse - .5) * vec2(aspect, 1.0);
    vec2 delta = p - mouse;
    float dist = length(delta);
    float mouseField = exp(-dist * dist * 7.2) * u_mouseMix * u_pointer;
    vec2 normal = delta / max(dist, .035);
    vec2 tangent = vec2(-normal.y, normal.x);
    p += normal * mouseField * .115 + tangent * mouseField * (u_mouseVelocity.x - u_mouseVelocity.y) * .045;

    float t = u_time * u_speed;
    vec2 seedVec = vec2(u_seed * 1.713, u_seed * .937);
    float w1 = fbm(p * 1.22 + seedVec + vec2(t * .075, -t * .052));
    float w2 = fbm(p * 1.54 - seedVec * .37 + vec2(-t * .057, t * .064) + w1 * .82);
    vec2 q = p + (vec2(w1, w2) - .5) * (.58 * u_intensity);
    float broad = fbm(q * 1.12 + vec2(t * .041, -t * .033));
    float detail = fbm(q * 2.18 + vec2(-t * .083, t * .057) + broad * .95);
    float ribbon = .5 + .5 * sin(q.x * 3.15 + q.y * .76 + detail * 5.0 + t * .25 + u_seed);
    float colorMix = smoothstep(.16, .88, broad * .61 + ribbon * .39);
    vec3 fluid = mix(u_colorA, u_colorB, colorMix);
    float shadow = smoothstep(.43, .84, detail * .69 + (.5 + .5 * sin(q.y * 4.2 - q.x * .8 - t * .17)) * .31);
    fluid = mix(fluid, u_colorC, shadow * .74);

    float plume1 = softBlob(p, vec2(aspect * .23 + .12 * sin(t * .08 + u_seed), .16 * cos(t * .11 + u_seed)), .52, .38);
    float plume2 = softBlob(p, vec2(aspect * .39 + .10 * cos(t * .07 - u_seed), -.24 + .11 * sin(t * .09)), .43, .34);
    float haze = clamp(plume1 * .72 + plume2 * .58, 0.0, 1.0);
    float reveal = smoothstep(.055, .735, uv.x + (.5 - broad) * .27 + .070 * sin(uv.y * 4.0 + t * .12));
    reveal *= mix(.70, 1.0, haze);
    reveal = clamp(reveal * u_intensity, 0.0, 1.0);

    float spec = pow(clamp(1.0 - abs(detail - .52) * 2.0, 0.0, 1.0), 5.0) * reveal;
    float caustic = pow(clamp(.52 + .48 * sin((q.x - q.y) * 5.2 + detail * 7.0 - t * .18), 0.0, 1.0), 7.0) * reveal;
    vec3 glow = mix(fluid, vec3(.34, 1.0, .90), spec * .18 + caustic * .09);
    glow *= .78 + .25 * haze;
    glow = mix(glow, glow * .70, u_surfaceOpacity * .34);
    float filament = smoothstep(.48, .86, detail) * reveal;
    float density = clamp(reveal * (.36 + .48 * haze) + filament * .22 + mouseField * .28, 0.0, 1.0);
    float alpha = clamp(.035 * haze + density * (.24 + .50 * u_intensity) + spec * .08 + u_surfaceOpacity * density * .14, 0.0, .92);
    float edgeFade = smoothstep(1.08, .70, length((uv - .5) * vec2(1.0, .92)));
    alpha *= edgeFade;
    glow = pow(max(glow, 0.0), vec3(.94));
    gl_FragColor = vec4(glow, alpha);
  }
`;

/**
 * 浅色主题使用实体品牌绿流体，而不是把深色透明材质简单混白。
 *
 * 左侧白色留白由着色器自身生成，确保文字始终清晰；右侧保留高密度绿色流体，避免浅色卡片
 * 退化成一层发灰的青色雾。Shader 与深色版本使用相同的 Uniform 协议，便于共用渲染生命周期。
 */
const LIGHT_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_mouseMix;
  uniform float u_time;
  uniform float u_speed;
  uniform float u_seed;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21) + u_seed);
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = .55;
    mat2 rotation = mat2(.8, .6, -.6, .8);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotation * p * 2.0 + 3.7;
      amplitude *= .5;
    }
    return value;
  }

  void main() {
    vec2 uv = v_uv;
    vec2 p = uv * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0) * 1.6;
    float time = u_time * u_speed * .245;

    vec2 q = vec2(
      fbm(p + time * vec2(.6, .2)),
      fbm(p + time * vec2(-.4, .5) + 5.2)
    );
    vec2 r = vec2(
      fbm(p + 2.2 * q + time * vec2(.3, -.4) + 1.7),
      fbm(p + 2.2 * q + time * vec2(-.2, .3) + 8.3)
    );
    float fluid = fbm(p + 2.4 * r);

    vec3 fluidColor = mix(u_colorA, u_colorB, smoothstep(.15, .62, fluid));
    fluidColor = mix(fluidColor, u_colorC, smoothstep(.60, .95, clamp(q.x * 1.3, 0.0, 1.0)));
    fluidColor += .15 * r.y * u_colorB;
    fluidColor = mix(
      fluidColor,
      fluidColor * fluidColor * 1.35 + fluidColor * .12,
      u_mouseMix * .55
    );

    float colorZone = smoothstep(.18, .72, uv.x + .15 * (q.y - .5));
    float whiteTop = smoothstep(.58, 1.08, uv.y) * .28;
    float density = smoothstep(.24, .72, fluid + .22 * r.x);
    vec3 baseColor = vec3(.973, .988, .980);
    float mask = colorZone * density;
    mask = clamp(mask + colorZone * .20, 0.0, .88);
    vec3 outputColor = mix(baseColor, fluidColor, mask);
    outputColor = mix(outputColor, baseColor, whiteTop * (1.0 - mask * .55));

    gl_FragColor = vec4(outputColor, 1.0);
  }
`;

const UNIFORM_NAMES = [
  'u_resolution',
  'u_mouse',
  'u_mouseVelocity',
  'u_mouseMix',
  'u_time',
  'u_speed',
  'u_intensity',
  'u_pointer',
  'u_seed',
  'u_surfaceOpacity',
  'u_colorA',
  'u_colorB',
  'u_colorC',
] as const;

/**
 * 把十六进制颜色转换成 WebGL 使用的 RGB 数组
 *
 * @param hex 十六进制颜色
 * @returns 归一化后的 RGB 数组
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);

  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

/**
 * 限制数值范围
 *
 * @param value 原始数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的数值
 */
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * 编译单个 WebGL 着色器
 *
 * @param gl WebGL 上下文
 * @param type 着色器类型
 * @param source 着色器源码
 * @returns 编译完成的着色器
 */
const compileShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('无法创建 Fluid Glass 着色器');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error('Fluid Glass 着色器编译失败');
  }

  return shader;
};

/**
 * 创建 Fluid Glass WebGL 程序
 *
 * @param gl WebGL 上下文
 * @param fragmentShaderSource 当前主题使用的片元着色器
 * @returns 链接完成的 WebGL 程序
 */
const createProgram = (gl: WebGLRenderingContext, fragmentShaderSource: string): WebGLProgram => {
  const program = gl.createProgram();

  if (!program) {
    throw new Error('无法创建 Fluid Glass 渲染程序');
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new Error('Fluid Glass 渲染程序链接失败');
  }

  return program;
};

/**
 * 创建单张 Fluid Glass 卡片渲染器
 *
 * @param host 卡片根元素
 * @param canvas WebGL 画布
 * @param options 渲染参数
 * @param themeName 当前主题，用于选择主题专属片元着色器和输入色板
 * @param onFallback WebGL 不可用时的回调
 * @returns 组件卸载时使用的清理函数
 */
export const createFluidGlassRenderer = (
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  options: FluidGlassRenderOptions,
  themeName: ThemeName,
  onFallback: () => void,
): (() => void) => {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    onFallback();
    return (): void => undefined;
  }

  let program: WebGLProgram;

  try {
    program = createProgram(gl, themeName === 'light' ? LIGHT_FRAGMENT_SHADER : DARK_FRAGMENT_SHADER);
  } catch {
    onFallback();
    return (): void => undefined;
  }

  const buffer = gl.createBuffer();

  if (!buffer) {
    onFallback();
    gl.deleteProgram(program);
    return (): void => undefined;
  }

  const uniforms = {} as Record<(typeof UNIFORM_NAMES)[number], WebGLUniformLocation | null>;
  UNIFORM_NAMES.forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });

  gl.clearColor(0, 0, 0, 0);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const controller = new AbortController();
  const mouse = [0.76, 0.46];
  const mouseTarget = [0.76, 0.46];
  const mouseVelocity = [0, 0];
  let pointerInside = false;
  let mouseMix = 0;
  let lastPointer = [0, 0];
  let lastPointerTime = 0;
  let lastFrame = 0;
  let active = true;
  let animationFrame = 0;
  const renderColors: [[number, number, number], [number, number, number], [number, number, number]] =
    themeName === 'light'
      ? [hexToRgb(options.lightColorA), hexToRgb(options.lightColorB), hexToRgb(options.lightColorC)]
      : [hexToRgb(options.colorA), hexToRgb(options.colorB), hexToRgb(options.colorC)];

  /**
   * 根据卡片实际尺寸同步画布像素
   */
  const resize = (): void => {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));

    if (canvas.width === width && canvas.height === height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  /**
   * 记录指针位置和移动速度
   *
   * @param event 指针事件
   */
  const updatePointer = (event: PointerEvent): void => {
    const rect = host.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const y = clamp(1 - (event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
    const now = performance.now();
    const deltaTime = Math.max(8, now - lastPointerTime || 16);

    mouseTarget[0] = x;
    mouseTarget[1] = y;
    mouseVelocity[0] = clamp((x - lastPointer[0]) / (deltaTime / 16.67), -0.12, 0.12);
    mouseVelocity[1] = clamp((y - lastPointer[1]) / (deltaTime / 16.67), -0.12, 0.12);
    lastPointer = [x, y];
    lastPointerTime = now;
    mouseMix = 1;
  };

  /**
   * 绘制当前帧
   *
   * @param now 当前高精度时间
   */
  const render = (now: number): void => {
    animationFrame = window.requestAnimationFrame(render);

    if (!active || document.hidden || now - lastFrame < 1000 / 45) {
      return;
    }

    lastFrame = now;
    mouse[0] += (mouseTarget[0] - mouse[0]) * 0.105;
    mouse[1] += (mouseTarget[1] - mouse[1]) * 0.105;
    mouseVelocity[0] *= 0.9;
    mouseVelocity[1] *= 0.9;
    mouseMix += ((pointerInside ? 1 : 0) - mouseMix) * 0.075;

    if (!pointerInside) {
      mouseMix *= 0.945;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gl.useProgram(program);
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_mouse, mouse[0], mouse[1]);
    gl.uniform2f(uniforms.u_mouseVelocity, mouseVelocity[0], mouseVelocity[1]);
    gl.uniform1f(uniforms.u_mouseMix, clamp(mouseMix, 0, 1.2));
    gl.uniform1f(uniforms.u_time, now * 0.001 + options.seed * 3.73);
    gl.uniform1f(uniforms.u_speed, reducedMotion ? Math.min(options.speed, 0.08) : options.speed);
    gl.uniform1f(uniforms.u_intensity, options.intensity);
    gl.uniform1f(uniforms.u_pointer, options.pointer);
    gl.uniform1f(uniforms.u_seed, options.seed);
    gl.uniform1f(uniforms.u_surfaceOpacity, options.surface);
    gl.uniform3fv(uniforms.u_colorA, renderColors[0]);
    gl.uniform3fv(uniforms.u_colorB, renderColors[1]);
    gl.uniform3fv(uniforms.u_colorC, renderColors[2]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  host.addEventListener(
    'pointerenter',
    (event) => {
      pointerInside = true;
      updatePointer(event);
    },
    { signal: controller.signal, passive: true },
  );
  host.addEventListener('pointermove', updatePointer, { signal: controller.signal, passive: true });
  host.addEventListener(
    'pointerleave',
    () => {
      pointerInside = false;
      mouseTarget[0] = 0.76;
      mouseTarget[1] = 0.46;
    },
    { signal: controller.signal, passive: true },
  );

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver((entries) => {
    active = entries[0]?.isIntersecting !== false;
  });
  intersectionObserver.observe(host);
  resize();
  animationFrame = window.requestAnimationFrame(render);

  return (): void => {
    window.cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    controller.abort();
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
};
