/**
 * 显示统一样式的成功提示
 *
 * 相同内容会由 Element Plus 合并展示，并通过 `app-message-success` 使用 admin 的成功态覆盖样式。
 *
 * @param message 展示给用户的成功反馈文案
 */
export const showSuccessMessage = (message: string): void => {
  ElMessage({
    grouping: true,
    message: message,
    type: 'success',
    customClass: 'app-message-success',
    plain: true,
  });
};

/**
 * 显示统一样式的错误提示
 *
 * 相同内容会由 Element Plus 合并展示，并通过 `app-message-error` 使用 admin 的错误态覆盖样式。
 *
 * @param message 展示给用户的错误反馈文案
 */
export const showErrorMessage = (message: string): void => {
  ElMessage({
    grouping: true,
    message: message,
    customClass: 'app-message-error',
    type: 'error',
    plain: true,
  });
};

/**
 * 显示统一样式的警告提示
 *
 * 相同内容会由 Element Plus 合并展示，并通过 `app-message-warning` 使用 admin 的警告态覆盖样式。
 *
 * @param message 展示给用户的警告反馈文案
 */
export const showWarningMessage = (message: string): void => {
  ElMessage({
    grouping: true,
    message: message,
    type: 'warning',
    customClass: 'app-message-warning',
    plain: true,
  });
};
