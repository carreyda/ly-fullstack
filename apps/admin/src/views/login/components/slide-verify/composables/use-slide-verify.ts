import type { UseSlideVerifyOptions } from '@/types';

/**
 * 拖动轨道中的滑块按钮宽度
 */
const SLIDER_HANDLE_WIDTH = 40;

/**
 * 管理图片拼图滑块的指针交互和坐标换算
 *
 * 组件不接触正确答案，只把滑块轨道的实际拖动距离换算成验证图片像素，
 * 然后交给 Admin API 校验。
 *
 * @param options 当前挑战、禁用状态和位置提交回调
 * @returns 滑块和拼图块渲染状态及指针事件方法
 */
export const useSlideVerify = (options: UseSlideVerifyOptions) => {
  const sliderTrackRef = useTemplateRef<HTMLDivElement>('sliderTrackRef');
  const sliderLeft = ref(0);
  const blockOffset = ref(0);
  const originX = ref(0);
  const activePointerId = ref<number | null>(null);

  /**
   * 当前滑块已完成的轨道比例
   */
  const progress = computed(() => {
    const track = sliderTrackRef.value;
    if (!track) {
      return 0;
    }

    const maximum = Math.max(track.getBoundingClientRect().width - SLIDER_HANDLE_WIDTH, 1);
    return sliderLeft.value / maximum;
  });

  /**
   * 拼图块相对验证图片的位置和尺寸
   */
  const puzzleStyle = computed(() => {
    const challenge = options.getChallenge();
    return {
      left: `${(blockOffset.value / challenge.imageWidth) * 100}%`,
      top: `${(challenge.puzzleTop / challenge.imageHeight) * 100}%`,
      width: `${(challenge.puzzleSize / challenge.imageWidth) * 100}%`,
    };
  });

  /**
   * 滑块按钮的横向位置
   */
  const sliderStyle = computed(() => ({ left: `${sliderLeft.value}px` }));

  /**
   * 轨道中已经拖动部分的填充宽度
   */
  const sliderMaskStyle = computed(() => ({ width: `${sliderLeft.value + SLIDER_HANDLE_WIDTH}px` }));

  /**
   * 合并指针拖动和服务端校验状态的轨道类名
   */
  const trackStateClass = computed(() => ({
    'slide-verify__track--active': activePointerId.value !== null,
    [`slide-verify__track--${options.getResultState()}`]: options.getResultState() !== 'default',
  }));

  /**
   * 当前交互阶段的实时文字反馈
   */
  const statusText = computed(() => {
    const resultState = options.getResultState();
    if (resultState === 'verifying') return '正在验证位置';
    if (resultState === 'success') return '验证通过';
    if (resultState === 'fail') return '位置不正确，请重试';
    if (activePointerId.value !== null) return '将拼图块拖到缺口位置';
    return '向右滑动完成验证';
  });

  /**
   * 根据指针横坐标同步轨道按钮和拼图块位置
   *
   * @param clientX 指针相对浏览器视口的横坐标
   */
  const updatePosition = (clientX: number): void => {
    const track = sliderTrackRef.value;
    if (!track) {
      return;
    }

    const maximumSliderLeft = Math.max(track.getBoundingClientRect().width - SLIDER_HANDLE_WIDTH, 1);
    sliderLeft.value = Math.min(Math.max(clientX - originX.value, 0), maximumSliderLeft);

    const challenge = options.getChallenge();
    const maximumPuzzleOffset = challenge.imageWidth - challenge.puzzleSize;
    blockOffset.value = (sliderLeft.value / maximumSliderLeft) * maximumPuzzleOffset;
  };

  /**
   * 开始拖动当前滑块
   *
   * @param event 指针按下事件
   */
  const handlePointerDown = (event: PointerEvent): void => {
    if (options.isLoading() || activePointerId.value !== null) {
      return;
    }

    originX.value = event.clientX - sliderLeft.value;
    activePointerId.value = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  /**
   * 指针移动时同步拼图位置
   *
   * @param event 指针移动事件
   */
  const handlePointerMove = (event: PointerEvent): void => {
    if (activePointerId.value === event.pointerId) {
      updatePosition(event.clientX);
    }
  };

  /**
   * 松开指针后把实际像素偏移交给服务端校验
   *
   * @param event 指针抬起事件
   */
  const handlePointerUp = (event: PointerEvent): void => {
    if (activePointerId.value !== event.pointerId) {
      return;
    }

    updatePosition(event.clientX);
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    activePointerId.value = null;
    options.onVerify(Math.round(blockOffset.value));
  };

  /**
   * 指针交互被浏览器中断时放弃当前拖动
   */
  const handlePointerCancel = (): void => {
    activePointerId.value = null;
  };

  /**
   * 新挑战到达时把滑块和拼图块恢复到起点
   */
  watch(
    () => options.getChallenge().captchaId,
    () => {
      activePointerId.value = null;
      sliderLeft.value = 0;
      blockOffset.value = 0;
    },
  );

  return {
    sliderTrackRef,
    progress,
    trackStateClass,
    puzzleStyle,
    sliderStyle,
    sliderMaskStyle,
    statusText,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  };
};
