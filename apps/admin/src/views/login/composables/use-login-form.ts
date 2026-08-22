import Cookies from 'js-cookie';
import { COOKIE_ADMIN_CREDENTIALS_KEY } from '@/constants';
import { useAuthStore } from '@/stores';
import { showSuccessMessage, showWarningMessage } from '@/feedback';
import type { FormInstance, FormRules } from 'element-plus';
import type { AdminLoginParams } from '@repo/shared/types';

const REMEMBER_CREDENTIALS_COOKIE_OPTIONS = {
  expires: 30,
  path: '/',
  sameSite: 'lax',
  secure: window.location.protocol === 'https:',
} as const;

/**
 * 校验 Cookie 中的登录凭据
 *
 * Cookie 内容属于浏览器侧不可信输入，回填表单前必须检查对象结构和字段类型；无效内容由调用方删除。
 *
 * @param raw Cookie 中保存的 JSON 字符串
 * @returns 可安全回填登录表单的管理员账号密码
 */
const parseRememberedCredentials = (raw: string): AdminLoginParams => {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('登录凭据格式无效');
  }

  const credentials = parsed as Record<string, unknown>;
  if (typeof credentials.username !== 'string' || typeof credentials.password !== 'string') {
    throw new Error('登录凭据字段无效');
  }

  return {
    username: credentials.username,
    password: credentials.password,
  };
};

/**
 * 管理登录页的凭据记忆、表单校验、认证请求和登录后回跳
 *
 * 页面组件只负责渲染表单和主题按钮。本 Composable 使用 Cookie 保存用户主动勾选的账号密码，避免
 * 版本更新清理本地缓存时丢失；登录成功后恢复用户原本想访问的站内地址，失败提示交给 Axios 拦截器。
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
   * 用户是否选择在当前浏览器中记住管理员账号密码
   */
  const rememberCredentials = ref(false);

  /**
   * 当前账号密码是否已经完成本次滑块验证
   */
  const captchaVerified = ref(false);

  /**
   * 登录表单输入；只在当前页面内存中保存，密码不会进入 Pinia 持久化状态
   */
  const formModel = reactive<AdminLoginParams>({
    username: '',
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
   * 从 Cookie 恢复用户主动保存的管理员账号密码
   *
   * 解析失败说明 Cookie 已损坏或被手动修改，直接删除并保持空表单，避免异常内容影响登录页初始化。
   */
  const restoreRememberedCredentials = (): void => {
    const storedCredentials = Cookies.get(COOKIE_ADMIN_CREDENTIALS_KEY);
    if (!storedCredentials) {
      return;
    }

    try {
      const credentials = parseRememberedCredentials(storedCredentials);
      formModel.username = credentials.username;
      formModel.password = credentials.password;
      rememberCredentials.value = true;
    } catch {
      Cookies.remove(COOKIE_ADMIN_CREDENTIALS_KEY, REMEMBER_CREDENTIALS_COOKIE_OPTIONS);
    }
  };

  /**
   * 在登录成功后同步记住账号密码的 Cookie
   *
   * Cookie 保存 30 天且只允许同站请求携带。该功能按产品需求保存明文凭据，不使用 Base64 伪装加密；
   * 未勾选时删除历史 Cookie，确保用户可以主动撤销记忆。
   */
  const persistRememberedCredentials = (): void => {
    if (!rememberCredentials.value) {
      Cookies.remove(COOKIE_ADMIN_CREDENTIALS_KEY, REMEMBER_CREDENTIALS_COOKIE_OPTIONS);
      return;
    }

    Cookies.set(COOKIE_ADMIN_CREDENTIALS_KEY, JSON.stringify(formModel), REMEMBER_CREDENTIALS_COOKIE_OPTIONS);
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

    if (!captchaVerified.value) {
      showWarningMessage('请先完成滑块验证');
      return;
    }

    submitting.value = true;
    try {
      await authStore.login(formModel);
      persistRememberedCredentials();
      showSuccessMessage('登录成功');
      await router.replace(getRedirectTarget());
    } catch {
      // Axios 响应拦截器已经展示后端错误，页面只保留当前输入并恢复提交状态。
      captchaVerified.value = false;
    } finally {
      submitting.value = false;
    }
  };

  /**
   * 账号或密码变化后撤销已经完成的本地验证，避免一份验证状态跨登录凭据复用。
   */
  watch(
    () => [formModel.username, formModel.password],
    () => {
      captchaVerified.value = false;
    },
  );

  onMounted(restoreRememberedCredentials);

  return {
    formRef,
    formModel,
    formRules,
    captchaVerified,
    rememberCredentials,
    submitting,
    handleLogin,
  };
};
