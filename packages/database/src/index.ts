/**
 * 服务端共享数据库入口
 *
 * 只向 API 服务暴露 Prisma Client 与数据库衍生类型。浏览器应用不得依赖本包，NestJS 模块、
 * 连接池参数、认证与业务逻辑也不得进入本包。
 */
export * from '../generated/prisma/client.js';
