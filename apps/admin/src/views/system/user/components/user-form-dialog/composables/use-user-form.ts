import type { FormInstance, FormRules } from 'element-plus';
import type { AdminUserListItem, CreateAdminUserParams, UpdateAdminUserParams } from '@repo/shared/types';

import { createAdminUser, updateAdminUser } from '@/api';
import { ADMIN_USER_FORM_MODEL } from '@/constants';

import type { AdminUserFormModel, OperationType, UseUserFormOptions } from '@/types';

/**
 * 用户登录名、密码和显示名称的表单校验规则
 */
const USER_FORM_RULES: FormRules<AdminUserFormModel> = {
  username: [
    { required: true, message: '请输入登录名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,49}$/,
      message: '登录名需以字母开头，只能使用字母、数字和下划线，长度 3 至 50 位',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度需为 8 至 64 位', trigger: 'blur' },
  ],
  displayName: [{ max: 50, message: '显示名称不能超过 50 个字符', trigger: 'blur' }],
};

/**
 * 管理用户新增与编辑弹框状态
 *
 * @param options 保存成功后的页面通知
 * @returns 表单渲染、校验和提交需要的状态与方法
 */
export const useUserForm = (options: UseUserFormOptions) => {
  const formRef = useTemplateRef<FormInstance>('formRef');
  const dialogVisible = ref(false);
  const submitting = ref(false);
  const operationType = ref<OperationType>('add');
  const userId = ref<number>();
  const isSystemUser = ref(false);
  const form = reactive<AdminUserFormModel>(structuredClone(ADMIN_USER_FORM_MODEL));

  /**
   * 当前弹框标题
   */
  const dialogTitle = computed(() => (operationType.value === 'add' ? '新增用户' : '编辑用户'));

  /**
   * 使用默认值或目标用户重新初始化表单
   *
   * @param type 新增或编辑操作
   * @param user 编辑时使用的用户列表记录
   */
  const open = (type: OperationType, user?: AdminUserListItem): void => {
    operationType.value = type;
    userId.value = user?.id;
    isSystemUser.value = user?.isSystem ?? false;
    Object.assign(
      form,
      user
        ? {
            username: user.username,
            password: '',
            displayName: user.displayName ?? '',
            isActive: user.isActive,
          }
        : structuredClone(ADMIN_USER_FORM_MODEL),
    );
    dialogVisible.value = true;

    nextTick(() => {
      formRef.value?.clearValidate();
    });
  };

  /**
   * 校验并提交用户基础信息
   */
  const handleSubmit = async (): Promise<void> => {
    if (submitting.value) {
      return;
    }

    const isValid = await formRef.value?.validate().catch(() => false);
    if (!isValid) {
      return;
    }

    submitting.value = true;
    try {
      if (operationType.value === 'add') {
        const params: CreateAdminUserParams = {
          username: form.username,
          password: form.password,
          displayName: form.displayName || null,
          isActive: form.isActive,
        };
        await createAdminUser(params);
      } else if (userId.value) {
        const params: UpdateAdminUserParams = {
          displayName: form.displayName || null,
          isActive: form.isActive,
        };
        await updateAdminUser(userId.value, params);
      }

      dialogVisible.value = false;
      ElMessage.success(operationType.value === 'add' ? '用户已创建，请继续分配角色' : '用户已更新');
      options.onSuccess(operationType.value);
    } catch {
      // 请求拦截器已经展示服务端错误，保留当前输入供管理员修正后重试。
    } finally {
      submitting.value = false;
    }
  };

  const handleCancel = (): void => {
    if (!submitting.value) {
      dialogVisible.value = false;
    }
  };

  return {
    formRef,
    dialogVisible,
    dialogTitle,
    form,
    rules: USER_FORM_RULES,
    operationType,
    isSystemUser,
    submitting,
    open,
    handleCancel,
    handleSubmit,
  };
};
