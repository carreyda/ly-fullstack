import type { FormInstance, FormRules } from 'element-plus';
import type {
  AdminDictionaryListItem,
  CreateAdminDictionaryParams,
  UpdateAdminDictionaryParams,
} from '@repo/shared/types';

import { createAdminDictionary, updateAdminDictionary } from '@/api';
import { ADMIN_DICTIONARY_FORM_MODEL } from '@/constants';

import type { AdminDictionaryFormModel, OperationType, UseDictionaryFormOptions } from '@/types';

const DICTIONARY_FORM_RULES: FormRules<AdminDictionaryFormModel> = {
  name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入字典编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '只能使用小写字母、数字和下划线，并以字母开头',
      trigger: 'blur',
    },
  ],
};

/**
 * 字典新增与编辑弹框状态
 *
 * @param options 保存成功后的页面回调
 * @returns 字典表单状态和操作方法
 */
export const useDictionaryForm = (options: UseDictionaryFormOptions) => {
  const formRef = useTemplateRef<FormInstance>('formRef');
  const dialogVisible = ref(false);
  const submitting = ref(false);
  const operationType = ref<OperationType>('add');
  const dictionaryId = ref<number>();
  const form = reactive<AdminDictionaryFormModel>(structuredClone(ADMIN_DICTIONARY_FORM_MODEL));
  const dialogTitle = computed(() => (operationType.value === 'add' ? '新增字典' : '编辑字典'));

  const open = (type: OperationType, dictionary?: AdminDictionaryListItem): void => {
    operationType.value = type;
    dictionaryId.value = dictionary?.id;
    Object.assign(
      form,
      dictionary
        ? {
            code: dictionary.code,
            name: dictionary.name,
            description: dictionary.description ?? '',
            isActive: dictionary.isActive,
          }
        : structuredClone(ADMIN_DICTIONARY_FORM_MODEL),
    );
    dialogVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  };

  const handleSubmit = async (): Promise<void> => {
    if (submitting.value || !(await formRef.value?.validate().catch(() => false))) {
      return;
    }
    submitting.value = true;
    try {
      if (operationType.value === 'add') {
        const params: CreateAdminDictionaryParams = {
          code: form.code,
          name: form.name,
          description: form.description || null,
          isActive: form.isActive,
        };
        await createAdminDictionary(params);
      } else if (dictionaryId.value) {
        const params: UpdateAdminDictionaryParams = {
          name: form.name,
          description: form.description || null,
          isActive: form.isActive,
        };
        await updateAdminDictionary(dictionaryId.value, params);
      }
      dialogVisible.value = false;
      ElMessage.success(operationType.value === 'add' ? '字典已创建' : '字典已更新');
      options.onSuccess(operationType.value);
    } catch {
      // 请求拦截器已经展示错误，保留输入供管理员修正。
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
    rules: DICTIONARY_FORM_RULES,
    dialogTitle,
    open,
    handleSubmit,
  };
};
