import { createApp } from 'vue';

import App from './App.vue';
import './assets/styles/index.scss';
import router from './router';
import pinia from './stores';

/**
 * 创建并挂载管理后台应用
 *
 * 启动阶段装配 Router、Pinia 和全局样式。该入口只执行一次，常规整页生命周期由浏览器回收。
 */
const app = createApp(App);
app.use(pinia).use(router).mount('#root');
