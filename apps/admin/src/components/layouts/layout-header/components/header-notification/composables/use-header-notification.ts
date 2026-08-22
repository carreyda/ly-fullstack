import type { HeaderNotificationCategory, HeaderNotificationItem, HeaderNotificationTab } from '@/types';

/**
 * 管理顶栏通知中心的演示数据、分类筛选和已读状态
 *
 * 当前项目还没有通知服务，数据只用于完成开源底座的交互和视觉示例。后续接入真实接口时保留返回结构，
 * 将初始数组替换为请求结果即可，Header 和 Popover 不需要重写。
 *
 * @returns 通知列表、未读数量、分类页签和交互方法
 */
export const useHeaderNotification = () => {
  const activeCategory = ref<HeaderNotificationCategory>('notice');
  const notificationList = ref<HeaderNotificationItem[]>([
    {
      id: 1,
      category: 'notice',
      kind: 'system',
      title: '系统基础配置已完成',
      description: '管理后台已经完成初始化，可以开始配置业务菜单。',
      time: '5 分钟前',
      read: false,
    },
    {
      id: 2,
      category: 'notice',
      kind: 'security',
      title: '检测到新的登录活动',
      description: '管理员账号刚刚在当前设备完成登录。',
      time: '18 分钟前',
      read: false,
    },
    {
      id: 3,
      category: 'message',
      kind: 'security',
      title: '角色权限配置已更新',
      description: '超级管理员调整了一组角色菜单权限。',
      time: '1 小时前',
      read: false,
    },
    {
      id: 4,
      category: 'todo',
      kind: 'task',
      title: '检查本周数据报告',
      description: '确认工作台演示指标与当前业务场景一致。',
      time: '今天 15:30',
      read: true,
    },
    {
      id: 5,
      category: 'todo',
      kind: 'task',
      title: '完善部署环境配置',
      description: '补充生产环境变量并确认版本检测地址。',
      time: '明天 10:00',
      read: true,
    },
  ]);

  /**
   * 当前仍需提醒用户的通知数量
   */
  const unreadCount = computed(() => notificationList.value.filter((item) => !item.read).length);

  /**
   * 通知分类及每类数据量
   */
  const tabList = computed<HeaderNotificationTab[]>(() => [
    {
      value: 'notice',
      label: '通知',
      count: notificationList.value.filter((item) => item.category === 'notice').length,
    },
    {
      value: 'message',
      label: '消息',
      count: notificationList.value.filter((item) => item.category === 'message').length,
    },
    {
      value: 'todo',
      label: '待办',
      count: notificationList.value.filter((item) => item.category === 'todo').length,
    },
  ]);

  /**
   * 当前选中分类需要展示的通知
   */
  const visibleList = computed(() => notificationList.value.filter((item) => item.category === activeCategory.value));

  /**
   * 切换通知分类
   *
   * @param category 用户选择的通知分类
   */
  const handleCategoryChange = (category: HeaderNotificationCategory): void => {
    activeCategory.value = category;
  };

  /**
   * 将单条通知标记为已读
   *
   * @param id 通知唯一标识
   */
  const handleItemRead = (id: number): void => {
    const target = notificationList.value.find((item) => item.id === id);
    if (target) {
      target.read = true;
    }
  };

  /**
   * 将当前通知列表全部标记为已读
   */
  const handleReadAll = (): void => {
    notificationList.value.forEach((item) => {
      item.read = true;
    });
  };

  return {
    activeCategory,
    unreadCount,
    tabList,
    visibleList,
    handleCategoryChange,
    handleItemRead,
    handleReadAll,
  };
};
