import { createApp, h } from 'vue';

/**
 * 在真实组件 setup 上下文中执行 Composable 的测试辅助函数
 *
 * 管理页 Composable 内部注册了 `onMounted`、`onBeforeUnmount` 等生命周期钩子，脱离组件实例调用时
 * 钩子不会执行。本函数创建并挂载一个最小组件，让 Composable 在真实的 setup 与挂载流程中运行，
 * 并返回卸载句柄用于验证清理逻辑。
 *
 * 测试需要注入 `useTemplateRef` 依赖（例如表单实例替身）时，可在 setup 回调内通过
 * `getCurrentInstance()?.refs` 写入对应名称的模板引用。
 *
 * @param setup 在组件实例激活期间执行的回调，返回被测 Composable 的结果
 * @returns Composable 的返回值与卸载组件的句柄
 */
export const withSetup = <TResult>(setup: () => TResult): [TResult, () => void] => {
  let result: TResult | undefined;

  const app = createApp({
    setup: () => {
      result = setup();
      return () => h('div');
    },
  });

  const root = document.createElement('div');
  app.mount(root);

  return [result as TResult, () => app.unmount()];
};
