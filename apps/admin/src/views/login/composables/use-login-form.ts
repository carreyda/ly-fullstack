import Cookies from 'js-cookie';
import { COOKIE_ADMIN_LEGACY_CREDENTIALS_KEY, COOKIE_ADMIN_USERNAME_KEY } from '@/constants';
import { useAuthStore } from '@/stores';
import { showSuccessMessage, showWarningMessage } from '@/feedback';
import type { FormInstance, FormRules } from 'element-plus';
import type { AdminLoginParams } from '@repo/shared/types';

const REMEMBER_USERNAME_COOKIE_OPTIONS = {
  expires: 30,
  path: '/',
  sameSite: 'lax',
  secure: window.location.protocol === 'https:',
} as const;

/**
 * 校验 Cookie 中的管理员账号
 *
 * Cookie 内容属于浏览器侧不可信输入，回填表单前必须再次校验长度；无效内容由调用方删除。
 *
 * @param raw Cookie 中保存的管理员账号
 * @returns 可安全回填登录表单的管理员账号；无效时返回 `undefined`
 */
const parseRememberedUsername = (raw: string): string | undefined => {
  const username = raw.trim();
  return username.length >= 3 && username.length <= 50 ? username : undefined;
};

/**
 * 管理登录页的凭据记忆、表单校验、认证请求和登录后回跳
 *
 * 页面组件只负责渲染表单和主题按钮。本 Composable 使用 Cookie 保存用户主动勾选的账号，避免
 * 版本更新清理本地缓存时丢失；密码不进入 Cookie，登录成功后恢复用户原本想访问的站内地址。
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
   * 用户是否选择在当前浏览器中记住管理员账号
   */
  const rememberUsername = ref(false);

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
   * 从 Cookie 恢复用户主动保存的管理员账号
   *
   * 初始化时同时删除历史版本保存明文账号密码的 Cookie。新 Cookie 只回填账号，密码仍由用户输入或
   * 浏览器密码管理器提供。
   */
  const restoreRememberedUsername = (): void => {
    Cookies.remove(COOKIE_ADMIN_LEGACY_CREDENTIALS_KEY, { path: '/' });

    const storedUsername = Cookies.get(COOKIE_ADMIN_USERNAME_KEY);
    if (!storedUsername) {
      return;
    }

    const username = parseRememberedUsername(storedUsername);
    if (!username) {
      Cookies.remove(COOKIE_ADMIN_USERNAME_KEY, { path: '/' });
      return;
    }

    formModel.username = username;
    rememberUsername.value = true;
  };

  /**
   * 在登录成功后同步记住账号的 Cookie
   *
   * Cookie 保存 30 天且只允许同站请求携带。密码绝不写入 Cookie；未勾选时删除历史账号 Cookie，
   * 确保用户可以主动撤销记忆。
   */
  const persistRememberedUsername = (): void => {
    if (!rememberUsername.value) {
      Cookies.remove(COOKIE_ADMIN_USERNAME_KEY, { path: '/' });
      return;
    }

    Cookies.set(COOKIE_ADMIN_USERNAME_KEY, formModel.username.trim(), REMEMBER_USERNAME_COOKIE_OPTIONS);
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
      persistRememberedUsername();
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

  onMounted(restoreRememberedUsername);

  return {
    formRef,
    formModel,
    formRules,
    captchaVerified,
    rememberUsername,
    submitting,
    handleLogin,
  };
};
