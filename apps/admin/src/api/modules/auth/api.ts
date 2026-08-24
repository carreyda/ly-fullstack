/**
 * 管理员账号密码登录接口
 *
 * 请求不携带 Bearer Token，成功后由 Auth Store 保存响应中的 Access Token 和 RBAC 会话。
 */
export const API_CREATE_AUTH_SESSION = '/auth/login';

/**
 * 创建管理端登录图片滑块挑战接口
 */
export const API_CREATE_AUTH_CAPTCHA = '/auth/captcha';

/**
 * 校验管理端登录图片滑块位置接口
 */
export const API_VERIFY_AUTH_CAPTCHA = '/auth/captcha/verify';

/**
 * 获取当前管理员会话接口
 *
 * 请求必须携带 Bearer Token，服务端会重新查询账号状态、有效角色、菜单和权限。
 */
export const API_GET_AUTH_SESSION = '/auth/me';

/**
 * 当前管理员修改本人登录密码接口
 *
 * 请求必须携带 Bearer Token，并在请求体中再次提供当前密码完成身份确认。
 */
export const API_CHANGE_ADMIN_PASSWORD = '/auth/password';
