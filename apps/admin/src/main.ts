import { createApp } from 'vue';

import App from './App.vue';
import './assets/styles/index.scss';
import { bootstrapAdminApp } from './bootstrap';

/**
 * 创建并挂载管理后台应用
 *
 * 入口只负责创建、启动并挂载应用；插件注册、认证边界和版本更新监听统一收口到 `bootstrap` 模块。
 */
const app = createApp(App);
bootstrapAdminApp(app);
app.mount('#root');
