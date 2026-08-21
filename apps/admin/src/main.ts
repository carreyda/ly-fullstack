import { createApp } from 'vue';

import App from './App.vue';
import './assets/styles/index.scss';
import { emitter } from './emitter';
import router from './router';
import pinia, { useAuthStore } from './stores';

/**
 * 创建并挂载管理后台应用
 *
 * 启动阶段装配 Router、Pinia 和全局样式，并注册管理 API 的全局登录失效监听。
 * 该入口只执行一次，常规整页生命周期由浏览器回收，因此全局 mitt 监听不需要在组件卸载时清理。
 */
const app = createApp(App);

/**
 * 先安装 Pinia，再创建任何 Store
 *
 * Pinia 在应用安装前会暂存插件；若提前创建 Store，持久化插件不会补挂到该实例，认证 Token
 * 只能停留在内存中并在刷新后丢失。
 */
app.use(pinia);

/**
 * 恢复 Pinia 持久化的认证状态并同步 Axios 使用的内存 Token
 *
 * 这里只同步 Token，不直接信任本地保存的角色和权限；首次受保护路由会通过 `/auth/me` 重新确认。
 */
const authStore = useAuthStore(pinia);
authStore.syncRequestToken();

/**
 * 处理管理 API 在页面运行期间返回的登录失效事件
 *
 * 收到事件后清空 Token 和 RBAC 会话，并携带当前地址返回登录页。登录接口自身的 401 和路由守卫
 * 恢复会话时的 401 不派发该事件，避免重复跳转。
 */
emitter.on('EVENT_AUTH_UNAUTHORIZED', () => {
  const currentRoute = router.currentRoute.value;
  authStore.logout();

  if (currentRoute.name !== 'Login') {
    void router.replace({
      name: 'Login',
      query: { redirect: currentRoute.fullPath },
    });
  }
});

app.use(router).mount('#root');
