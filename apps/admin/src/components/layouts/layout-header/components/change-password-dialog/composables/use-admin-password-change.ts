import Cookies from 'js-cookie';

import { changeAdminPassword } from '@/api';
import { COOKIE_ADMIN_CREDENTIALS_KEY } from '@/constants';

import type { FormInstance, FormRules } from 'element-plus';
import type { AdminPasswordChangeFormModel, UseAdminPasswordChangeOptions } from '@/types';

/**
 * 管理当前管理员修改密码弹框的敏感输入、校验和提交
 *
 * 提交成功后删除登录页记住的旧账号密码 Cookie，避免重新登录时自动回填已经失效的密码。会话清理和路由跳转
 * 由顶栏组件通过 `onSuccess` 处理，Composable 不直接依赖 Router 或 Auth Store。
 *
 * @param options 密码修改成功后的调用方回调
 * @returns 弹框状态、表单状态和交互方法
 */
export const useAdminPasswordChange = (options: UseAdminPasswordChangeOptions) => {
  const formRef = useTemplateRef<FormInstance>('formRef');
  const dialogVisible = ref(false);
  const submitting = ref(false);
  const form = reactive<AdminPasswordChangeFormModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /**
   * 新密码不能与当前密码相同
   *
   * @param _rule Element Plus 当前校验规则
   * @param value 新密码输入值
   * @param callback 校验结果回调
   */
  const validateNewPassword = (_rule: unknown, value: string, callback: (error?: Error) => void): void => {
    if (!value) {
      callback(new Error('请输入新密码'));
      return;
    }

    if (value.length < 8 || value.length > 72) {
      callback(new Error('密码长度需为 8 至 72 位'));
      return;
    }

    if (value === form.currentPassword) {
      callback(new Error('新密码不能与当前密码相同'));
      return;
    }

    callback();
  };

  /**
   * 确认密码必须与新密码保持一致
   *
   * @param _rule Element Plus 当前校验规则
   * @param value 确认密码输入值
   * @param callback 校验结果回调
   */
  const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void): void => {
    if (!value) {
      callback(new Error('请再次输入新密码'));
      return;
    }

    if (value !== form.newPassword) {
      callback(new Error('两次输入的新密码不一致'));
      return;
    }

    callback();
  };

  /**
   * 与服务端 DTO 保持一致的修改密码校验规则
   */
  const rules: FormRules<AdminPasswordChangeFormModel> = {
    currentPassword: [
      { required: true, message: '请输入当前密码', trigger: 'blur' },
      { min: 8, max: 72, message: '密码长度需为 8 至 72 位', trigger: 'blur' },
    ],
    newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
  };

  /**
   * 清除弹框中的全部密码输入和历史校验结果
   */
  const resetForm = (): void => {
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    nextTick(() => formRef.value?.clearValidate());
  };

  /**
   * 打开修改密码弹框
   */
  const open = (): void => {
    resetForm();
    dialogVisible.value = true;
  };

  /**
   * 校验当前输入并提交修改密码请求
   */
  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value || submitting.value) {
      return;
    }

    const isValid = await formRef.value.validate().catch(() => false);
    if (!isValid) {
      return;
    }

    submitting.value = true;
    try {
      await changeAdminPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      Cookies.remove(COOKIE_ADMIN_CREDENTIALS_KEY, { path: '/' });
      dialogVisible.value = false;
      resetForm();
      options.onSuccess();
    } catch {
      /**
       * Axios 响应拦截器已经展示服务端错误，保留当前输入供用户修正后重试。
       */
    } finally {
      submitting.value = false;
    }
  };

  /**
   * 取消修改并清理当前敏感输入
   */
  const handleCancel = (): void => {
    if (submitting.value) {
      return;
    }

    dialogVisible.value = false;
    resetForm();
  };

  return {
    formRef,
    dialogVisible,
    submitting,
    form,
    rules,
    open,
    handleSubmit,
    handleCancel,
  };
};
