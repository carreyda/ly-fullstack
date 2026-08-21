<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="min(560px, calc(100vw - 32px))"
    modal-class="dialog-custom-common"
    header-class="dialog-custom-header"
    :align-center="true"
    :close-on-click-modal="false"
  >
    <div class="role-form-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="code">
          <el-input
            v-model="form.code"
            maxlength="50"
            :disabled="operationType === 'edit'"
            placeholder="例如 content_operator"
          />
          <p class="role-form-dialog__help">创建后不可修改，用于服务端稳定识别角色。</p>
        </el-form-item>

        <el-form-item label="角色说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="说明该角色负责的工作范围"
          />
        </el-form-item>

        <el-form-item label="角色状态">
          <div class="role-form-dialog__status">
            <el-switch v-model="form.isActive" />
            <span>{{ form.isActive ? '启用' : '停用' }}</span>
          </div>
          <p class="role-form-dialog__help">停用后，该角色不再参与用户登录和权限计算。</p>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="role-form-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useRoleForm } from './composables/use-role-form';

import type { AdminRoleListItem } from '@repo/shared/types';
import type { OperationType } from '@/types';

interface Emits {
  /**
   * 角色创建或编辑成功
   */
  success: [operationType: OperationType];
}

const emits = defineEmits<Emits>();
const {
  formRef,
  dialogVisible,
  dialogTitle,
  form,
  rules,
  operationType,
  submitting,
  open,
  handleCancel,
  handleSubmit,
} = useRoleForm({
  onSuccess: (type) => emits('success', type),
});

defineExpose({ open: (type: OperationType, role?: AdminRoleListItem) => open(type, role) });
</script>

<style lang="scss" src="./index.scss" scoped></style>
