import { describe, expect, it } from '@rstest/core';

import { getUrlQueryValue, isJSONString, trimString } from './base';

describe('isJSONString', () => {
  it('对象与数组 JSON 文本返回 true', () => {
    expect(isJSONString('{"name":"ly"}')).toBe(true);
    expect(isJSONString('[1,2,3]')).toBe(true);
  });

  it('数字、布尔与 null 字面量属于合法 JSON', () => {
    expect(isJSONString('123')).toBe(true);
    expect(isJSONString('true')).toBe(true);
    expect(isJSONString('null')).toBe(true);
  });

  it('普通文本、空字符串与残缺结构返回 false', () => {
    expect(isJSONString('hello')).toBe(false);
    expect(isJSONString('')).toBe(false);
    expect(isJSONString('{name: "ly"}')).toBe(false);
  });
});

describe('trimString', () => {
  it('去除首尾的空格、制表符与换行', () => {
    expect(trimString('  ly  ')).toBe('ly');
    expect(trimString('\t ly \n')).toBe('ly');
  });

  it('保留字符串中间的空白', () => {
    expect(trimString('ly full stack')).toBe('ly full stack');
  });

  it('无首尾空白与全空白字符串', () => {
    expect(trimString('ly')).toBe('ly');
    expect(trimString('   ')).toBe('');
  });
});

describe('getUrlQueryValue', () => {
  it('从显式传入的查询串取值', () => {
    expect(getUrlQueryValue('tab', '?tab=dashboard&size=20')).toBe('dashboard');
  });

  it('参数不存在时返回空字符串', () => {
    expect(getUrlQueryValue('missing', '?tab=dashboard')).toBe('');
  });

  it('未传查询串时读取当前页面 search', () => {
    window.location.href = 'http://localhost/admin?keyword=ly';
    expect(getUrlQueryValue('keyword')).toBe('ly');
  });

  it('search 为空时回退读取 hash 中的查询参数', () => {
    window.location.href = 'http://localhost/admin#/dashboard?tab=workbench';
    expect(getUrlQueryValue('tab')).toBe('workbench');
  });
});
