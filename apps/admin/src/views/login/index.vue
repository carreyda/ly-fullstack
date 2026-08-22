<template>
  <main class="login-page">
    <section class="login-page__visual">
      <div class="login-page__visual-content">
        <div class="login-page__brand">
          <img src="@/assets/images/logo.svg" alt="" />
          <span>LY Fullstack</span>
        </div>

        <div class="login-page__visual-main">
          <login-visual-machine class="login-page__visual-machine" />

          <div class="login-page__visual-copy">
            <span>全栈管理系统基础框架</span>
            <h1>面向真实项目的全栈管理底座</h1>
            <p>Vue 3 · NestJS · PostgreSQL</p>
          </div>
        </div>
      </div>
    </section>

    <section class="login-page__content">
      <button class="login-page__theme" type="button" :aria-label="themeLabel" @click="toggleTheme">
        <Sun v-if="isDarkTheme" :size="18" />
        <Moon v-else :size="18" />
      </button>

      <div class="login-page__form-stage">
        <div class="login-page__mobile-brand">
          <img src="@/assets/images/logo.svg" alt="" />
          <span>LY Fullstack</span>
        </div>

        <header class="login-page__heading">
          <h2>欢迎登录</h2>
          <p>进入 LY Fullstack 管理后台</p>
        </header>

        <div class="login-page__card">
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
              />
            </el-form-item>

            <el-form-item label="登录密码" prop="password">
              <el-input
                v-model="formModel.password"
                autocomplete="current-password"
                placeholder="请输入登录密码"
                show-password
                size="large"
                type="password"
              />
            </el-form-item>

            <slide-verify v-model="captchaVerified" class="login-page__verification" :disabled="submitting" />

            <el-button
              class="login-page__submit"
              :loading="submitting"
              native-type="submit"
              size="large"
              type="primary"
            >
              登录
            </el-button>
          </el-form>
        </div>
      </div>

      <p class="login-page__copyright">LY Fullstack · Admin Foundation</p>
    </section>
  </main>
</template>

<script setup lang="ts">
/**
 * 导入 Vue 模块
 *
 * 主题按钮文案由当前主题实时派生，避免视图和无障碍描述出现状态分叉。
 */
import { computed } from 'vue';

/**
 * 导入图标组件
 *
 * 登录页只保留主题切换图标，表单本身使用克制的文字层级，避免装饰元素干扰输入。
 */
import { Moon, Sun } from '@lucide/vue';

/**
 * 导入 hooks
 *
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
const { formRef, formModel, formRules, captchaVerified, submitting, handleLogin } = useLoginForm();

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
