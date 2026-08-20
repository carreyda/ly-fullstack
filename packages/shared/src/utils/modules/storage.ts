/**
 * 封装本地存储
 * @param key
 * @param value
 */
export const setLocalStorage = <T>(key: string, value: T): void => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

/**
 * 获取本地存储
 * @param key
 */
export const getLocalStorage = <T>(key: string): T | null => {
  const data = window.localStorage.getItem(key);
  if (!data || data === 'null') {
    return null;
  }
  try {
    const obj: T = JSON.parse(data);
    return obj;
  } catch {
    return null;
  }
};

/**
 * 移除本地存储
 * @param key
 */
export const removeLocalStorage = (key: string): void => {
  window.localStorage.removeItem(key);
};
