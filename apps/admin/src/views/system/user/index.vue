<template>
  <section class="user-management-page admin-crud-page">
    <section class="admin-crud-page__workspace">
      <header class="admin-crud-page__header">
        <h1 class="admin-crud-page__title">用户管理</h1>
        <el-button v-if="hasPermission('system:user:create')" type="primary" @click="handleUserCreate">
          新增用户
        </el-button>
      </header>

      <data-filter-panel
        :model-value="filters"
        :default-model="ADMIN_USER_FILTER_MODEL"
        :config="USER_FILTER_CONFIG"
        @update:model-value="handleFilterUpdate"
        @search="handleSearch"
        @reset="handleReset"
      />

      <div class="admin-crud-page__table">
        <el-table v-loading="loading" class="admin-table" :data="userList" height="100%">
          <el-table-column label="序号" min-width="76" align="center">
            <template #default="{ $index }">
              {{ (filters.pageNum - 1) * filters.pageSize + $index + 1 }}
            </template>
          </el-table-column>

          <el-table-column label="用户" min-width="210">
            <template #default="{ row }">
              <div class="user-management-page__identity">
                <span class="user-management-page__avatar">{{ getUserInitial(row as AdminUserListItem) }}</span>
                <div>
                  <strong>{{ row.displayName || row.username }}</strong>
                  <span>{{ row.username }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="账号类型" min-width="110" align="center">
            <template #default="{ row }">
              <base-badge :tone="row.isSystem ? 'primary' : 'neutral'">
                {{ row.isSystem ? '系统内置' : '普通用户' }}
              </base-badge>
            </template>
          </el-table-column>

          <el-table-column label="关联角色" min-width="240">
            <template #default="{ row }">
              <div v-if="row.roles.length" class="user-management-page__roles">
                <base-badge
                  v-for="role in row.roles"
                  :key="role.id"
                  :tone="role.code === 'super_admin' ? 'primary' : 'neutral'"
                >
                  {{ role.name }}
                </base-badge>
              </div>
              <span v-else class="user-management-page__empty-role">未分配角色</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" min-width="100" align="center">
            <template #default="{ row }">
              <base-badge :tone="row.isActive ? 'success' : 'warning'" dot>
                {{ row.isActive ? '启用' : '停用' }}
              </base-badge>
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="创建时间" min-width="180">
            <template #default="{ row }">
              <span class="user-management-page__time">{{ formatAdminDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="310" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="!row.isSystem && hasPermission('system:user:assign-role')"
                link
                type="primary"
                @click="handleUserRoles(row as AdminUserListItem)"
              >
                分配角色
              </el-button>
              <el-button
                v-if="hasPermission('system:user:update')"
                link
                type="primary"
                @click="handleUserEdit(row as AdminUserListItem)"
              >
                编辑
              </el-button>
              <el-button
                v-if="hasPermission('system:user:update')"
                link
                type="primary"
                @click="handleUserPassword(row as AdminUserListItem)"
              >
                重置密码
              </el-button>
              <el-button
                v-if="!row.isSystem && hasPermission('system:user:delete')"
                link
                type="danger"
                :loading="deletingId === row.id"
                :disabled="Boolean(deletingId)"
                @click="handleUserDelete(row as AdminUserListItem)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <base-empty-state
              :description="loadFailed ? '用户数据加载失败' : '暂无用户数据'"
              layout="inline"
              :image-size="84"
            >
              <el-button v-if="loadFailed" type="primary" @click="reload">重新加载</el-button>
            </base-empty-state>
          </template>
        </el-table>
      </div>

      <footer class="admin-crud-page__pagination">
        <el-pagination
          background
          :page-sizes="pageSizeOptions"
          :current-page="filters.pageNum"
          :page-size="filters.pageSize"
          :total="total"
          layout="total,sizes,prev,pager,next,jumper"
          @current-change="handlePageNumChange"
          @size-change="handlePageSizeChange"
        />
      </footer>
    </section>

    <user-form-dialog ref="formDialogRef" @success="handleFormSuccess" />
    <user-role-dialog ref="roleDialogRef" @success="reload" />
    <user-password-dialog ref="passwordDialogRef" />
  </section>
</template>

<script setup lang="ts">
import { fetchAdminUserRoleOptions } from '@/api';
import DataFilterPanel from '@/components/business/data-filter-panel/index.vue';
import { ADMIN_PAGE_SIZE_OPTIONS, ADMIN_USER_FILTER_CONFIG, ADMIN_USER_FILTER_MODEL } from '@/constants';
import { useAuthStore } from '@/stores';
import { formatAdminDateTime } from '@/utils';
import UserFormDialog from './components/user-form-dialog/index.vue';
import UserPasswordDialog from './components/user-password-dialog/index.vue';
import UserRoleDialog from './components/user-role-dialog/index.vue';
import { useUserManagement } from './composables/use-user-management';

import type { AdminUserListItem } from '@repo/shared/types';
import type { DataFilterFieldConfig } from '@/types';

/**
 * 用户筛选字段配置
 *
 * 角色选项由用户模块接口加载，避免常量层依赖请求层。
 */
const USER_FILTER_CONFIG: DataFilterFieldConfig[] = [
  ...ADMIN_USER_FILTER_CONFIG,
  {
    type: 'select',
    field: 'roleId',
    label: '关联角色',
    placeholder: '全部角色',
    asyncOptions: async () => {
      const roles = await fetchAdminUserRoleOptions();
      return roles.map((role) => ({
        label: role.isActive ? role.name : `${role.name}（已停用）`,
        value: role.id,
      }));
    },
  },
];

const formDialogRef = useTemplateRef<InstanceType<typeof UserFormDialog>>('formDialogRef');
const roleDialogRef = useTemplateRef<InstanceType<typeof UserRoleDialog>>('roleDialogRef');
const passwordDialogRef = useTemplateRef<InstanceType<typeof UserPasswordDialog>>('passwordDialogRef');
const pageSizeOptions = [...ADMIN_PAGE_SIZE_OPTIONS];
const { hasPermission } = useAuthStore();

const {
  loading,
  loadFailed,
  deletingId,
  filters,
  userList,
  total,
  reload,
  handleFilterUpdate,
  handleSearch,
  handleReset,
  handlePageNumChange,
  handlePageSizeChange,
  handleUserDelete,
  handleFormSuccess,
} = useUserManagement();

const handleUserCreate = (): void => {
  formDialogRef.value?.open('add');
};

/**
 * 打开用户基础资料编辑弹框
 *
 * @param user 当前表格行
 */
const handleUserEdit = (user: AdminUserListItem): void => {
  formDialogRef.value?.open('edit', user);
};

/**
 * 打开普通用户角色分配弹框
 *
 * @param user 当前表格行
 */
const handleUserRoles = (user: AdminUserListItem): void => {
  void roleDialogRef.value?.open(user);
};

/**
 * 打开管理员重置密码弹框
 *
 * @param user 当前表格行
 */
const handleUserPassword = (user: AdminUserListItem): void => {
  passwordDialogRef.value?.open(user);
};

/**
 * 获取用户头像占位字符
 *
 * @param user 当前用户列表记录
 * @returns 显示名称或登录名的首字符
 */
const getUserInitial = (user: AdminUserListItem): string => {
  return (user.displayName || user.username).trim().slice(0, 1).toUpperCase();
};
</script>

<style lang="scss" src="./index.scss" scoped></style>
