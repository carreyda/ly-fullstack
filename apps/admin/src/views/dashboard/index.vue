<template>
  <el-scrollbar class="dashboard-page">
    <div class="dashboard-page__content">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <section class="dashboard-page__card dashboard-page__hero">
            <div class="dashboard-page__hero-heading">
              <h1>LY Fullstack 管理后台</h1>
              <p>
                全栈 Monorepo 骨架：Rsbuild + Vue 3 管理端、NestJS + Fastify 管理 API、Prisma + PostgreSQL 数据层， 由
                pnpm workspace 与 Turborepo 统一编排。当前为工程骨架阶段，认证与业务模块将在后续阶段接入。
              </p>
            </div>
            <div class="dashboard-page__hero-meta">
              <el-tag :type="isDevelopment ? 'warning' : 'success'" effect="light" round
                >构建环境：{{ appEnvLabel }}</el-tag
              >
              <el-tag type="info" effect="plain" round>v0.1 骨架</el-tag>
            </div>
          </section>
        </el-col>

        <el-col :xs="24" :lg="8">
          <section class="dashboard-page__card dashboard-page__health" aria-live="polite">
            <div class="dashboard-page__card-heading">
              <h2>API 状态</h2>
              <el-tag :type="healthTagType" effect="light">{{ healthStatusText }}</el-tag>
            </div>

            <div
              v-loading="healthLoading"
              class="dashboard-page__health-body"
              :class="{ 'is-empty': !healthResult && !healthError }"
            >
              <template v-if="healthResult">
                <dl class="dashboard-page__health-fields">
                  <div class="dashboard-page__health-field">
                    <dt>服务</dt>
                    <dd>{{ healthResult.service }}</dd>
                  </div>
                  <div class="dashboard-page__health-field">
                    <dt>检查时间</dt>
                    <dd>{{ healthResult.timestamp }}</dd>
                  </div>
                </dl>
              </template>
              <p v-else-if="healthError" class="dashboard-page__health-error">{{ healthError }}</p>
              <p v-else class="dashboard-page__health-hint">调用 <code>GET /api/health</code> 做真实连通性检查</p>
            </div>

            <div class="dashboard-page__card-footer">
              <el-button size="small" :loading="healthLoading" :disabled="healthLoading" @click="loadHealthStatus">
                <base-icon v-if="!healthLoading" class="dashboard-page__button-icon" name="Refresh" :size="14" />
                重新检测
              </el-button>
            </div>
          </section>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :md="12" :lg="12">
          <section class="dashboard-page__card">
            <div class="dashboard-page__card-heading">
              <h2>技术栈</h2>
            </div>
            <ul class="dashboard-page__stack-list">
              <li v-for="item in stackItems" :key="item.name">
                <span class="dashboard-page__stack-name">{{ item.name }}</span>
                <span class="dashboard-page__stack-role">{{ item.role }}</span>
              </li>
            </ul>
          </section>
        </el-col>

        <el-col :xs="24" :md="12" :lg="12">
          <section class="dashboard-page__card">
            <div class="dashboard-page__card-heading">
              <h2>模块建设进度</h2>
              <span class="dashboard-page__card-note">静态项目信息</span>
            </div>
            <ul class="dashboard-page__progress-list">
              <li v-for="item in moduleProgress" :key="item.name">
                <span class="dashboard-page__progress-name">{{ item.name }}</span>
                <el-tag :type="item.status === 'done' ? 'success' : 'info'" effect="light" size="small">
                  {{ item.status === 'done' ? '已搭建' : '下一阶段' }}
                </el-tag>
              </li>
            </ul>
          </section>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :md="12" :lg="14">
          <section class="dashboard-page__card">
            <div class="dashboard-page__card-heading">
              <h2>工程命令</h2>
              <span class="dashboard-page__card-note">仓库根目录执行</span>
            </div>
            <ul class="dashboard-page__command-list">
              <li v-for="item in commandItems" :key="item.command">
                <code>{{ item.command }}</code>
                <span>{{ item.purpose }}</span>
              </li>
            </ul>
          </section>
        </el-col>

        <el-col :xs="24" :md="12" :lg="10">
          <section class="dashboard-page__card">
            <div class="dashboard-page__card-heading">
              <h2>快捷文档</h2>
              <base-icon name="Link" :size="16" />
            </div>
            <ul class="dashboard-page__doc-list">
              <li v-for="item in docLinks" :key="item.url">
                <a :href="item.url" target="_blank" rel="noopener noreferrer">
                  <span class="dashboard-page__doc-name">{{ item.name }}</span>
                  <span class="dashboard-page__doc-desc">{{ item.description }}</span>
                </a>
              </li>
            </ul>
          </section>
        </el-col>
      </el-row>

      <p class="dashboard-page__footnote">除 API 状态为真实请求外，本页其余内容为仓库静态信息，不代表运行业务数据。</p>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { getHealthStatus } from '@/api';

import type { HealthStatus } from '@/api';

/**
 * 工作台
 *
 * 本阶段只用于验证布局、视觉系统和响应式表现：卡片内容来自仓库静态信息，
 * API 状态卡通过 `GET /api/health` 做真实连通性检查。
 */

const appEnvLabel = computed(() =>
  import.meta.env.APP_ENV === 'development' ? 'development' : import.meta.env.APP_ENV,
);
const isDevelopment = computed(() => import.meta.env.APP_ENV === 'development');

const healthLoading = ref(false);
const healthResult = ref<HealthStatus | null>(null);
const healthError = ref('');

const healthStatusText = computed(() => {
  if (healthLoading.value) {
    return '检测中';
  }

  if (healthResult.value) {
    return '在线';
  }

  return healthError.value ? '离线' : '待检测';
});

const healthTagType = computed(() => {
  if (healthLoading.value) {
    return 'info';
  }

  if (healthResult.value) {
    return 'success';
  }

  return 'danger';
});

/**
 * 触发健康检查
 *
 * 离线态由本卡片自行渲染，请求层已关闭全局错误提示；loading 在 finally 中恢复，保证重复点击可用。
 */
const loadHealthStatus = async (): Promise<void> => {
  healthLoading.value = true;

  try {
    healthResult.value = await getHealthStatus();
    healthError.value = '';
  } catch {
    healthResult.value = null;
    healthError.value = '无法连接管理 API，请确认 apps/admin-api 已启动。';
  } finally {
    healthLoading.value = false;
  }
};

onMounted(() => {
  void loadHealthStatus();
});

/**
 * 技术栈概览（仓库静态信息）
 */
const stackItems = [
  { name: 'Vue 3 + TypeScript', role: '管理端视图层' },
  { name: 'Rsbuild + Rspack', role: '管理端构建链' },
  { name: 'Element Plus + SCSS', role: '组件库与样式体系' },
  { name: 'NestJS + Fastify', role: '管理 API 服务' },
  { name: 'Prisma + PostgreSQL', role: '数据访问层' },
  { name: 'pnpm workspace + Turborepo', role: '仓库编排与任务缓存' },
  { name: 'Rstest', role: '单元测试' },
  { name: 'ESLint + Prettier + Husky', role: '代码质量基线' },
] as const;

/**
 * 模块建设进度（仓库静态信息）
 */
const moduleProgress = [
  { name: 'admin 外壳与工作台', status: 'done' },
  { name: 'admin-api 基线与健康检查', status: 'done' },
  { name: 'shared 类型与工具边界', status: 'done' },
  { name: '登录与 JWT 认证', status: 'planned' },
  { name: '五表 RBAC（users / roles / menus）', status: 'planned' },
  { name: '业务 CRUD 模块', status: 'planned' },
] as const;

/**
 * 根目录工程命令（仓库静态信息）
 */
const commandItems = [
  { command: 'pnpm dev', purpose: '按 workspace 配置选择并启动应用' },
  { command: 'pnpm new:server', purpose: '生成并注册新的 NestJS 服务' },
  { command: 'pnpm dev:admin / dev:admin-api', purpose: '单独启动管理端或管理 API' },
  { command: 'pnpm typecheck', purpose: '全仓类型检查' },
  { command: 'pnpm lint', purpose: '全仓 ESLint 检查' },
  { command: 'pnpm test', purpose: 'Rstest 单元测试' },
  { command: 'pnpm build', purpose: '构建全部产物' },
  { command: 'pnpm check', purpose: 'typecheck + lint + format + test + build' },
] as const;

/**
 * 快捷文档入口（公开官方文档）
 */
const docLinks = [
  { name: 'Rsbuild', description: '管理端构建工具', url: 'https://rsbuild.rs/zh/' },
  { name: 'Turborepo', description: '任务编排与缓存', url: 'https://turborepo.com/docs' },
  { name: 'Rstest', description: '测试框架', url: 'https://rstest.rs/zh/' },
  { name: 'Element Plus', description: '组件库', url: 'https://element-plus.org/zh-CN/' },
  { name: 'NestJS', description: 'API 框架', url: 'https://docs.nestjs.com/' },
  { name: 'Prisma', description: 'ORM', url: 'https://www.prisma.io/docs' },
] as const;
</script>

<style lang="scss" scoped>
.dashboard-page {
  height: 100%;

  &__content {
    display: flex;
    max-width: 1440px;
    flex-direction: column;
    gap: 20px;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-xl);
  }
}

.dashboard-page__card {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  padding: var(--spacing-xl);
  border: 1px solid var(--card-border-color);
  border-radius: calc(var(--custom-radius) + 4px);
  background: var(--color-surface);
}

.dashboard-page__card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  h2 {
    color: var(--color-text-base);
    font-size: var(--font-size-md);
    font-weight: 600;
  }
}

.dashboard-page__card-note {
  color: var(--gray-500);
  font-size: var(--font-size-xs);
}

.dashboard-page__card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: var(--spacing-lg);
}

.dashboard-page__hero {
  gap: var(--spacing-lg);

  &-heading {
    h1 {
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-base);
      font-size: var(--font-size-xl);
      font-weight: 600;
    }

    p {
      max-width: 60ch;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      line-height: 1.7;
    }
  }

  &-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-top: auto;
  }
}

.dashboard-page__health-body {
  min-height: 88px;
  flex: 1;

  &.is-empty {
    display: flex;
    align-items: center;
  }
}

.dashboard-page__health-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  .dashboard-page__health-field {
    dt {
      margin-bottom: 2px;
      color: var(--gray-500);
      font-size: var(--font-size-xs);
    }

    dd {
      color: var(--color-text-base);
      font-size: var(--font-size-sm);
      word-break: break-all;
    }
  }
}

.dashboard-page__health-error {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.dashboard-page__health-hint {
  color: var(--gray-500);
  font-size: var(--font-size-sm);

  code {
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--color-text-secondary);
    background: var(--gray-100);
  }
}

.dashboard-page__stack-list,
.dashboard-page__progress-list,
.dashboard-page__command-list,
.dashboard-page__doc-list {
  display: flex;
  flex-direction: column;
}

.dashboard-page__stack-list {
  gap: var(--spacing-md);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--gray-100);
    font-size: var(--font-size-sm);

    &:last-child {
      padding-bottom: 0;
      border-bottom: none;
    }
  }
}

.dashboard-page__stack-name {
  color: var(--color-text-base);
  font-weight: 500;
}

.dashboard-page__stack-role {
  color: var(--gray-500);
  text-align: right;
}

.dashboard-page__progress-list {
  gap: var(--spacing-md);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    color: var(--color-text-base);
    font-size: var(--font-size-sm);
  }
}

.dashboard-page__command-list {
  gap: var(--spacing-sm);

  li {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 9px 12px;
    border-radius: calc(var(--custom-radius) / 3 + 2px);
    background: var(--color-surface-subtle);
    font-size: var(--font-size-sm);

    code {
      flex: 0 0 auto;
      min-width: 180px;
      color: var(--color-primary);
      font-size: var(--font-size-xs);
    }

    span {
      color: var(--color-text-secondary);
    }
  }
}

.dashboard-page__doc-list {
  gap: var(--spacing-sm);

  a {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--gray-100);
    border-radius: calc(var(--custom-radius) / 3 + 2px);
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      background-color var(--duration-fast) var(--ease-standard);

    &:hover {
      border-color: var(--color-primary-light-7);
      background: var(--color-primary-light-9);

      .dashboard-page__doc-name {
        color: var(--color-primary);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--focus-ring-color);
      outline-offset: 1px;
    }
  }
}

.dashboard-page__doc-name {
  color: var(--color-text-base);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.dashboard-page__doc-desc {
  color: var(--gray-500);
  font-size: var(--font-size-xs);
}

.dashboard-page__button-icon {
  margin-right: 4px;
}

.dashboard-page__footnote {
  color: var(--gray-500);
  font-size: var(--font-size-xs);
  text-align: center;
}

@media (max-width: 768px) {
  .dashboard-page__content {
    gap: 12px;
    padding: var(--spacing-sm);
  }

  .dashboard-page__card {
    padding: var(--spacing-lg);
  }

  .dashboard-page__command-list li {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;

    code {
      min-width: 0;
    }
  }
}
</style>
