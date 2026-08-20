/**
 * 获取管理后台 API 基础路径
 *
 * 开发环境使用包含 `/api` 的 NestJS 完整地址并由服务端 CORS 白名单授权；生产环境使用站点同源 `/api`。
 * 去除末尾斜杠可以避免与 API 模块的相对路径拼接出重复分隔符，Rsbuild 不参与接口代理。
 *
 * 下一阶段接入认证后，登录凭证的读取与 401 处理也挂在本模块；
 * 可参考的迁移文件清单见 `docs/extraction-report.md`。
 *
 * @returns Rsbuild 构建期注入的 API 基础路径
 */
export const getServiceBaseUrl = (): string => {
  return import.meta.env.API_BASE_URL.replace(/\/$/, '');
};
