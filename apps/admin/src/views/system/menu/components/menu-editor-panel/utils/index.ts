import type { AdminMenuTreeNode } from '@repo/shared/types';
import type { FormRules } from 'element-plus';
import type { AdminMenuEditorModel, ParentMenuOption } from '@/types';

/**
 * 创建菜单属性表单校验规则
 *
 * 校验器读取当前响应式表单的节点类型，以便目录、页面和按钮共用同一份编辑模型。
 *
 * @param form 当前菜单编辑模型
 * @returns Element Plus 菜单表单校验规则
 */
export const createMenuFormRules = (form: AdminMenuEditorModel): FormRules<AdminMenuEditorModel> => ({
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
});

/**
 * 递归收集当前节点及其后代主键，防止父级选择形成循环关系
 *
 * @param nodes 当前层级菜单节点
 * @param rootId 需要排除的节点主键
 * @param excludedIds 收集排除结果的集合
 * @returns 包含当前节点及全部后代主键的集合
 */
export const collectExcludedIds = (
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
export const flattenParentOptions = (
  nodes: AdminMenuTreeNode[],
  excludedIds: Set<number>,
  level = 0,
): ParentMenuOption[] => {
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
 * 获取完整菜单树中已经绑定的页面标识
 *
 * @param nodes 当前层级菜单节点
 * @returns 页面标识到菜单主键的映射
 */
export const collectBoundPages = (nodes: AdminMenuTreeNode[]): Map<string, number> => {
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
