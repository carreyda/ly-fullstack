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
    <div class="public-config-form-dialog">
      <el-alert
        class="public-config-form-dialog__alert"
        title="这里的值可被未登录 C 端公开读取，禁止保存密码、Token、密钥或内部连接信息。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="配置键" prop="key">
          <el-input
            v-model="form.key"
            maxlength="100"
            show-word-limit
            :disabled="operationType === 'edit'"
            placeholder="例如 site.support_email"
          />
        </el-form-item>
        <el-form-item label="配置值" prop="value">
          <el-input v-model="form.value" type="textarea" :rows="4" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="配置说明">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="public-config-form-dialog__footer">
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { usePublicConfigForm } from './composables/use-public-config-form';

import type { AdminPublicConfigListItem } from '@repo/shared/types';
import type { OperationType } from '@/types';

const emits = defineEmits<{ success: [operationType: OperationType] }>();
const { formRef, dialogVisible, submitting, operationType, form, rules, dialogTitle, open, handleSubmit } =
  usePublicConfigForm({ onSuccess: (type) => emits('success', type) });

defineExpose({ open: (type: OperationType, config?: AdminPublicConfigListItem) => open(type, config) });
</script>

<style lang="scss" scoped>
.public-config-form-dialog {
  padding: var(--spacing-xl);

  &__alert {
    margin-bottom: var(--spacing-lg);
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
