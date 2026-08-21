/**
 * 导入轻量事件总线。
 */
import mitt from 'mitt';

/**
 * 导入类型声明
 */
import type { ThemeName } from '@/types';
import type { Emitter } from 'mitt';

/**
 * 管理后台全局事件声明
 */
type Events = {
  /**
   * 主题完成切换后通知需要重建主题相关资源的模块。
   */
  EVENT_THEME_CHANGE: ThemeName;
};

/**
 * 管理后台全局事件总线
 *
 * 仅承载无法通过父子组件通信表达的跨模块通知，业务状态仍由 Pinia 管理。
 */
export const emitter: Emitter<Events> = mitt<Events>();
