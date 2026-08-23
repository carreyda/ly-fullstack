import { describe, expect, it } from '@rstest/core';

import { formatAdminDateTime } from './date';

describe('formatAdminDateTime', () => {
  it('把无时区日期时间格式化为统一后台格式', () => {
    expect(formatAdminDateTime('2026-08-23T10:20:30')).toBe('2026-08-23 10:20:30');
  });

  it('空值与非法日期统一返回短横线', () => {
    expect(formatAdminDateTime(null)).toBe('-');
    expect(formatAdminDateTime(undefined)).toBe('-');
    expect(formatAdminDateTime('')).toBe('-');
    expect(formatAdminDateTime('not-a-date')).toBe('-');
  });
});
