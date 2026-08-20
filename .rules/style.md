# 样式规范

当前项目可以先只有一个默认主题，但样式体系按多主题能力设计。所有颜色、背景、边框、阴影、层级等 design token 优先走 CSS 变量，避免把颜色值散落在组件里。

## CSS 变量主题

通过 `data-theme` 属性预留主题切换能力：

具体色值放在 `src/assets/styles/modules/tokens.scss`，主题语义变量放在 `src/assets/styles/modules/theme.scss`。

```scss
:root {
  --palette-blue-600: #2979fa;
}

html[data-theme='white'] {
  --color-primary: var(--palette-blue-600);
}
```

规则：

- 当前只启用白色主题时，也写在 `html[data-theme='white']` 下。
- 新增主题只新增变量覆盖，不复制组件样式。
- 组件内禁止直接写业务颜色值，除非是不可主题化的透明度、阴影或状态辅助色。
- TypeScript 中需要切换主题时，只修改根节点 `data-theme`，不要动态改大量 class。
- CSS 变量使用通用语义命名，不使用 `--im-*` 这类项目名前缀。

---

## 样式入口聚合

`src/assets/styles/index.scss` 作为全局样式唯一入口：

```scss
@use './modules/tokens.scss';
@use './modules/theme.scss';
@use './modules/base.scss';
@use './modules/element-plus.scss';
@use './modules/message.scss';
```

规则：

- 全局 reset、变量、动画、字体、UI 库覆盖集中在入口中聚合。
- 组件私有样式放在组件同目录，不通过全局入口引入。
- 不引入 Tailwind；当前项目统一使用 SCSS + BEM + CSS 变量。
- 不迁移 `common.scss` / `generate.scss` 这类全局原子类；迁移时改为组件 BEM 类 + `mixins.scss`。

---

## Vue 组件样式策略

| 条件         | 方式                                                     |
| ------------ | -------------------------------------------------------- |
| 样式 ≤ 50 行 | 内联 `<style lang="scss" scoped>`                        |
| 样式 > 50 行 | 外部文件 `<style lang="scss" src="./index.scss" scoped>` |
| 多组件共享   | 拆到组件域或 `assets/styles/modules/`                    |

组件目录示例：

```text
src/components/chat/message-item/
├── index.vue
└── index.scss
```

---

## 禁止样式穿透（`:deep`）（强制）

禁止在组件 `<style scoped>` 中使用 `:deep()`，也禁止使用 `::v-deep`、`/deep/`、`>>>` 等等价写法。穿透会绕过 scoped 边界，使第三方组件覆盖和跨组件样式散落在业务文件中，后续很难判断样式来源与影响范围。

需要覆盖子组件或第三方组件内部 DOM 时，必须把规则迁移到对应应用或共享包的全局样式模块，并使用当前组件的 BEM Block 作为最外层作用域：

| 作用域            | 落点                                                               |
| ----------------- | ------------------------------------------------------------------ |
| Admin SPA         | `apps/admin/src/assets/styles/modules/component-overrides.scss`    |
| 未来主站          | 技术栈与目录确定后，在主站应用内维护带业务作用域的全局覆盖文件     |
| 共享 UI 组件      | `packages/ui/src/styles/modules/component-overrides.scss`          |
| Element Plus 通用 | `apps/admin/src/assets/element-plus/modules/` 中对应的全局覆盖模块 |

判断标准：

- 只修改组件自身模板中的元素：保留在组件 scoped 样式中。
- 需要命中子组件根节点内部或第三方组件生成的 DOM：迁入全局覆盖模块。
- 只对一个业务组件生效的覆盖，也必须使用该组件 Block 限定，禁止直接在全局写裸 `.el-*`、`.w-e-*` 或其他第三方选择器。
- Element Plus 所有页面都需要的通用主题覆盖放在 `assets/element-plus/modules/`；只有单个业务组件需要的尺寸或布局覆盖放在 `component-overrides.scss`。

```scss
// 禁止：组件 scoped 样式穿透 Element Plus
.equipment-product-form {
  :deep(.el-select) {
    width: 100%;
  }
}
```

```scss
// 正确：apps/admin/src/assets/styles/modules/component-overrides.scss
.equipment-product-form {
  .el-select {
    width: 100%;
  }
}
```

迁移完成后必须使用以下命令确认目标应用不存在样式穿透：

```bash
rg ":deep\\(|::v-deep|/deep/|>>>" apps/admin
```

---

## 命名

- CSS 变量：`--color-primary`、`--color-bg-page`、`--color-text-secondary`
- CSS 类名：严格遵循 BEM 命名规范
- 页面级 Block：优先使用 `.page-<name>`
- 业务组件 Block：优先使用 `.chat-<name>`、`.im-<name>` 等业务前缀
- 基础组件 Block：优先使用 `.base-<name>`
- Element Plus 覆盖样式集中在 `src/assets/styles/modules/element-plus.scss`

---

## SCSS BEM 规范

所有 SCSS 文件必须遵循 BEM（Block Element Modifier）结构，利用 SCSS 的 `&` 嵌套语法实现。

### 命名规则

| 层级               | 格式                                            | 分隔符             | 示例                               |
| ------------------ | ----------------------------------------------- | ------------------ | ---------------------------------- |
| Block（块）        | `prefix-block`                                  | `-` 连接前缀与块名 | `.page-chat`、`.chat-message-item` |
| Element（元素）    | `block__element`                                | `__` 双下划线      | `.chat-message-item__avatar`       |
| Modifier（修饰符） | `block--modifier` 或 `block__element--modifier` | `--` 双连字符      | `.chat-message-item--active`       |

### 核心原则

1. Block 作为唯一顶层类名，一个 Block 对应一个 SCSS 根选择器。
2. Element 只能属于 Block，不能嵌套 Element（`block__el1__el2` 禁止）。
3. Element 多词用 `-` 连接，如 `__message-content`、`__action-button`。
4. Modifier 表示状态或变体，如 `--active`、`--disabled`、`--selected`。
5. 交互伪类（`:hover`、`:focus-visible`）直接嵌套在对应 Element 内部，不额外创建 Modifier。

### SCSS 写法示例

```scss
.chat-message-item {
  display: flex;
  gap: 12px;
  color: var(--color-text-primary);
  background: var(--color-bg-surface);

  &__avatar {
    width: 40px;
    height: 40px;
    flex: none;
  }

  &__content {
    min-width: 0;
    border: 1px solid var(--color-border);
  }

  &__action-button {
    color: var(--color-text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }
  }

  &--selected {
    background: var(--color-primary-suppl);
  }
}
```

### 禁止写法

```scss
// 禁止：Element 嵌套 Element
.chat-message-item {
  &__content {
    &__text {
      color: var(--color-text-primary);
    }
  }
}

// 禁止：Block 内部定义无前缀裸类名
.chat-message-item {
  .avatar {
    width: 40px;
  }
}

// 推荐：扁平 Element
.chat-message-item {
  &__content {
    color: var(--color-text-primary);
  }

  &__content-text {
    line-height: 1.6;
  }
}
```

---

## @keyframes 命名

动画关键帧使用 `block-name-action` 格式，kebab-case：

```scss
@keyframes chat-message-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
```
