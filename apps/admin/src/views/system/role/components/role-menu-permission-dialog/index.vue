<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="min(680px, calc(100vw - 32px))"
    modal-class="dialog-custom-common"
    header-class="dialog-custom-header"
    :align-center="true"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="role-menu-permission-dialog" :style="{ height: `${dialogHeight}px` }">
      <header class="role-menu-permission-dialog__header">
        <p>勾选角色可以访问的目录、页面和操作权限，父级目录会由系统自动补齐。</p>
      </header>

      <div v-loading="loading" class="role-menu-permission-dialog__body">
        <el-scrollbar>
          <el-tree
            v-if="menuTree.length"
            ref="treeRef"
            class="role-menu-permission-dialog__tree"
            :data="menuTree"
            node-key="id"
            :props="{ children: 'children', label: 'name', disabled: 'disabled' }"
            show-checkbox
            default-expand-all
            check-on-click-node
          >
            <template #default="{ data }">
              <div class="role-menu-permission-dialog__node">
                <span>{{ data.name }}</span>
                <base-badge :tone="data.type === 'BUTTON' ? 'neutral' : 'primary'">
                  {{ data.type === 'DIRECTORY' ? '目录' : data.type === 'MENU' ? '页面' : '权限' }}
                </base-badge>
                <base-badge v-if="!data.isActive" tone="warning">已停用</base-badge>
              </div>
            </template>
          </el-tree>

          <base-empty-state v-else-if="!loading" description="暂无可分配菜单" />
        </el-scrollbar>
      </div>
    </div>

    <template #footer>
      <div class="role-menu-permission-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="loading" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useRoleMenuPermission } from './composables/use-role-menu-permission';

import type { AdminRoleListItem } from '@repo/shared/types';

interface Emits {
  /**
   * 角色菜单权限保存成功
   */
  success: [];
}

const emits = defineEmits<Emits>();
const {
  treeRef,
  dialogVisible,
  dialogHeight,
  dialogTitle,
  loading,
  submitting,
  menuTree,
  open,
  handleCancel,
  handleClosed,
  handleSubmit,
} = useRoleMenuPermission({
  onSuccess: () => emits('success'),
});

defineExpose({ open });
</script>

<style lang="scss" src="./index.scss" scoped></style>
