import { ValidationPipe } from '@nestjs/common';

import type { Type } from '@nestjs/common';

/**
 * 为开发环境的 tsx 运行时显式绑定 DTO 类型
 *
 * tsx 开发运行时可能无法稳定提供装饰器参数类型元数据，因此 Controller 参数必须显式传入 DTO 类。
 * 该 Pipe 与全局白名单、额外字段拒绝和类型转换规则保持一致，避免开发与生产校验行为分叉。
 *
 * @param expectedType 当前参数对应的 DTO 类
 * @returns 与全局规则一致的校验管道
 */
export const createDtoValidationPipe = (expectedType: Type<unknown>): ValidationPipe => {
  return new ValidationPipe({
    expectedType,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
};
