import { afterEach, describe, expect, it } from '@rstest/core';

import { getLocalStorage, removeLocalStorage, setLocalStorage } from './storage';

describe('localStorage 封装', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('对象写入后可原样读回', () => {
    setLocalStorage('shared:profile', { name: 'ly', roles: ['admin'] });

    expect(getLocalStorage<{ name: string; roles: string[] }>('shared:profile')).toEqual({
      name: 'ly',
      roles: ['admin'],
    });
  });

  it('字符串与数字按 JSON 语义读回', () => {
    setLocalStorage('shared:text', 'hello');
    setLocalStorage('shared:count', 7);

    expect(getLocalStorage<string>('shared:text')).toBe('hello');
    expect(getLocalStorage<number>('shared:count')).toBe(7);
  });

  it('key 不存在时返回 null', () => {
    expect(getLocalStorage('shared:missing')).toBeNull();
  });

  it('存储 null 值读取时返回 null', () => {
    setLocalStorage('shared:null', null);

    expect(getLocalStorage('shared:null')).toBeNull();
  });

  it('内容损坏时返回 null 而不抛错', () => {
    window.localStorage.setItem('shared:broken', '{invalid');

    expect(getLocalStorage('shared:broken')).toBeNull();
  });

  it('remove 后读取返回 null', () => {
    setLocalStorage('shared:temp', 1);
    removeLocalStorage('shared:temp');

    expect(getLocalStorage('shared:temp')).toBeNull();
  });
});
