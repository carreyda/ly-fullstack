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
    <div class="user-form-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="登录名" prop="username">
          <el-input
            v-model="form.username"
            maxlength="50"
            :disabled="operationType === 'edit'"
            placeholder="请输入登录名"
          />
          <p class="user-form-dialog__help">创建后不可修改，只允许字母、数字和下划线。</p>
        </el-form-item>

        <el-form-item v-if="operationType === 'add'" label="初始密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            maxlength="64"
            show-password
            placeholder="请输入 8 至 64 位初始密码"
          />
        </el-form-item>

        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="form.displayName" maxlength="50" show-word-limit placeholder="请输入显示名称" />
        </el-form-item>

        <el-form-item label="用户状态">
          <div class="user-form-dialog__status">
            <el-switch v-model="form.isActive" :disabled="isSystemUser" />
            <span>{{ form.isActive ? '启用' : '停用' }}</span>
          </div>
          <p class="user-form-dialog__help">
            {{ isSystemUser ? '系统超级管理员必须保持启用。' : '停用后，该用户不能继续登录管理后台。' }}
          </p>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="user-form-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useUserForm } from './composables/use-user-form';

import type { AdminUserListItem } from '@repo/shared/types';
import type { OperationType } from '@/types';

interface Emits {
  /**
   * 用户创建或编辑成功
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
  isSystemUser,
  submitting,
  open,
  handleCancel,
  handleSubmit,
} = useUserForm({
  onSuccess: (type) => emits('success', type),
});

defineExpose({ open: (type: OperationType, user?: AdminUserListItem) => open(type, user) });
</script>

<style lang="scss" src="./index.scss" scoped></style>
