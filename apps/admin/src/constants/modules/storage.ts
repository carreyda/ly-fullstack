/**
 * 登录页记住管理员账号密码的 Cookie 键
 *
 * 账号密码与应用版本缓存使用不同的存储边界，版本更新清理 localStorage、sessionStorage 和浏览器缓存时，
 * 不会误删用户主动保存的登录信息。
 */
export const COOKIE_ADMIN_CREDENTIALS_KEY = 'LY_FULLSTACK_ADMIN_CREDENTIALS';
