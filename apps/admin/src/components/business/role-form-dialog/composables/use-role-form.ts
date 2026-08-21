import type { FormInstance, FormRules } from 'element-plus';
import type { AdminRoleListItem, CreateAdminRoleParams, UpdateAdminRoleParams } from '@repo/shared/types';

import { createAdminRole, updateAdminRole } from '@/api';
import { ADMIN_ROLE_FORM_MODEL } from '@/constants';

import type { AdminRoleFormModel, OperationType } from '@/types';

interface UseRoleFormOptions {
  /**
   * 角色保存成功后的页面回调
   */
  onSuccess: (operationType: OperationType) => void;
}

/**
 * 角色名称、编码和说明的表单校验规则
 */
const ROLE_FORM_RULES: FormRules<AdminRoleFormModel> = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 50, message: '角色名称不能超过 50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '角色编码只能使用小写字母、数字和下划线，并以字母开头',
      trigger: 'blur',
    },
  ],
  description: [{ max: 200, message: '角色说明不能超过 200 个字符', trigger: 'blur' }],
};

/**
 * 管理角色新增与编辑弹框状态
 *
 * @param options 保存成功后的页面通知
 * @returns 表单渲染、校验和提交需要的状态与方法
 */
export const useRoleForm = (options: UseRoleFormOptions) => {
  const formRef = useTemplateRef<FormInstance>('formRef');
  const dialogVisible = ref(false);
  const submitting = ref(false);
  const operationType = ref<OperationType>('add');
  const roleId = ref<number>();
  const form = reactive<AdminRoleFormModel>(structuredClone(ADMIN_ROLE_FORM_MODEL));

  /**
   * 当前弹框标题
   */
  const dialogTitle = computed(() => (operationType.value === 'add' ? '新增角色' : '编辑角色'));

  /**
   * 使用默认值或目标角色重新初始化表单
   *
   * @param type 新增或编辑操作
   * @param role 编辑时使用的角色列表记录
   */
  const open = (type: OperationType, role?: AdminRoleListItem): void => {
    operationType.value = type;
    roleId.value = role?.id;
    Object.assign(
      form,
      role
        ? {
            name: role.name,
            code: role.code,
            description: role.description ?? '',
            isActive: role.isActive,
          }
        : structuredClone(ADMIN_ROLE_FORM_MODEL),
    );
    dialogVisible.value = true;

    nextTick(() => {
      formRef.value?.clearValidate();
    });
  };

  /**
   * 校验并提交角色基础信息
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
        const params: CreateAdminRoleParams = {
          name: form.name,
          code: form.code,
          description: form.description || null,
          isActive: form.isActive,
        };
        await createAdminRole(params);
      } else if (roleId.value) {
        const params: UpdateAdminRoleParams = {
          name: form.name,
          description: form.description || null,
          isActive: form.isActive,
        };
        await updateAdminRole(roleId.value, params);
      }

      dialogVisible.value = false;
      ElMessage.success(operationType.value === 'add' ? '角色已创建' : '角色已更新');
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
    rules: ROLE_FORM_RULES,
    operationType,
    submitting,
    open,
    handleCancel,
    handleSubmit,
  };
};
