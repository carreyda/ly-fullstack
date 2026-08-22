import type { ChangeAdminPasswordParams } from '@repo/shared/types';

/**
 * 顶栏通知中心支持的内容分类
 */
export type HeaderNotificationCategory = 'notice' | 'message' | 'todo';

/**
 * 顶栏通知图标使用的业务语义
 */
export type HeaderNotificationKind = 'system' | 'security' | 'task';

/**
 * 顶栏通知中心的单条展示数据
 */
export interface HeaderNotificationItem {
  /**
   * 当前通知在前端演示数据中的唯一标识
   */
  id: number;

  /**
   * 通知所属页签
   */
  category: HeaderNotificationCategory;

  /**
   * 决定图标与语义色的通知类型
   */
  kind: HeaderNotificationKind;

  /**
   * 通知主要内容
   */
  title: string;

  /**
   * 通知来源或补充说明
   */
  description: string;

  /**
   * 面向用户展示的相对时间
   */
  time: string;

  /**
   * 当前通知是否已经阅读
   */
  read: boolean;
}

/**
 * 顶栏通知分类页签
 */
export interface HeaderNotificationTab {
  /**
   * 页签对应的通知分类
   */
  value: HeaderNotificationCategory;

  /**
   * 页签展示名称
   */
  label: string;

  /**
   * 当前分类的通知总数
   */
  count: number;
}

/**
 * 当前管理员修改密码弹框的表单模型
 */
export interface AdminPasswordChangeFormModel extends ChangeAdminPasswordParams {
  /**
   * 再次输入的新密码，只参与浏览器一致性校验
   */
  confirmPassword: string;
}

/**
 * 修改密码 Composable 的回调参数
 */
export interface UseAdminPasswordChangeOptions {
  /**
   * 密码修改成功后的调用方回调
   */
  onSuccess: () => void;
}
