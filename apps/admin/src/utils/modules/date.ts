const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * 把 ISO 时间转换为当前浏览器时区下的后台日期时间
 *
 * @param value 服务端返回的 ISO 日期时间
 * @returns `YYYY-MM-DD HH:mm:ss` 形式的本地时间；无效值返回短横线
 */
export const formatAdminDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return dateTimeFormatter.format(date).replaceAll('/', '-');
};
