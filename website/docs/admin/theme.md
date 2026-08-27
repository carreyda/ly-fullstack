---
title: 主题与视觉规范
description: 说明 Admin 深浅主题、语义变量、Element Plus Sass 定制、页面视觉真相源、组件覆盖边界和双主题验收方式。
---

# 主题与视觉规范

Admin 同时支持深色与浅色主题。首次访问默认跟随操作系统；用户主动切换后持久化明确选择。深浅主题共享功能结构，但颜色、表面、边界和图表需要分别适配。

## 三层变量模型

主题样式分为：

1. **原子色板**：品牌绿、灰阶和状态基础颜色。
2. **语义变量**：页面背景、表面、文字、边框、焦点、成功、警告和危险。
3. **组件消费**：页面与业务组件只使用语义变量，不猜测当前主题色值。

业务 SCSS 中优先使用 `var(--color-...)` 等语义 token。除 SVG、第三方兼容或 token 源文件外，不在页面散落固定色值。

## Element Plus 为什么分两层适配

Element Plus 主题包含：

- 编译期 Sass 变量：决定组件生成的基础 CSS；
- 运行时 CSS 变量和必要业务作用域覆盖：适配深浅主题与特定组件状态。

项目的唯一 Sass 入口是：

```text
apps/admin/src/assets/element-plus/index.scss
apps/admin/src/assets/element-plus/modules/var.scss
```

禁止在业务源码手工导入 `element-plus/theme-chalk/*.css` 或组件 `style/css`。预编译默认样式会绕过项目变量并重新带入默认蓝色。

## 页面视觉真相源

现有页面应遵循仓库根专题文档：

- [Admin 设计系统与页面视觉规范](https://github.com/liangy0323/ly-fullstack/blob/main/docs/admin-design-system.md)
- [Admin 多主题与 Element Plus 定制方案](https://github.com/liangy0323/ly-fullstack/blob/main/docs/admin-theme.md)

外部项目只能作为局部参考，不能覆盖现有 token、布局尺寸、组件层级和交互边界。

## CRUD 页面视觉原则

- 一个页面只保留一个完整数据工作区。
- 标题、筛选、表格和分页通过分隔线连接，不堆叠悬浮卡片。
- 页面层级依靠表面、边界、间距和字重，不依赖大面积渐变或阴影。
- 表格统一使用 `admin-table`。
- 状态使用语义 Badge，日期转换为用户本地可读格式。
- 键盘焦点必须可见，不能只移除 `outline`。

Dashboard 属于数据展示页面，可以使用更有品牌特征的视觉，但仍需保证信息可读性、图表对比度和两套主题的一致结构。

## 新增组件的主题流程

1. 确认没有错误引入 Element Plus 预编译 CSS。
2. 查看当前锁定版本的 Element Plus 源码和变量，不凭记忆猜选择器。
3. 先建立项目语义变量。
4. 能通过官方 Sass map 解决时在 `var.scss` 配置。
5. 只有 Sass 变量无法覆盖的运行时状态，才增加业务作用域覆盖。
6. 同时检查浅色、深色、hover、focus、disabled、loading 和弹层状态。

## 图表与非 DOM 渲染

Canvas、WebGL 和 ECharts 不能直接消费 CSS 选择器。页面 composable 应在主题变化时读取语义变量、重新计算图表 option，并正确清理 ResizeObserver、事件监听和图表实例。

## 最低验证

```bash
rg "element-plus/.*/style/(css|index)|element-plus/theme-chalk/.*\\.css" apps/admin/src
pnpm --filter @repo/admin typecheck
pnpm --filter @repo/admin test
pnpm --filter @repo/admin build:prod
```

然后在真实浏览器中检查深浅主题和项目支持的窄屏宽度。代码构建通过不能替代视觉验收。
