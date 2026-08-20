/**
 * 导入类型声明
 */
import type { Pinia } from 'pinia';

/**
 * 导入持久化模块
 */
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

/**
 * 引入pinia
 */
const pinia: Pinia = createPinia();

/**
 * 注入持久化插件
 */
pinia.use(piniaPluginPersistedstate);

/**
 * 导出pinia
 */
export default pinia;
