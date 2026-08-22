# 工程配置规范

## Prettier

```json
{
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "printWidth": 120,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## ESLint 9 Flat Config

核心配置：

- 基础：TypeScript recommended + Vue recommended
- `vue/multi-word-component-names: off`
- `@typescript-eslint/no-explicit-any: warn`
- `vue/multi-word-component-names: off`
- `vue/no-mutating-props: off`
- `@typescript-eslint/no-unused-vars: off`

---

## Git 提交规范

Conventional Commits：`type(scope?): subject`

```
feat(auth): 添加手机号登录功能
fix(chat): 修复消息列表滚动异常
refactor(services): 重构 Axios 拦截器
```

支持的 type：

- `feat` — 新功能
- `fix` — 修复 bug
- `docs` — 文档
- `style` — 代码格式（不影响功能）
- `refactor` — 重构
- `perf` — 性能优化
- `test` — 测试
- `build` — 构建相关
- `ci` — CI 配置
- `chore` — 杂项
- `revert` — 回滚

工具链：Husky + commitlint + lint-staged

- 提交前只对暂存的 `src/**/*.{ts,vue}` 运行 ESLint 增量检查，禁止在 pre-commit 中执行 `eslint .` 全量检查。
- pre-commit 使用 `lint-staged --no-stash --quiet`，避免迁移期大量工作区改动时被 lint-staged 自动 backup stash 拖慢；提交前尽量按小块整文件暂存，避免同一文件只暂存部分 hunks。
- commit-msg 使用 `pnpm exec commitlint --edit "$1"`，不要使用 `npx`，避免每次提交额外解析包执行入口。
- 手动全量修复仍使用 `pnpm run lint`。

---

## 架构边界与 CI

- `pnpm check:architecture` 检查 apps/packages 依赖方向、Admin utils 纯度、服务层依赖倒置和基础组件边界。
- 修改目录边界、别名或跨包依赖时，必须同步维护 `scripts/check-architecture.mjs`，不能只更新文字规则。
- `pnpm check` 必须依次通过架构检查、类型检查、ESLint、Prettier、测试和构建，禁止吞掉任一失败码。
- Admin 的 `.env.development`、`.env.test` 与 `.env.production` 只允许保存会进入浏览器产物的公开构建配置，均应提交仓库；Setup 只校验 development 的 API 端口。任何密钥都必须留在服务端环境。
- `.github/workflows/ci.yml` 在 main 分支推送和 Pull Request 上执行 `pnpm check`，本地 Husky 不能替代远端门禁。
- 开源仓库不得以“本地运行过”为合并依据；只有 CI 全绿才表示当前提交满足工程基线。

---

## EditorConfig

```ini
root = true

[*]
indent_style = space
indent_size = 2
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

---

## 路径别名

各前端子包统一 `@/*` 指向当前子包的 `src/*`：

| 位置                       | 配置方式                | 目标                  |
| -------------------------- | ----------------------- | --------------------- |
| `apps/*/tsconfig.json`     | `compilerOptions.paths` | `"@/*": ["./src/*"]`  |
| `apps/admin/build/`        | Rsbuild `resolve.alias` | `@ -> apps/admin/src` |
| `packages/*/tsconfig.json` | workspace paths         | `@repo/*` workspace   |

未来主站的别名配置跟随最终选定的构建框架，不提前固化为 Nuxt 或其他方案。

---

## Node / pnpm 版本

- Node >= 22
- pnpm >= 11 < 12，即限定 pnpm 11.x
- 当前项目是 pnpm workspace monorepo，`pnpm-workspace.yaml` 负责声明 `apps/*` 和 `packages/*`
- `verifyDepsBeforeRun: error` 禁止 `pnpm run` / `pnpm exec` 在依赖过期时隐式执行安装；修改依赖后必须先显式运行 `pnpm install`，避免多个开发任务并发改写同一份 `node_modules`
