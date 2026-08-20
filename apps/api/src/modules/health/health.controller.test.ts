import 'reflect-metadata';

import { describe, expect, it } from '@rstest/core';

import { SERVER_SERVICE_NAME } from '../../constants';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('返回 C 端 API 的服务状态', () => {
    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe(SERVER_SERVICE_NAME);
  });

  it('返回可被 Date.parse 解析的 ISO 时间', () => {
    const before = Date.now();
    const result = controller.getHealth();

    expect(Date.parse(result.timestamp)).not.toBeNaN();
    expect(Date.parse(result.timestamp)).toBeGreaterThanOrEqual(before);
  });
});
