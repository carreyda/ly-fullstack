<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    width="min(520px, calc(100vw - 32px))"
    modal-class="dialog-custom-common"
    header-class="dialog-custom-header"
    :align-center="true"
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    @closed="handleCancel"
  >
    <div class="change-password-dialog">
      <p class="change-password-dialog__notice">修改成功后当前登录状态会退出，请使用新密码重新登录。</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="form.currentPassword"
            type="password"
            autocomplete="current-password"
            maxlength="72"
            show-password
            placeholder="请输入当前登录密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            autocomplete="new-password"
            maxlength="72"
            show-password
            placeholder="请输入 8 至 72 位新密码"
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            maxlength="72"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="change-password-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认修改</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useAdminPasswordChange } from './composables/use-admin-password-change';

/**
 * 修改密码成功后通知顶栏清理当前会话
 */
interface Emits {
  /**
   * 当前管理员密码已经修改成功
   */
  success: [];
}

const emits = defineEmits<Emits>();
const { formRef, dialogVisible, submitting, form, rules, open, handleSubmit, handleCancel } = useAdminPasswordChange({
  onSuccess: () => emits('success'),
});

defineExpose({ open });
</script>

<style lang="scss" src="./index.scss" scoped></style>
