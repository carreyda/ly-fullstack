import { describe, expect, it } from '@rstest/core';

import { cloneDeep } from './clone';

describe('cloneDeep', () => {
  it('基本类型与 null/undefined 原样返回', () => {
    expect(cloneDeep(42)).toBe(42);
    expect(cloneDeep('ly')).toBe('ly');
    expect(cloneDeep(true)).toBe(true);
    expect(cloneDeep(null)).toBe(null);
    expect(cloneDeep(undefined)).toBe(undefined);
  });

  it('拷贝普通对象并解除引用', () => {
    const source = { id: 1 };
    const copied = cloneDeep(source);

    expect(copied).toEqual(source);
    expect(copied).not.toBe(source);

    copied.id = 99;
    expect(source.id).toBe(1);
  });

  it('深拷贝嵌套数组与对象', () => {
    const source = { list: [{ id: 1 }], meta: { depth: 2 } };
    const copied = cloneDeep(source);

    expect(copied).toEqual(source);
    expect(copied.list[0]).not.toBe(source.list[0]);

    copied.list[0].id = 99;
    expect(source.list[0].id).toBe(1);
  });

  it('拷贝 Date 并保持时间值', () => {
    const source = new Date('2026-01-01T00:00:00.000Z');
    const copied = cloneDeep(source);

    expect(copied).not.toBe(source);
    expect(copied.getTime()).toBe(source.getTime());
  });

  it('拷贝 RegExp 并保持 source 与 flags', () => {
    const source = /ly-\d+/gi;
    const copied = cloneDeep(source);

    expect(copied).not.toBe(source);
    expect(copied.source).toBe(source.source);
    expect(copied.flags).toBe(source.flags);
  });

  it('拷贝 Map：键值均为新引用，且与原 Map 互不影响', () => {
    const key = { id: 1 };
    const source = new Map<object, { count: number }>();
    source.set(key, { count: 2 });

    const copied = cloneDeep(source);

    expect(copied).not.toBe(source);
    expect(copied.size).toBe(1);

    const copiedKey = [...copied.keys()][0];
    const copiedValue = copied.get(copiedKey);
    expect(copiedKey).not.toBe(key);
    expect(copiedValue).toEqual({ count: 2 });
    expect(copiedValue).not.toBe(source.get(key));
    expect(copied.get(key)).toBeUndefined();
  });

  it('拷贝 Set 并解除对象成员的引用', () => {
    const member = { id: 1 };
    const source = new Set([1, 'ly', member]);
    const copied = cloneDeep(source);

    expect(copied).not.toBe(source);
    expect(copied.size).toBe(3);
    expect([...copied.values()].slice(0, 2)).toEqual([1, 'ly']);
    expect([...copied.values()][2]).toEqual(member);
    expect([...copied.values()][2]).not.toBe(member);
  });

  it('处理循环引用：自引用指向拷贝自身且不抛错', () => {
    interface CircularNode {
      name: string;
      self: CircularNode | null;
    }

    const source: CircularNode = { name: 'root', self: null };
    source.self = source;

    const copied = cloneDeep(source);

    expect(copied).not.toBe(source);
    expect(copied.self).toBe(copied);
    expect(copied.name).toBe('root');
  });

  it('函数与 Symbol 值按引用原样返回', () => {
    const handler = (): void => {};
    const tag = Symbol('tag');
    const source = { handler, tag };
    const copied = cloneDeep(source);

    expect(copied.handler).toBe(handler);
    expect(copied.tag).toBe(tag);
  });
});
