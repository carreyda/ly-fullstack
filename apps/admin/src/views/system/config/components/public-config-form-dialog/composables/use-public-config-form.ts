import type { FormInstance, FormRules } from 'element-plus';
import type {
  AdminPublicConfigListItem,
  CreateAdminPublicConfigParams,
  UpdateAdminPublicConfigParams,
} from '@repo/shared/types';

import { createAdminPublicConfig, updateAdminPublicConfig } from '@/api';
import { ADMIN_PUBLIC_CONFIG_FORM_MODEL } from '@/constants';

import type { AdminPublicConfigFormModel, OperationType, UsePublicConfigFormOptions } from '@/types';

const PUBLIC_CONFIG_FORM_RULES: FormRules<AdminPublicConfigFormModel> = {
  key: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_.-]*$/,
      message: '只能使用小写字母、数字、点、短横线和下划线，并以字母开头',
      trigger: 'blur',
    },
  ],
  value: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
};

/**
 * 公共配置新增与编辑弹框状态
 */
export const usePublicConfigForm = (options: UsePublicConfigFormOptions) => {
  const formRef = useTemplateRef<FormInstance>('formRef');
  const dialogVisible = ref(false);
  const submitting = ref(false);
  const operationType = ref<OperationType>('add');
  const configId = ref<number>();
  const form = reactive<AdminPublicConfigFormModel>(structuredClone(ADMIN_PUBLIC_CONFIG_FORM_MODEL));
  const dialogTitle = computed(() => (operationType.value === 'add' ? '新增公共配置' : '编辑公共配置'));

  const open = (type: OperationType, config?: AdminPublicConfigListItem): void => {
    operationType.value = type;
    configId.value = config?.id;
    Object.assign(
      form,
      config
        ? { key: config.key, value: config.value, description: config.description ?? '' }
        : structuredClone(ADMIN_PUBLIC_CONFIG_FORM_MODEL),
    );
    dialogVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  };

  const handleSubmit = async (): Promise<void> => {
    if (submitting.value || !(await formRef.value?.validate().catch(() => false))) return;
    submitting.value = true;
    try {
      if (operationType.value === 'add') {
        const params: CreateAdminPublicConfigParams = {
          key: form.key,
          value: form.value,
          description: form.description || null,
        };
        await createAdminPublicConfig(params);
      } else if (configId.value) {
        const params: UpdateAdminPublicConfigParams = {
          value: form.value,
          description: form.description || null,
        };
        await updateAdminPublicConfig(configId.value, params);
      }
      dialogVisible.value = false;
      ElMessage.success(operationType.value === 'add' ? '公共配置已创建' : '公共配置已更新');
      options.onSuccess(operationType.value);
    } catch {
      // 请求拦截器已经展示服务端错误。
    } finally {
      submitting.value = false;
    }
  };

  return {
    formRef,
    dialogVisible,
    submitting,
    operationType,
    form,
    rules: PUBLIC_CONFIG_FORM_RULES,
    dialogTitle,
    open,
    handleSubmit,
  };
};
