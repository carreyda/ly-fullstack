import mitt from 'mitt';
import type { AdminEmitterEvents } from '@/types';
import type { Emitter } from 'mitt';

/**
 * 管理后台全局事件总线
 *
 * 仅承载无法通过父子组件通信表达的跨模块通知，业务状态仍由 Pinia 管理。
 */
export const emitter: Emitter<AdminEmitterEvents> = mitt<AdminEmitterEvents>();
