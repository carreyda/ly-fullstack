/**
 * 深拷贝
 *
 * 支持：基本类型、数组、普通对象、Date、RegExp、Map、Set，以及循环引用。
 * 不可结构化克隆的值（函数、Symbol 等）按引用原样返回。
 *
 * @param value 待拷贝的值
 * @returns 拷贝后的新值
 */
export const cloneDeep = <T>(value: T): T => {
  return clone(value, new WeakMap());
};

/**
 * 内部递归实现，通过 seen 记录已拷贝对象以处理循环引用
 */
const clone = <T>(value: T, seen: WeakMap<object, unknown>): T => {
  // 基本类型与 null/undefined 直接返回
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // 命中循环引用，返回此前已创建的拷贝
  const existing = seen.get(value as object);
  if (existing !== undefined) {
    return existing as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  if (Array.isArray(value)) {
    const result: unknown[] = [];
    seen.set(value, result);
    value.forEach((item) => result.push(clone(item, seen)));
    return result as unknown as T;
  }

  if (value instanceof Map) {
    const result = new Map();
    seen.set(value, result);
    value.forEach((v, k) => result.set(clone(k, seen), clone(v, seen)));
    return result as unknown as T;
  }

  if (value instanceof Set) {
    const result = new Set();
    seen.set(value, result);
    value.forEach((v) => result.add(clone(v, seen)));
    return result as unknown as T;
  }

  const result: Record<string, unknown> = {};
  seen.set(value as object, result);
  Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
    result[k] = clone(v, seen);
  });
  return result as unknown as T;
};
