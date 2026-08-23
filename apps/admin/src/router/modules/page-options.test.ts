import { describe, expect, it } from '@rstest/core';

import { createAdminPageOptions } from './page-options';

import type { RouteRecordRaw } from 'vue-router';

describe('createAdminPageOptions', () => {
  it('从嵌套路由递归派生可绑定页面并生成绝对路径', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        children: [
          {
            path: 'user',
            name: 'system-user',
            component: {},
            meta: {
              title: '用户管理',
              pageBinding: {
                component: 'system/user/index',
                permissionPrefix: 'system:user',
              },
            },
          },
          {
            path: '/external-report',
            name: 'external-report',
            component: {},
            meta: {
              title: '独立报表',
              pageBinding: {
                component: 'report/external/index',
                permissionPrefix: null,
              },
            },
          },
        ],
      },
    ];

    expect(createAdminPageOptions(routes)).toEqual([
      {
        routeName: 'system-user',
        title: '用户管理',
        routePath: '/system/user',
        component: 'system/user/index',
        permissionPrefix: 'system:user',
      },
      {
        routeName: 'external-report',
        title: '独立报表',
        routePath: '/external-report',
        component: 'report/external/index',
        permissionPrefix: null,
      },
    ]);
  });

  it('过滤未声明页面绑定或缺少稳定路由名的节点', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        children: [
          {
            path: 'directory',
            name: 'system-directory',
            component: {},
            meta: { title: '系统目录' },
          },
          {
            path: 'anonymous',
            component: {},
            meta: {
              title: '匿名页面',
              pageBinding: {
                component: 'system/anonymous/index',
                permissionPrefix: null,
              },
            },
          },
        ],
      },
    ];

    expect(createAdminPageOptions(routes)).toEqual([]);
  });
});
