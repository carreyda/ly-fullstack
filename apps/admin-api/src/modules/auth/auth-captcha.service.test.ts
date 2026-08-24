import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import type { AdminCaptchaRecord } from '../../types';
import { AuthCaptchaService } from './auth-captcha.service';

/**
 * 读取测试实例内的挑战记录
 *
 * 生产代码不暴露正确位置，单元测试只通过类型收窄读取私有 Map，用于验证
 * 正确偏移和一次性消费语义。
 *
 * @param service 当前验证码服务实例
 * @returns 服务端内部挑战记录
 */
const getCaptchaRecords = (service: AuthCaptchaService): Map<string, AdminCaptchaRecord> => {
  return (service as unknown as { captchaRecords: Map<string, AdminCaptchaRecord> }).captchaRecords;
};

describe('AuthCaptchaService', () => {
  it('创建的挑战只下发 PNG 像素图而不暴露正确偏移', async () => {
    const service = new AuthCaptchaService();
    const challenge = await service.createCaptcha();

    expect(challenge.backgroundImage.startsWith('data:image/png;base64,')).toBe(true);
    expect(challenge.puzzleImage.startsWith('data:image/png;base64,')).toBe(true);
    expect(challenge).not.toHaveProperty('offset');
    expect(getCaptchaRecords(service).has(challenge.captchaId)).toBe(true);
  });

  it('正确位置通过后生成只能被登录消费一次的凭证', async () => {
    const service = new AuthCaptchaService();
    const challenge = await service.createCaptcha();
    const offset = getCaptchaRecords(service).get(challenge.captchaId)?.offset;

    expect(offset).toBeTypeOf('number');
    service.verifyCaptcha(challenge.captchaId, offset ?? -1);
    expect(() => service.consumeVerifiedCaptcha(challenge.captchaId)).not.toThrow();
    expect(() => service.consumeVerifiedCaptcha(challenge.captchaId)).toThrow(BadRequestException);
  });

  it('位置错误后立即作废原挑战', async () => {
    const service = new AuthCaptchaService();
    const challenge = await service.createCaptcha();
    const offset = getCaptchaRecords(service).get(challenge.captchaId)?.offset ?? 0;

    expect(() => service.verifyCaptcha(challenge.captchaId, offset + 20)).toThrow(BadRequestException);
    expect(() => service.verifyCaptcha(challenge.captchaId, offset)).toThrow(BadRequestException);
  });
});
