import type { FormInstance, FormRules } from 'element-plus';

import { resetAdminUserPassword } from '@/api';

import type { AdminUserListItem } from '@repo/shared/types';
import type { AdminUserPasswordFormModel } from '@/types';

/**
 * 管理用户密码重置弹框状态
 *
 * @returns 表单校验、目标用户和提交方法
 */
export const useUserPassword = () => {
  const formRef = useTemplateRef<FormInstance>('formRef');
  const dialogVisible = ref(false);
  const submitting = ref(false);
  const targetUser = shallowRef<AdminUserListItem>();
  const form = reactive<AdminUserPasswordFormModel>({
    password: '',
    confirmPassword: '',
  });

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

    if (value !== form.password) {
      callback(new Error('两次输入的密码不一致'));
      return;
    }

    callback();
  };

  const rules: FormRules<AdminUserPasswordFormModel> = {
    password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, max: 64, message: '密码长度需为 8 至 64 位', trigger: 'blur' },
    ],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
  };

  /**
   * 打开密码重置弹框并清空上次敏感输入
   *
   * @param user 目标用户列表记录
   */
  const open = (user: AdminUserListItem): void => {
    targetUser.value = user;
    form.password = '';
    form.confirmPassword = '';
    dialogVisible.value = true;

    nextTick(() => {
      formRef.value?.clearValidate();
    });
  };

  /**
   * 校验并提交新密码
   */
  const handleSubmit = async (): Promise<void> => {
    const user = targetUser.value;
    if (!user || submitting.value) {
      return;
    }

    const isValid = await formRef.value?.validate().catch(() => false);
    if (!isValid) {
      return;
    }

    submitting.value = true;
    try {
      await resetAdminUserPassword(user.id, { password: form.password });
      dialogVisible.value = false;
      form.password = '';
      form.confirmPassword = '';
      ElMessage.success('用户密码已重置');
    } catch {
      // 请求拦截器已经展示服务端错误，保留当前输入供管理员修正后重试。
    } finally {
      submitting.value = false;
    }
  };

  const handleCancel = (): void => {
    if (!submitting.value) {
      form.password = '';
      form.confirmPassword = '';
      dialogVisible.value = false;
    }
  };

  return {
    formRef,
    dialogVisible,
    submitting,
    targetUser,
    form,
    rules,
    open,
    handleCancel,
    handleSubmit,
  };
};
