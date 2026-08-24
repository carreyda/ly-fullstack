import 'reflect-metadata';

import { describe, expect, it } from '@rstest/core';

import { HEALTH_SERVICE_NAME } from '../../constants';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('返回默认 C 端 API 的健康状态', () => {
    const result = new HealthController().getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe(HEALTH_SERVICE_NAME);
  });
});
