<template>
  <main class="login-page">
    <div class="login-page__ambient login-page__ambient--top" aria-hidden="true"></div>
    <div class="login-page__ambient login-page__ambient--bottom" aria-hidden="true"></div>

    <button class="login-page__theme" type="button" :aria-label="themeLabel" @click="toggleTheme">
      <Sun v-if="isDarkTheme" :size="18" />
      <Moon v-else :size="18" />
    </button>

    <section class="login-page__shell">
      <aside class="login-page__hero">
        <div class="login-page__brand">
          <img class="login-page__logo" src="@/assets/images/logo.svg" alt="" />
          <span>LY Fullstack</span>
        </div>

        <div class="login-page__hero-content">
          <span class="login-page__eyebrow">FULL-STACK ADMIN FOUNDATION</span>
          <h1>让工程经验，<br />真正成为 AI 的底座。</h1>
          <p>开箱即用的全栈管理系统基线，为真实 B2B 项目保留清晰、稳定、可扩展的开发边界。</p>

          <ul class="login-page__features">
            <li><CheckCircle2 :size="17" /> NestJS + PostgreSQL 五表 RBAC</li>
            <li><CheckCircle2 :size="17" /> Vue 3 + Element Plus 管理端规范</li>
            <li><CheckCircle2 :size="17" /> Monorepo、测试与 CI/CD 工程闭环</li>
          </ul>
        </div>

        <p class="login-page__hero-footer">Built for production, designed for iteration.</p>
      </aside>

      <section class="login-page__form-side">
        <div class="login-page__form-wrap">
          <div class="login-page__mobile-brand">
            <img src="@/assets/images/logo.svg" alt="" />
            <span>LY Fullstack</span>
          </div>

          <header class="login-page__heading">
            <span>欢迎回来</span>
            <h2>登录管理后台</h2>
            <p>请输入管理员账号和密码继续访问。</p>
          </header>

          <el-form
            ref="formRef"
            :model="formModel"
            :rules="formRules"
            label-position="top"
            @submit.prevent="handleLogin"
          >
            <el-form-item label="管理员账号" prop="username">
              <el-input
                v-model="formModel.username"
                autocomplete="username"
                placeholder="请输入管理员账号"
                size="large"
              >
                <template #prefix><UserRound :size="18" /></template>
              </el-input>
            </el-form-item>

            <el-form-item label="登录密码" prop="password">
              <el-input
                v-model="formModel.password"
                autocomplete="current-password"
                placeholder="请输入登录密码"
                show-password
                size="large"
                type="password"
              >
                <template #prefix><LockKeyhole :size="18" /></template>
              </el-input>
            </el-form-item>

            <el-button
              class="login-page__submit"
              :loading="submitting"
              native-type="submit"
              size="large"
              type="primary"
            >
              <span>进入管理后台</span>
              <ArrowRight v-if="!submitting" :size="18" />
            </el-button>
          </el-form>

          <p class="login-page__hint">首次使用请通过 <code>pnpm setup</code> 初始化 admin 账号。</p>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
/**
 * 主题按钮文案由当前主题实时派生，避免视图和无障碍描述出现状态分叉。
 */
import { computed } from 'vue';

/**
 * Lucide 图标用于登录表单、主题按钮和能力列表，保持登录页与后台布局的图标风格一致。
 */
import { ArrowRight, CheckCircle2, LockKeyhole, Moon, Sun, UserRound } from '@lucide/vue';

/**
 * 主题 Hook 负责全局主题切换，表单 Hook 负责校验、认证请求和登录后回跳。
 */
import { useTheme } from '@/hooks/use-theme';
import { useLoginForm } from './hooks/use-login-form';

/**
 * 引入 hooks
 *
 * 页面层只装配主题交互和登录表单能力，不直接持有认证请求与路由跳转细节。
 */
const { isDarkTheme, toggleTheme: toggleAppTheme } = useTheme();
const { formRef, formModel, formRules, submitting, handleLogin } = useLoginForm();

/**
 * 计算属性
 * 作用：为主题按钮提供与下一主题一致的无障碍说明
 */
const themeLabel = computed(() => (isDarkTheme.value ? '切换到浅色主题' : '切换到深色主题'));

/**
 * 从主题按钮中心播放现有的明暗主题扩散动画
 *
 * @param event 主题按钮点击事件，用于计算扩散动画的起点
 */
const toggleTheme = (event: MouseEvent): void => {
  void toggleAppTheme(event);
};
</script>

<style lang="scss" src="./index.scss" scoped></style>
