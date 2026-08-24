<template>
  <main class="login-page">
    <section class="login-page__visual">
      <div class="login-page__visual-content">
        <div class="login-page__brand">
          <img src="@/assets/images/logo.svg" alt="" />
          <span>LY Fullstack</span>
        </div>

        <div class="login-page__visual-main">
          <img class="login-page__visual-machine" :src="loginVisualMachine" alt="" />

          <div class="login-page__visual-copy">
            <span>全栈管理系统基础框架</span>
            <h1>面向真实项目的全栈管理底座</h1>
            <p>Vue 3 · NestJS · PostgreSQL</p>
          </div>
        </div>
      </div>

      <div class="login-page__decorations" aria-hidden="true">
        <i class="login-page__decoration login-page__decoration--circle-outline"></i>
        <i class="login-page__decoration login-page__decoration--square-left"></i>
        <i class="login-page__decoration login-page__decoration--circle-small"></i>
        <i class="login-page__decoration login-page__decoration--square-bottom"></i>
        <i class="login-page__decoration login-page__decoration--bubble"></i>
        <i class="login-page__decoration login-page__decoration--dot-top-left"></i>
        <i class="login-page__decoration login-page__decoration--dot-top-right"></i>
        <i class="login-page__decoration login-page__decoration--dot-center-right"></i>

        <div class="login-page__decoration-group">
          <i class="login-page__decoration login-page__decoration--group-small"></i>
          <i class="login-page__decoration login-page__decoration--group-large"></i>
          <i class="login-page__decoration login-page__decoration--group-accent"></i>
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

            <div class="login-page__remember">
              <el-checkbox v-model="rememberUsername">记住账号</el-checkbox>
            </div>

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

    <login-captcha-dialog ref="loginCaptchaDialogRef" @success="handleCaptchaSuccess" />
  </main>
</template>

<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue';
import loginVisualMachine from '@/assets/images/login-visual-machine.png';
import { useTheme } from '@/composables/use-theme';
import LoginCaptchaDialog from './components/login-captcha-dialog/index.vue';
import { useLoginForm } from './composables/use-login-form';

/**
 * 页面层只装配主题交互和登录表单能力，不直接持有认证请求与路由跳转细节。
 */
const { isDarkTheme, toggleTheme: toggleAppTheme } = useTheme();
const loginCaptchaDialogRef = useTemplateRef<InstanceType<typeof LoginCaptchaDialog>>('loginCaptchaDialogRef');
const { formRef, formModel, formRules, rememberUsername, submitting, handleLogin, handleCaptchaSuccess } = useLoginForm(
  () => loginCaptchaDialogRef.value?.open(),
);

/**
 * 主题按钮面向下一次切换目标的无障碍说明
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
