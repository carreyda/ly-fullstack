/**
 * Admin API 横切能力统一出口
 *
 * 聚合认证装饰器、Guard 和 DTO 校验 Pipe，业务 Controller 从该入口使用横切能力，
 * 不需要依赖各实现文件的内部目录结构。
 */
export * from './decorators/current-admin.decorator';
export * from './decorators/require-permissions.decorator';
export * from './guards/admin-jwt.guard';
export * from './guards/permission.guard';
export * from './pipes/create-dto-validation-pipe';
