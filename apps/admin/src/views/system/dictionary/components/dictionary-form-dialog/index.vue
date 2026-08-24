<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="min(560px, calc(100vw - 32px))"
    modal-class="dialog-custom-common"
    header-class="dialog-custom-header"
    align-center
    :close-on-click-modal="false"
  >
    <div class="dictionary-form-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="例如 用户性别" />
        </el-form-item>
        <el-form-item label="字典编码" prop="code">
          <el-input
            v-model="form.code"
            maxlength="50"
            :disabled="operationType === 'edit'"
            placeholder="例如 user_gender"
          />
          <p class="dictionary-form-dialog__help">创建后不可修改，公共 API 使用该编码读取字典。</p>
        </el-form-item>
        <el-form-item label="字典说明">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="字典状态">
          <div class="dictionary-form-dialog__status">
            <el-switch v-model="form.isActive" />
            <span>{{ form.isActive ? '启用' : '停用' }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dictionary-form-dialog__footer">
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useDictionaryForm } from './composables/use-dictionary-form';

import type { AdminDictionaryListItem } from '@repo/shared/types';
import type { OperationType } from '@/types';

const emits = defineEmits<{ success: [operationType: OperationType] }>();
const { formRef, dialogVisible, submitting, operationType, form, rules, dialogTitle, open, handleSubmit } =
  useDictionaryForm({ onSuccess: (type) => emits('success', type) });

defineExpose({ open: (type: OperationType, dictionary?: AdminDictionaryListItem) => open(type, dictionary) });
</script>

<style lang="scss" scoped>
.dictionary-form-dialog {
  padding: var(--spacing-xl);

  &__help {
    width: 100%;
    margin-top: 6px;
    color: var(--color-text-tertiary);
    font-size: 12px;
    line-height: 18px;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text-secondary);
  }

  &__footer {
    display: flex;
    min-height: 64px;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-xl);
    border-top: 1px solid var(--border-color);
  }
}
</style>
