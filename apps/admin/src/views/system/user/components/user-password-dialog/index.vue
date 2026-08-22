<template>
  <el-dialog
    v-model="dialogVisible"
    title="重置密码"
    width="min(520px, calc(100vw - 32px))"
    modal-class="dialog-custom-common"
    header-class="dialog-custom-header"
    :align-center="true"
    :close-on-click-modal="false"
  >
    <div class="user-password-dialog">
      <p class="user-password-dialog__notice">
        正在重置 <strong>{{ targetUser?.displayName || targetUser?.username }}</strong> 的登录密码。
      </p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            maxlength="64"
            show-password
            placeholder="请输入 8 至 64 位新密码"
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            maxlength="64"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="user-password-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认重置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useUserPassword } from './composables/use-user-password';

import type { AdminUserListItem } from '@repo/shared/types';

const { formRef, dialogVisible, submitting, targetUser, form, rules, open, handleCancel, handleSubmit } =
  useUserPassword();

defineExpose({ open: (user: AdminUserListItem) => open(user) });
</script>

<style lang="scss" src="./index.scss" scoped></style>
