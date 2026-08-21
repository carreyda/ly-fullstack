/**
 * 导入 Vue 模块
 */
import { computed, ref, useTemplateRef, watch } from 'vue';

/**
 * 导入类型声明
 */
import type { Ref } from 'vue';

/**
 * 滑块按钮宽度，与组件样式中的固定尺寸保持一致
 */
const SLIDER_HANDLE_WIDTH = 44;

/**
 * 松开指针时判定验证通过的最低进度
 */
const VERIFY_THRESHOLD = 0.94;

/**
 * 定义 Hook 参数
 */
interface UseSlideVerifyOptions {
  /**
   * 父级持有的双向验证状态
   */
  verified: Ref<boolean>;

  /**
   * 获取组件当前禁用状态
   */
  getDisabled: () => boolean;
}

/**
 * 管理基础滑块验证的指针、键盘和重置交互
 *
 * @param options 双向验证状态与禁用状态读取方法
 * @returns 滑块视图渲染状态和交互方法
 */
export const useSlideVerify = (options: UseSlideVerifyOptions) => {
  /**
   * 定义响应式数据
   */
  const trackRef = useTemplateRef<HTMLDivElement>('trackRef');
  const progress = ref(0);
  const activePointerId = ref<number | null>(null);
  const startClientX = ref(0);
  const startProgress = ref(0);

  /**
   * 计算属性
   * 作用：根据拖动状态和验证结果生成组件状态类名
   */
  const stateClass = computed(() => ({
    'base-slide-verify--active': activePointerId.value !== null,
    'base-slide-verify--success': options.verified.value,
    'base-slide-verify--disabled': options.getDisabled(),
  }));

  /**
   * 计算属性
   * 作用：生成滑块按钮在不同容器宽度下的横向位置
   */
  const handleStyle = computed(() => ({
    left: `calc(${progress.value * 100}% - ${progress.value * SLIDER_HANDLE_WIDTH}px)`,
  }));

  /**
   * 计算属性
   * 作用：生成已经滑过区域的实际宽度
   */
  const progressStyle = computed(() => ({
    width: `calc(${progress.value * 100}% + ${(1 - progress.value) * SLIDER_HANDLE_WIDTH}px)`,
  }));

  /**
   * 计算属性
   * 作用：为默认、拖动和成功状态提供明确反馈
   */
  const statusText = computed(() => {
    if (options.verified.value) {
      return '验证通过';
    }

    if (activePointerId.value !== null) {
      return progress.value >= VERIFY_THRESHOLD ? '松开完成验证' : '继续向右滑动';
    }

    return '按住滑块，拖动到最右侧';
  });

  /**
   * 将滑动进度限制在零到一之间
   *
   * @param value 待限制的滑动进度
   * @returns 可用于渲染的合法滑动进度
   */
  const clampProgress = (value: number): number => Math.min(Math.max(value, 0), 1);

  /**
   * 重置滑块位置和指针状态
   */
  const reset = (): void => {
    activePointerId.value = null;
    progress.value = 0;
  };

  /**
   * 完成当前滑块验证
   */
  const complete = (): void => {
    activePointerId.value = null;
    progress.value = 1;
    options.verified.value = true;
  };

  /**
   * 根据指针位置更新滑动进度
   *
   * @param clientX 指针相对浏览器视口的横坐标
   */
  const updateProgress = (clientX: number): void => {
    if (!trackRef.value) {
      return;
    }

    const travelWidth = Math.max(trackRef.value.getBoundingClientRect().width - SLIDER_HANDLE_WIDTH, 1);
    const delta = (clientX - startClientX.value) / travelWidth;
    progress.value = clampProgress(startProgress.value + delta);
  };

  /**
   * 开始拖动滑块
   *
   * @param event 指针按下事件
   */
  const handlePointerDown = (event: PointerEvent): void => {
    if (options.getDisabled() || options.verified.value || activePointerId.value !== null) {
      return;
    }

    startClientX.value = event.clientX;
    startProgress.value = progress.value;
    activePointerId.value = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  /**
   * 拖动过程中同步滑块位置
   *
   * @param event 指针移动事件
   */
  const handlePointerMove = (event: PointerEvent): void => {
    if (activePointerId.value !== event.pointerId) {
      return;
    }

    updateProgress(event.clientX);
  };

  /**
   * 松开滑块后判定是否到达验证区域
   *
   * @param event 指针抬起事件
   */
  const handlePointerUp = (event: PointerEvent): void => {
    if (activePointerId.value !== event.pointerId) {
      return;
    }

    updateProgress(event.clientX);
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    if (progress.value >= VERIFY_THRESHOLD) {
      complete();
      return;
    }

    reset();
  };

  /**
   * 指针操作被浏览器中断时恢复默认状态
   */
  const handlePointerCancel = (): void => {
    if (!options.verified.value) {
      reset();
    }
  };

  /**
   * 支持使用方向键、Home 和 End 操作滑块
   *
   * @param event 键盘事件
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    if (options.getDisabled() || options.verified.value) {
      return;
    }

    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    if (event.key === 'Home') {
      reset();
      return;
    }

    if (event.key === 'End') {
      complete();
      return;
    }

    const direction = event.key === 'ArrowRight' ? 0.1 : -0.1;
    progress.value = clampProgress(progress.value + direction);
    if (progress.value >= VERIFY_THRESHOLD) {
      complete();
    }
  };

  /**
   * 监听事件
   */
  watch(
    options.verified,
    (value) => {
      if (value) {
        progress.value = 1;
        return;
      }

      reset();
    },
    { immediate: true },
  );

  return {
    trackRef,
    progress,
    stateClass,
    handleStyle,
    progressStyle,
    statusText,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleKeydown,
  };
};
