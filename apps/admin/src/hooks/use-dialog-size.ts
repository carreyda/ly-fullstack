const DIALOG_VERTICAL_GUTTER = 160;
const DIALOG_MIN_HEIGHT = 360;

/**
 * 管理动态内容居中弹框的可视高度
 *
 * 只服务于内容可能超过视口的通用业务弹框。短表单直接使用 `el-dialog`，大型持续录入表单继续使用
 * 右侧抽屉，不能为了统一形式滥用该 Hook。
 *
 * @param preferredHeight 设计稿在宽屏下希望使用的内容高度
 * @returns 弹框可见状态、实时内容高度和开关方法
 */
export const useDialogSize = (preferredHeight: number) => {
  const dialogVisible = ref(false);
  const dialogHeight = ref(DIALOG_MIN_HEIGHT);

  /**
   * 根据当前视口更新弹框内容高度
   */
  const updateDialogHeight = (): void => {
    dialogHeight.value = Math.max(
      DIALOG_MIN_HEIGHT,
      Math.min(preferredHeight, window.innerHeight - DIALOG_VERTICAL_GUTTER),
    );
  };

  const openDialog = (): void => {
    updateDialogHeight();
    dialogVisible.value = true;
  };

  const closeDialog = (): void => {
    dialogVisible.value = false;
  };

  onMounted(() => {
    window.addEventListener('resize', updateDialogHeight);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateDialogHeight);
  });

  return {
    dialogVisible,
    dialogHeight,
    openDialog,
    closeDialog,
  };
};
