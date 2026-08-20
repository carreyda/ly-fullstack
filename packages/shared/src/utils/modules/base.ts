/**
 * 判断是不是 JSON 字符串
 * @param content
 * @returns
 */
export const isJSONString = (content: string): boolean => {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

/**
 * 去除首尾空格
 * @param str
 */
export const trimString = (str: string): string => {
  return str.replace(/(^\s*)|(\s*$)/g, '');
};

/**
 * 获取 URL 查询参数
 * @param name 参数名
 * @param search 查询字符串，未传时优先读取当前页面 search，并兼容 hash 查询参数
 */
export const getUrlQueryValue = (name: string, search?: string): string => {
  const hash = window.location.hash;
  const currentSearch = window.location.search || (hash.includes('?') ? hash.slice(hash.indexOf('?')) : '');
  return new URLSearchParams(search ?? currentSearch).get(name) || '';
};
