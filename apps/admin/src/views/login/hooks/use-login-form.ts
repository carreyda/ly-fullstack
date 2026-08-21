import { reactive, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores';
import { showSuccessMessage } from '@/utils';
import type { FormInstance, FormRules } from 'element-plus';
import type { AdminLoginParams } from '@repo/shared/types';

/**
 * 管理登录页的表单校验、认证请求和登录后回跳
 *
 * 页面组件只负责渲染表单和主题按钮。本 Hook 负责调用认证 Store，并在登录成功后恢复用户原本
 * 想访问的站内地址；失败时保留当前输入，由 Axios 拦截器展示服务端错误。
 */
export const useLoginForm = () => {
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  /**
   * Element Plus 表单实例，用于提交前执行与后端 DTO 对齐的客户端校验
   */
  const formRef = useTemplateRef<FormInstance | null>('formRef');

  /**
   * 登录请求提交状态，用于阻止重复提交并驱动按钮加载反馈
   */
  const submitting = ref(false);

  /**
   * 登录表单输入；只在当前页面内存中保存，密码不会进入 Pinia 持久化状态
   */
  const formModel = reactive<AdminLoginParams>({
    username: 'admin',
    password: '',
  });

  /**
   * 与 Admin API 登录 DTO 长度约束一致的前端校验规则
   */
  const formRules: FormRules<AdminLoginParams> = {
    username: [
      { required: true, message: '请输入管理员账号', trigger: 'blur' },
      { min: 3, max: 50, message: '账号长度应为 3 到 50 个字符', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入登录密码', trigger: 'blur' },
      { min: 8, max: 72, message: '密码长度应为 8 到 72 个字符', trigger: 'blur' },
    ],
  };

  /**
   * 解析登录成功后的站内回跳地址
   *
   * 只接受以单个 `/` 开头的站内路径，拒绝协议相对地址，避免登录接口被利用为开放重定向入口。
   *
   * @returns 安全的站内目标地址；缺少或非法时返回工作台
   */
  const getRedirectTarget = (): string => {
    const redirect = route.query.redirect;
    return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/dashboard';
  };

  /**
   * 校验并提交管理员登录表单
   *
   * 成功后由 Auth Store 持久化 Token 和权限会话，再使用 replace 返回原目标页面，避免浏览器后退
   * 回到已无意义的登录页。校验或请求失败时不改变路由，提交状态始终在 finally 中恢复。
   */
  const handleLogin = async (): Promise<void> => {
    if (!formRef.value || submitting.value) {
      return;
    }

    const isValid = await formRef.value.validate().catch(() => false);
    if (!isValid) {
      return;
    }

    submitting.value = true;
    try {
      await authStore.login(formModel);
      showSuccessMessage('登录成功');
      await router.replace(getRedirectTarget());
    } catch {
      // Axios 响应拦截器已经展示后端错误，页面只保留当前输入并恢复提交状态。
    } finally {
      submitting.value = false;
    }
  };

  return {
    formRef,
    formModel,
    formRules,
    submitting,
    handleLogin,
  };
};
