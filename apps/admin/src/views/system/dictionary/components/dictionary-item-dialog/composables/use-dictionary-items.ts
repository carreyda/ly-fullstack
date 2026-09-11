import type { FormInstance, FormRules } from 'element-plus';
import type {
  AdminDictionaryItemListItem,
  AdminDictionaryListItem,
  UpdateAdminDictionaryItemParams,
} from '@repo/shared/types';

import {
  createAdminDictionaryItem,
  deleteAdminDictionaryItem,
  fetchAdminDictionaryItems,
  updateAdminDictionaryItem,
} from '@/api';
import { ADMIN_DICTIONARY_ITEM_FILTER_MODEL, ADMIN_DICTIONARY_ITEM_FORM_MODEL } from '@/constants';

import type { AdminDictionaryItemFilterModel, AdminDictionaryItemFormModel, OperationType } from '@/types';

const ITEM_FORM_RULES: FormRules<AdminDictionaryItemFormModel> = {
  label: [{ required: true, message: '请输入展示文本', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
};

/**
 * 字典项弹框的分页、表单与删除流程
 */
export const useDictionaryItems = () => {
  const dialogVisible = ref(false);
  const formDialogVisible = ref(false);
  const loading = ref(false);
  const loadFailed = ref(false);
  const submitting = ref(false);
  const deletingId = ref<number>();
  const changed = ref(false);
  const dictionary = ref<AdminDictionaryListItem>();
  const itemList = ref<AdminDictionaryItemListItem[]>([]);
  const total = ref(0);
  const filters = reactive<AdminDictionaryItemFilterModel>(structuredClone(ADMIN_DICTIONARY_ITEM_FILTER_MODEL));
  const operationType = ref<OperationType>('add');
  const editingItemId = ref<number>();
  const formRef = useTemplateRef<FormInstance>('formRef');
  const form = reactive<AdminDictionaryItemFormModel>(structuredClone(ADMIN_DICTIONARY_ITEM_FORM_MODEL));
  let requestVersion = 0;

  /**
   * 按当前字典和筛选条件加载字典项
   *
   * 请求版本号保证快速切换字典、关闭弹框或页面卸载后，旧响应不会覆盖当前弹框状态。
   */
  const loadItems = async (): Promise<void> => {
    if (!dictionary.value) return;
    const version = ++requestVersion;
    const dictionaryId = dictionary.value.id;
    loading.value = true;
    loadFailed.value = false;
    try {
      const result = await fetchAdminDictionaryItems(dictionaryId, filters);
      if (version !== requestVersion) {
        return;
      }

      itemList.value = result.list;
      total.value = result.total;
    } catch {
      // 请求拦截器已经展示服务端错误，弹框保留上一次成功数据供用户重试。
      if (version === requestVersion) {
        loadFailed.value = true;
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false;
      }
    }
  };

  const open = (record: AdminDictionaryListItem): void => {
    dictionary.value = record;
    changed.value = false;
    Object.assign(filters, structuredClone(ADMIN_DICTIONARY_ITEM_FILTER_MODEL));
    dialogVisible.value = true;
    void loadItems();
  };

  const openForm = (type: OperationType, item?: AdminDictionaryItemListItem): void => {
    operationType.value = type;
    editingItemId.value = item?.id;
    Object.assign(
      form,
      item
        ? {
            label: item.label,
            value: item.value,
            description: item.description ?? '',
            sortOrder: item.sortOrder,
            isActive: item.isActive,
          }
        : structuredClone(ADMIN_DICTIONARY_ITEM_FORM_MODEL),
    );
    formDialogVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  };

  const handleSubmit = async (): Promise<void> => {
    if (!dictionary.value || submitting.value || !(await formRef.value?.validate().catch(() => false))) return;
    submitting.value = true;
    try {
      const params: UpdateAdminDictionaryItemParams = {
        label: form.label,
        value: form.value,
        description: form.description || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (operationType.value === 'add') {
        await createAdminDictionaryItem(dictionary.value.id, params);
      } else if (editingItemId.value) {
        await updateAdminDictionaryItem(dictionary.value.id, editingItemId.value, params);
      }
      formDialogVisible.value = false;
      changed.value = true;
      ElMessage.success(operationType.value === 'add' ? '字典项已创建' : '字典项已更新');
      await loadItems();
    } catch {
      // 请求拦截器已经展示服务端错误。
    } finally {
      submitting.value = false;
    }
  };

  const handleDelete = async (item: AdminDictionaryItemListItem): Promise<void> => {
    if (!dictionary.value || deletingId.value) return;
    try {
      await ElMessageBox.confirm(`确定删除字典项“${item.label}”吗？`, '删除字典项', { type: 'warning' });
    } catch {
      return;
    }
    deletingId.value = item.id;
    try {
      await deleteAdminDictionaryItem(dictionary.value.id, item.id);
      changed.value = true;
      ElMessage.success('字典项已删除');
      if (itemList.value.length === 1 && filters.pageNum > 1) filters.pageNum -= 1;
      await loadItems();
    } catch {
      // 请求拦截器已经展示服务端错误，删除失败时保留当前列表与页码。
    } finally {
      deletingId.value = undefined;
    }
  };

  /**
   * 切换字典项页码并加载目标页
   *
   * @param pageNum 新页码
   */
  const handlePageNumChange = async (pageNum: number): Promise<void> => {
    filters.pageNum = pageNum;
    await loadItems();
  };

  /**
   * 关闭字典项弹框并使仍在途中的列表请求失效
   */
  const handleClosed = (): void => {
    requestVersion += 1;
    loading.value = false;
  };

  onBeforeUnmount(() => {
    requestVersion += 1;
  });

  return {
    dialogVisible,
    formDialogVisible,
    loading,
    loadFailed,
    submitting,
    deletingId,
    changed,
    dictionary,
    itemList,
    total,
    filters,
    operationType,
    formRef,
    form,
    rules: ITEM_FORM_RULES,
    open,
    openForm,
    loadItems,
    handlePageNumChange,
    handleSubmit,
    handleDelete,
    handleClosed,
  };
};
