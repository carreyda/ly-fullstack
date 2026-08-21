/**
 * 管理后台支持的主题名称
 *
 * `dark` 表示默认深色主题，`light` 表示浅色主题。该类型同时约束主题 Store、根节点
 * `data-theme` 属性和全局主题变更事件，避免各模块使用不一致的字符串。
 */
export type ThemeName = 'dark' | 'light';
