/**
 * 登录页记住管理员账号的 Cookie 键
 *
 * 管理员账号与应用版本缓存使用不同的存储边界，版本更新清理 localStorage、sessionStorage 和浏览器缓存时，
 * 不会误删用户主动保存的账号；密码交给浏览器密码管理器处理，不写入应用 Cookie。
 */
export const COOKIE_ADMIN_USERNAME_KEY = 'LY_FULLSTACK_ADMIN_USERNAME';

/**
 * 历史版本保存明文账号密码的 Cookie 键
 *
 * 仅用于登录页初始化时清理旧数据，禁止继续写入该键。完成存量用户迁移后可以删除此兼容常量。
 */
export const COOKIE_ADMIN_LEGACY_CREDENTIALS_KEY = 'LY_FULLSTACK_ADMIN_CREDENTIALS';
