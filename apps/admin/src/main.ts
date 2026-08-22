import { createApp } from 'vue';

import App from './App.vue';
import './assets/styles/index.scss';
import { setupAdminApp } from './setup';

/**
 * 创建并挂载管理后台应用
 *
 * 入口只负责创建、装配并挂载应用；插件注册和全局副作用统一收口到 `setup.ts`。
 */
const app = createApp(App);
setupAdminApp(app);
app.mount('#root');
