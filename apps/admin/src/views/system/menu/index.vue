<template>
  <div class="menu-management-page">
    <section class="menu-management-page__workspace">
      <menu-tree-panel
        :menus="menus"
        :selected-id="selectedId"
        :loading="loading"
        @select="selectMenu"
        @create="createMenuDraft"
        @delete="removeMenu"
        @reorder="saveMenuOrder"
      />

      <menu-editor-panel
        :model="editorModel"
        :menus="menus"
        :permissions="permissions"
        :saving="saving"
        @save="saveMenu"
        @cancel="cancelEdit"
        @delete-permission="removeMenu"
        @generate-permissions="generateStandardPermissions"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import MenuEditorPanel from './components/menu-editor-panel/index.vue';
import MenuTreePanel from './components/menu-tree-panel/index.vue';
import { useMenuManagement } from './composables/use-menu-management';

/**
 * 菜单管理页面只负责组合树编辑器和属性面板，异步请求、竞态保护与会话刷新统一由 Composable 管理。
 */
const {
  menus,
  selectedId,
  editorModel,
  permissions,
  loading,
  saving,
  selectMenu,
  createMenuDraft,
  saveMenu,
  removeMenu,
  saveMenuOrder,
  generateStandardPermissions,
  cancelEdit,
} = useMenuManagement();
</script>

<style lang="scss" scoped>
.menu-management-page {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: var(--body-bg-color);

  &__workspace {
    display: grid;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    grid-template-columns: minmax(360px, 38%) minmax(0, 1fr);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--fill-color);
  }
}

@media (max-width: 1100px) {
  .menu-management-page__workspace {
    grid-template-columns: 340px minmax(0, 1fr);
  }
}
</style>
