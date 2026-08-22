<template>
  <section class="menu-editor-panel">
    <template v-if="props.model">
      <header class="menu-editor-panel__header">
        <div>
          <span>{{ isCreateMode ? '新建节点' : '节点属性' }}</span>
          <h2>{{ form.name || MENU_TYPE_TITLES[form.type] }}</h2>
        </div>
        <span class="menu-editor-panel__id">{{ form.id ? `ID ${form.id}` : '尚未保存' }}</span>
      </header>

      <div class="menu-editor-panel__body">
        <el-scrollbar>
          <el-form ref="formRef" class="menu-editor-panel__form" :model="form" :rules="formRules" label-position="top">
            <section class="menu-editor-panel__section">
              <div class="menu-editor-panel__section-heading">
                <h3>基础信息</h3>
                <p>节点类型保存后不可修改，避免已有子节点失去合法归属。</p>
              </div>

              <el-form-item label="节点类型" prop="type">
                <el-radio-group v-model="form.type" :disabled="!isCreateMode" @change="handleTypeChange">
                  <el-radio-button value="DIRECTORY">目录</el-radio-button>
                  <el-radio-button value="MENU">页面</el-radio-button>
                  <el-radio-button v-if="form.type === 'BUTTON'" value="BUTTON">权限</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" maxlength="50" placeholder="请输入展示名称" show-word-limit />
              </el-form-item>

              <el-form-item label="父级节点">
                <el-select
                  v-model="form.parentId"
                  clearable
                  placeholder="不选择表示根节点"
                  @change="handleParentChange"
                >
                  <el-option
                    v-for="option in parentOptions"
                    :key="option.id"
                    :label="option.label"
                    :value="option.id"
                  />
                </el-select>
                <p class="menu-editor-panel__help">也可以直接在左侧拖动节点调整父级。</p>
              </el-form-item>

              <el-form-item v-if="form.type === 'MENU'" label="绑定页面" prop="routeName">
                <el-select
                  v-model="form.routeName"
                  clearable
                  filterable
                  placeholder="选择已经注册的前端页面"
                  @change="bindPage"
                >
                  <el-option
                    v-for="option in ADMIN_PAGE_OPTIONS"
                    :key="option.routeName"
                    :disabled="
                      boundPages.get(option.routeName) !== undefined && boundPages.get(option.routeName) !== form.id
                    "
                    :label="`${option.title} · ${option.routePath}`"
                    :value="option.routeName"
                  />
                </el-select>
                <p class="menu-editor-panel__help">页面组件由本地注册表提供，不需要手动输入 Vue 文件路径。</p>
              </el-form-item>

              <el-form-item v-if="form.type === 'BUTTON'" label="权限码" prop="permissionCode">
                <el-input v-model="form.permissionCode" placeholder="例如 system:user:create" />
                <p class="menu-editor-panel__help">权限码统一使用“模块:资源:操作”三段式结构。</p>
              </el-form-item>

              <el-form-item v-if="showIconPicker" label="一级菜单图标">
                <menu-icon-picker v-model="form.icon" />
                <p class="menu-editor-panel__help">二级和更深层级不展示图标，移动到子节点后会自动清空。</p>
              </el-form-item>
            </section>

            <section v-if="form.type !== 'BUTTON'" class="menu-editor-panel__section">
              <div class="menu-editor-panel__section-heading">
                <h3>导航状态</h3>
                <p>停用会收回访问能力，隐藏只影响侧边栏展示。</p>
              </div>

              <div class="menu-editor-panel__switch-row">
                <div>
                  <strong>启用节点</strong>
                  <span>关闭后角色无法继续获得该节点权限</span>
                </div>
                <el-switch v-model="form.isActive" />
              </div>

              <div class="menu-editor-panel__switch-row">
                <div>
                  <strong>显示在导航</strong>
                  <span>隐藏后仍可保留路由和角色关联</span>
                </div>
                <el-switch v-model="form.isVisible" />
              </div>
            </section>

            <section v-if="form.type === 'MENU' && form.id" class="menu-editor-panel__section">
              <div class="menu-editor-panel__section-heading menu-editor-panel__section-heading--permissions">
                <div>
                  <h3>操作权限</h3>
                  <p>按钮权限不占用左侧导航树，在这里集中维护。</p>
                </div>
                <el-button :disabled="!permissionPrefix" :loading="props.saving" @click="generateStandardPermissions">
                  生成标准 CRUD
                </el-button>
              </div>

              <div v-if="props.permissions.length" class="menu-editor-panel__permissions">
                <div v-for="permission in props.permissions" :key="permission.id" class="menu-editor-panel__permission">
                  <ShieldCheck :size="16" :stroke-width="1.8" />
                  <span>{{ permission.name }}</span>
                  <code>{{ permission.permissionCode }}</code>
                  <button
                    type="button"
                    title="删除权限"
                    aria-label="删除权限"
                    @click="emit('delete-permission', permission.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
              <el-empty v-else description="暂未配置操作权限" :image-size="56" />

              <p v-if="!permissionPrefix" class="menu-editor-panel__help">
                当前页面没有配置权限前缀，不能自动生成标准 CRUD 权限。
              </p>
            </section>
          </el-form>
        </el-scrollbar>
      </div>

      <footer class="menu-editor-panel__footer">
        <el-button @click="emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="props.saving" @click="submitForm">保存</el-button>
      </footer>
    </template>

    <el-empty v-else class="menu-editor-panel__empty" description="选择左侧菜单开始编辑" />
  </section>
</template>

<script setup lang="ts">
import { ShieldCheck, Trash2 } from '@lucide/vue';

import { ADMIN_PAGE_OPTIONS } from '@/router';
import MenuIconPicker from '../menu-icon-picker/index.vue';

import type { FormRules } from 'element-plus';
import type { AdminMenuTreeNode, PermissionCode, RbacMenuType } from '@repo/shared/types';
import type { AdminMenuEditorModel, MenuFormExpose, ParentMenuOption } from '@/types';

/**
 * 不同节点类型在空表单标题中的默认文案
 */
const MENU_TYPE_TITLES: Record<RbacMenuType, string> = {
  DIRECTORY: '新目录',
  MENU: '新页面',
  BUTTON: '新权限',
};

/**
 * 菜单属性面板输入参数
 */
interface Props {
  /**
   * 当前正在新增或编辑的菜单模型
   */
  model: AdminMenuEditorModel | null;

  /**
   * 完整菜单树，用于父级选项和页面绑定冲突判断
   */
  menus: AdminMenuTreeNode[];

  /**
   * 当前页面菜单已经拥有的按钮权限
   */
  permissions: AdminMenuTreeNode[];

  /**
   * 是否正在保存、删除或生成权限
   */
  saving?: boolean;
}

/**
 * 菜单属性面板输出事件
 */
interface Emits {
  /**
   * 表单校验通过后提交完整编辑模型
   */
  (event: 'save', model: AdminMenuEditorModel): void;

  /**
   * 用户取消当前编辑
   */
  (event: 'cancel'): void;

  /**
   * 为当前页面菜单生成标准 CRUD 权限
   */
  (event: 'generate-permissions', id: number, permissionPrefix: `${string}:${string}`): void;

  /**
   * 删除当前页面下的指定按钮权限
   */
  (event: 'delete-permission', id: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
});
const emit = defineEmits<Emits>();
const formRef = ref<MenuFormExpose | null>(null);
const form = reactive<AdminMenuEditorModel>({
  parentId: null,
  name: '',
  type: 'DIRECTORY',
  routePath: null,
  routeName: null,
  component: null,
  icon: null,
  permissionCode: null,
  isVisible: true,
  isActive: true,
});

/**
 * 菜单属性表单校验规则
 */
const formRules: FormRules<AdminMenuEditorModel> = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  routeName: [
    {
      validator: (_rule, value, callback) => {
        if (form.type === 'MENU' && !value) {
          callback(new Error('请选择需要绑定的前端页面'));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
  permissionCode: [
    {
      validator: (_rule, value, callback) => {
        const matched = typeof value === 'string' && /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(value);
        if (form.type === 'BUTTON' && !matched) {
          callback(new Error('请输入正确的三段式权限码'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

/**
 * 当前是否正在创建尚未写入数据库的新节点
 */
const isCreateMode = computed(() => !form.id);

/**
 * 只有根目录和根页面允许配置侧边栏图标
 */
const showIconPicker = computed(() => form.parentId === null && form.type !== 'BUTTON');

/**
 * 当前页面注册项提供的标准权限前缀
 */
const permissionPrefix = computed(() => {
  return ADMIN_PAGE_OPTIONS.find((option) => option.routeName === form.routeName)?.permissionPrefix ?? null;
});

/**
 * 递归收集当前节点及其后代主键，防止父级选择形成循环关系
 *
 * @param nodes 当前层级菜单节点
 * @param rootId 需要排除的节点主键
 * @param excludedIds 收集排除结果的集合
 * @returns 包含当前节点及全部后代主键的集合
 */
const collectExcludedIds = (
  nodes: AdminMenuTreeNode[],
  rootId: number | undefined,
  excludedIds = new Set<number>(),
): Set<number> => {
  for (const node of nodes) {
    if (node.id === rootId || excludedIds.has(node.parentId ?? -1)) {
      excludedIds.add(node.id);
    }
    collectExcludedIds(node.children, rootId, excludedIds);
  }
  return excludedIds;
};

/**
 * 把菜单树转换为带层级缩进的父级选择项
 *
 * @param nodes 当前层级菜单节点
 * @param excludedIds 当前节点及后代主键集合
 * @param level 当前树深度
 * @returns 可以作为父级的目录和页面菜单
 */
const flattenParentOptions = (nodes: AdminMenuTreeNode[], excludedIds: Set<number>, level = 0): ParentMenuOption[] => {
  return nodes.flatMap((node) => {
    if (node.type === 'BUTTON' || excludedIds.has(node.id)) {
      return [];
    }

    return [
      { id: node.id, label: `${'　'.repeat(level)}${node.name}` },
      ...flattenParentOptions(node.children, excludedIds, level + 1),
    ];
  });
};

/**
 * 当前节点可以选择的父级菜单
 */
const parentOptions = computed(() => {
  return flattenParentOptions(props.menus, collectExcludedIds(props.menus, form.id));
});

/**
 * 获取完整菜单树中已经绑定的页面标识
 *
 * @param nodes 当前层级菜单节点
 * @returns 页面标识到菜单主键的映射
 */
const collectBoundPages = (nodes: AdminMenuTreeNode[]): Map<string, number> => {
  const result = new Map<string, number>();
  for (const node of nodes) {
    if (node.routeName) {
      result.set(node.routeName, node.id);
    }
    for (const [routeName, id] of collectBoundPages(node.children)) {
      result.set(routeName, id);
    }
  }
  return result;
};

/**
 * 完整菜单树中已经绑定的页面标识
 */
const boundPages = computed(() => collectBoundPages(props.menus));

/**
 * 根据 Router 派生的页面选项自动填写路由和组件信息
 *
 * @param routeName 用户选择的页面标识
 */
const bindPage = (routeName: string | null): void => {
  const page = ADMIN_PAGE_OPTIONS.find((option) => option.routeName === routeName);
  form.routePath = page?.routePath ?? null;
  form.component = page?.component ?? null;
  if (page && !form.name.trim()) {
    form.name = page.title;
  }
};

/**
 * 新增时切换节点类型并清理不再适用的表单字段
 *
 * @param type Element Plus 单选组返回的节点类型
 */
const handleTypeChange = (type: string | number | boolean | undefined): void => {
  if (type !== 'MENU') {
    form.routeName = null;
    form.routePath = null;
    form.component = null;
  }
  if (type !== 'BUTTON') {
    form.permissionCode = null;
  }
};

/**
 * 父级变更后清理非一级菜单图标
 *
 * @param parentId 新父级主键
 */
const handleParentChange = (parentId: number | null): void => {
  if (parentId) {
    form.icon = null;
  }
};

/**
 * 校验并提交当前菜单表单
 */
const submitForm = async (): Promise<void> => {
  if (!(await formRef.value?.validate())) {
    return;
  }

  emit('save', {
    ...form,
    name: form.name.trim(),
    permissionCode: form.permissionCode?.trim() as PermissionCode | null,
  });
};

/**
 * 使用当前页面注册项生成标准 CRUD 权限
 */
const generateStandardPermissions = (): void => {
  if (form.id && permissionPrefix.value) {
    emit('generate-permissions', form.id, permissionPrefix.value);
  }
};

watch(
  () => props.model,
  (model) => {
    if (model) {
      form.id = undefined;
      Object.assign(form, model);
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" src="./index.scss" scoped></style>
