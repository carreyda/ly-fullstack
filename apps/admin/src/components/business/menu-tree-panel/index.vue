<template>
  <section class="menu-tree-panel">
    <header class="menu-tree-panel__header">
      <div>
        <h2>菜单结构</h2>
        <p>拖动节点即可调整顺序和层级</p>
      </div>

      <el-dropdown trigger="click" @command="createRootNode">
        <el-button type="primary">新建根节点</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="DIRECTORY">新建目录</el-dropdown-item>
            <el-dropdown-item command="MENU">新建页面</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <div class="menu-tree-panel__search">
      <el-input v-model="keyword" clearable placeholder="搜索菜单名称" />
    </div>

    <div v-loading="props.loading" class="menu-tree-panel__body">
      <el-scrollbar>
        <el-tree
          ref="treeRef"
          class="menu-tree-panel__tree"
          :data="treeData"
          node-key="id"
          :current-node-key="props.selectedId"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          :allow-drop="allowDrop"
          default-expand-all
          draggable
          highlight-current
          @node-click="selectNode"
          @node-drop="saveTreeOrder"
        >
          <template #default="{ data }">
            <div class="menu-tree-panel__node">
              <GripVertical class="menu-tree-panel__drag" :size="15" :stroke-width="1.6" />
              <component
                :is="data.iconComponent"
                v-if="data.parentId === null && data.iconComponent"
                class="menu-tree-panel__icon"
                :size="17"
                :stroke-width="1.8"
              />
              <span class="menu-tree-panel__name">{{ data.name }}</span>
              <span class="menu-tree-panel__type">{{ data.typeLabel }}</span>
              <span v-if="!data.isActive" class="menu-tree-panel__state">停用</span>

              <span class="menu-tree-panel__actions" @click.stop>
                <el-dropdown trigger="click" @command="(command: unknown) => createChildNode(data.id, command)">
                  <button class="menu-tree-panel__action" type="button" title="新增子节点" aria-label="新增子节点">
                    <Plus :size="15" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="DIRECTORY">新增子目录</el-dropdown-item>
                      <el-dropdown-item command="MENU">新增子页面</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <button
                  class="menu-tree-panel__action menu-tree-panel__action--danger"
                  type="button"
                  title="删除节点"
                  aria-label="删除节点"
                  @click="emit('delete', data.id)"
                >
                  <Trash2 :size="15" />
                </button>
              </span>
            </div>
          </template>
        </el-tree>

        <el-empty v-if="!props.loading && !treeData.length" description="暂无菜单，先创建一个根节点" />
      </el-scrollbar>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GripVertical, Plus, Trash2 } from '@lucide/vue';

import { resolveMenuIcon } from '@/utils';

import type { Component } from 'vue';
import type { AllowDropFunction, FilterNodeMethodFunction } from 'element-plus';
import type { AdminMenuReorderItem, AdminMenuTreeNode, RbacMenuType } from '@repo/shared/types';
import type { AdminMenuCreateContext } from '@/types';

/**
 * 菜单类型对应的中文展示名称
 */
const MENU_TYPE_LABELS: Record<RbacMenuType, string> = {
  DIRECTORY: '目录',
  MENU: '页面',
  BUTTON: '权限',
};

/**
 * 菜单树用于渲染的节点
 *
 * 操作权限不进入左侧导航树；一级节点额外解析图标组件，避免模板渲染期间重复查找注册表。
 */
interface MenuTreeViewNode extends Omit<AdminMenuTreeNode, 'children'> {
  /**
   * 一级菜单对应的 Lucide Vue 组件
   */
  iconComponent?: Component;

  /**
   * 当前节点类型的中文名称
   */
  typeLabel: string;

  /**
   * 不包含按钮权限的下级导航节点
   */
  children: MenuTreeViewNode[];
}

/**
 * Element Plus Tree 暴露的筛选能力
 */
interface MenuTreeExpose {
  /**
   * 使用当前搜索值重新筛选树节点
   */
  filter: (value: string) => void;
}

/**
 * 菜单树面板输入参数
 */
interface Props {
  /**
   * 后端返回的完整菜单树
   */
  menus: AdminMenuTreeNode[];

  /**
   * 当前属性面板正在编辑的节点主键
   */
  selectedId?: number;

  /**
   * 是否正在加载菜单树
   */
  loading?: boolean;
}

/**
 * 菜单树面板输出事件
 */
interface Emits {
  /**
   * 用户选择树节点时通知页面切换属性面板
   */
  (event: 'select', id: number): void;

  /**
   * 用户从根节点或现有节点发起新增操作
   */
  (event: 'create', context: AdminMenuCreateContext): void;

  /**
   * 用户请求删除指定菜单节点
   */
  (event: 'delete', id: number): void;

  /**
   * 树拖拽完成后提交全部导航节点的位置快照
   */
  (event: 'reorder', items: AdminMenuReorderItem[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: undefined,
  loading: false,
});
const emit = defineEmits<Emits>();
const treeRef = ref<MenuTreeExpose | null>(null);
const treeData = shallowRef<MenuTreeViewNode[]>([]);
const keyword = ref('');

/**
 * 复制菜单导航树并排除按钮权限节点
 *
 * @param nodes 后端完整菜单树
 * @returns 可以由 Element Plus 安全拖拽的导航树副本
 */
const createTreeView = (nodes: AdminMenuTreeNode[]): MenuTreeViewNode[] => {
  return nodes
    .filter((node) => node.type !== 'BUTTON')
    .map((node) => ({
      ...node,
      iconComponent: node.parentId === null ? resolveMenuIcon(node.icon) : undefined,
      typeLabel: MENU_TYPE_LABELS[node.type],
      children: createTreeView(node.children),
    }));
};

/**
 * 把拖拽后的嵌套树转换为后端批量排序参数
 *
 * @param nodes 当前层级节点
 * @param parentId 当前层级父节点主键
 * @returns 全部导航节点的父级和连续顺序
 */
const flattenTreeOrder = (nodes: MenuTreeViewNode[], parentId: number | null = null): AdminMenuReorderItem[] => {
  return nodes.flatMap((node, sortOrder) => [
    { id: node.id, parentId, sortOrder },
    ...flattenTreeOrder(node.children, node.id),
  ]);
};

/**
 * 根据名称筛选树节点
 *
 * @param value 搜索框输入内容
 * @param data 当前树节点
 * @returns 名称包含搜索内容时返回 `true`
 */
const filterNode: FilterNodeMethodFunction = (value, data) => {
  const menu = data as MenuTreeViewNode;
  const keywordValue = typeof value === 'string' ? value : '';
  return !keywordValue || menu.name.toLowerCase().includes(keywordValue.trim().toLowerCase());
};

/**
 * 约束导航节点只能放在目录或页面菜单下
 *
 * @param draggingNode 正在拖拽的节点
 * @param dropNode 目标节点
 * @param dropType Element Plus 计算的放置位置
 * @returns 当前放置位置是否合法
 */
const allowDrop: AllowDropFunction = (draggingNode, dropNode, dropType) => {
  const draggingMenu = draggingNode.data as MenuTreeViewNode;
  const dropMenu = dropNode.data as MenuTreeViewNode;
  return draggingMenu.id !== dropMenu.id && (dropType !== 'inner' || dropMenu.type !== 'BUTTON');
};

/**
 * 选择树节点并打开对应属性面板
 *
 * @param data 当前节点业务数据
 */
const selectNode = (data: MenuTreeViewNode): void => {
  emit('select', data.id);
};

/**
 * 发起根节点新增操作
 *
 * @param type 用户选择的目录或页面类型
 */
const createRootNode = (type: Exclude<RbacMenuType, 'BUTTON'>): void => {
  emit('create', { parentId: null, type });
};

/**
 * 发起指定父菜单下的新增操作
 *
 * @param parentId 父菜单主键
 * @param type 用户选择的目录或页面类型
 */
const createChildNode = (parentId: number, type: unknown): void => {
  if (type === 'DIRECTORY' || type === 'MENU') {
    emit('create', { parentId, type });
  }
};

/**
 * 提交 Element Plus 已经更新完成的菜单树顺序
 */
const saveTreeOrder = (): void => {
  emit('reorder', flattenTreeOrder(treeData.value));
};

watch(
  () => props.menus,
  (menus) => {
    treeData.value = createTreeView(menus);
  },
  { immediate: true },
);

watch(keyword, (value) => {
  treeRef.value?.filter(value);
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
