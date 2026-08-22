<template>
  <el-dialog
    v-model="dialogVisible"
    title="分配角色"
    width="min(560px, calc(100vw - 32px))"
    modal-class="dialog-custom-common"
    header-class="dialog-custom-header"
    :align-center="true"
    :close-on-click-modal="false"
  >
    <div class="user-role-dialog">
      <div class="user-role-dialog__account">
        <span>当前用户</span>
        <strong>{{ targetUser?.displayName || targetUser?.username }}</strong>
        <code>{{ targetUser?.username }}</code>
      </div>

      <el-form label-position="top">
        <el-form-item label="关联角色">
          <el-select
            v-model="selectedRoleIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :loading="loading"
            placeholder="请选择角色"
          >
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.name" :value="role.id">
              <div class="user-role-dialog__option">
                <span>{{ role.name }}</span>
                <code>{{ role.code }}</code>
              </div>
            </el-option>
          </el-select>
          <p class="user-role-dialog__help">可不分配角色；没有有效角色的账号无法进入管理后台。</p>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="user-role-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useUserRole } from './composables/use-user-role';

import type { AdminUserListItem } from '@repo/shared/types';

interface Emits {
  /**
   * 用户角色保存成功
   */
  success: [];
}

const emits = defineEmits<Emits>();
const {
  dialogVisible,
  loading,
  submitting,
  targetUser,
  roleOptions,
  selectedRoleIds,
  open,
  handleCancel,
  handleSubmit,
} = useUserRole({
  onSuccess: () => emits('success'),
});

defineExpose({ open: (user: AdminUserListItem) => open(user) });
</script>

<style lang="scss" src="./index.scss" scoped></style>
