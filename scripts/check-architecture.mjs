import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

/**
 * 架构检查允许读取的源码扩展名
 */
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs']);

/**
 * 构建产物、依赖和自动生成源码不参与手写架构边界检查
 */
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', '.turbo', '.rsbuild', 'generated']);

/**
 * 当前仓库绝对路径
 */
const WORKSPACE_ROOT = resolve(import.meta.dirname, '..');

/**
 * 从源码中提取静态和动态模块导入路径
 *
 * 该检查只关心依赖方向，不解析 TypeScript AST。项目统一使用标准 ESM import，正则能够覆盖当前
 * 源码中的静态导入、仅副作用导入和带字符串字面量的动态导入。
 *
 * @param source 单个源码文件内容
 * @returns 文件中出现的模块导入路径
 */
const getImportSpecifiers = (source) => {
  const specifiers = [];
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  patterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  });

  return specifiers;
};

/**
 * 递归读取目录中的源码文件
 *
 * @param directory 需要扫描的绝对目录
 * @returns 目录下全部源码文件绝对路径
 */
const getSourceFiles = (directory) => {
  const files = [];

  readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        return;
      }

      files.push(...getSourceFiles(entryPath));
      return;
    }

    if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(entryPath);
    }
  });

  return files;
};

/**
 * 递归读取目录中的全部文件
 *
 * @param directory 需要扫描的绝对目录
 * @returns 排除依赖、构建目录和生成目录后的全部文件绝对路径
 */
const getFiles = (directory) => {
  const files = [];

  readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        return;
      }

      files.push(...getFiles(entryPath));
      return;
    }

    files.push(entryPath);
  });

  return files;
};

/**
 * 将绝对路径转换为跨平台、便于 CI 展示的仓库相对路径
 *
 * @param filePath 源码文件绝对路径
 * @returns 使用正斜杠的仓库相对路径
 */
const getWorkspacePath = (filePath) => relative(WORKSPACE_ROOT, filePath).split(sep).join('/');

/**
 * 判断模块路径是否属于给定应用内目录
 *
 * @param specifier ESM 模块路径
 * @param directories 不允许依赖的 `@/` 一级目录
 * @returns 命中任意目录时返回 true
 */
const importsAdminDirectory = (specifier, directories) => {
  return directories.some((directory) => specifier === `@/${directory}` || specifier.startsWith(`@/${directory}/`));
};

/**
 * 架构违规记录
 */
const violations = [];

/**
 * 记录单个依赖方向违规
 *
 * @param filePath 违规文件绝对路径
 * @param specifier 违规导入路径
 * @param reason 对应架构边界说明
 */
const reportViolation = (filePath, specifier, reason) => {
  violations.push(`${getWorkspacePath(filePath)} -> ${specifier}: ${reason}`);
};

const adminSourceRoot = join(WORKSPACE_ROOT, 'apps', 'admin', 'src');
getSourceFiles(adminSourceRoot).forEach((filePath) => {
  const workspacePath = getWorkspacePath(filePath);
  const source = readFileSync(filePath, 'utf8');
  const specifiers = getImportSpecifiers(source);

  if (workspacePath.includes('/hooks/')) {
    violations.push(`${workspacePath}: Vue 组合式逻辑目录统一命名为 composables，禁止重新创建 hooks`);
  }

  if (workspacePath === 'apps/admin/src/setup.ts') {
    violations.push(`${workspacePath}: 应用启动装配统一维护在 bootstrap 目录，禁止重新创建根 setup.ts`);
  }

  if (
    workspacePath !== 'apps/admin/src/components/base/base-empty-state/index.vue' &&
    /<el-empty\b|<ElEmpty\b/.test(source)
  ) {
    violations.push(`${workspacePath}: 业务空状态统一使用 BaseEmptyState，禁止直接使用 el-empty`);
  }

  specifiers.forEach((specifier) => {
    if (specifier === '@repo/database' || specifier.startsWith('@repo/database/')) {
      reportViolation(filePath, specifier, '浏览器应用不得依赖 Prisma 或数据库包');
    }

    if (specifier.startsWith('@/navigation/') || specifier.startsWith('@/feedback/')) {
      reportViolation(filePath, specifier, 'navigation 与 feedback 必须从目录 barrel 入口导入');
    }

    if (workspacePath.startsWith('apps/admin/src/utils/')) {
      const forbiddenPackages = ['vue', 'vue-router', 'pinia', 'element-plus', '@lucide/vue'];
      const forbiddenDirectories = [
        'api',
        'components',
        'feedback',
        'navigation',
        'router',
        'services',
        'stores',
        'views',
      ];
      if (forbiddenPackages.includes(specifier) || importsAdminDirectory(specifier, forbiddenDirectories)) {
        reportViolation(filePath, specifier, 'utils 只能保存与框架、运行环境和业务无关的纯工具');
      }
    }

    if (workspacePath.startsWith('apps/admin/src/services/')) {
      const forbiddenPackages = ['vue', 'vue-router', 'pinia', 'element-plus', '@lucide/vue'];
      const forbiddenDirectories = ['components', 'feedback', 'router', 'stores', 'views'];
      if (forbiddenPackages.includes(specifier) || importsAdminDirectory(specifier, forbiddenDirectories)) {
        reportViolation(filePath, specifier, 'services 必须通过注入协议使用 UI、Router 和 Store');
      }
    }

    if (workspacePath.startsWith('apps/admin/src/components/base/')) {
      const forbiddenDirectories = ['api', 'navigation', 'router', 'stores', 'views'];
      if (importsAdminDirectory(specifier, forbiddenDirectories)) {
        reportViolation(filePath, specifier, '基础组件不得依赖业务接口、导航、路由或业务状态');
      }
    }

    if (workspacePath.startsWith('apps/admin/src/composables/') && importsAdminDirectory(specifier, ['api'])) {
      reportViolation(filePath, specifier, '调用业务接口的 Composable 应放到对应页面附近');
    }
  });
});

const serverApplicationRoots = ['admin-api', 'api'].map((name) => join(WORKSPACE_ROOT, 'apps', name, 'src'));
serverApplicationRoots.forEach((serverSourceRoot) => {
  getSourceFiles(serverSourceRoot).forEach((filePath) => {
    getImportSpecifiers(readFileSync(filePath, 'utf8')).forEach((specifier) => {
      if (
        specifier === '@repo/shared' ||
        specifier === '@repo/shared/utils' ||
        specifier.startsWith('@repo/shared/utils/')
      ) {
        reportViolation(filePath, specifier, 'NestJS 服务只能从 @repo/shared/types 导入跨端类型');
      }
    });
  });
});

const packagesRoot = join(WORKSPACE_ROOT, 'packages');
getFiles(packagesRoot).forEach((filePath) => {
  const workspacePath = getWorkspacePath(filePath);
  if (/(?:\.d\.ts|\.d\.ts\.map|\.js|\.js\.map)$/.test(workspacePath)) {
    violations.push(`${workspacePath}: packages 手写目录禁止出现 TypeScript 编译产物，构建结果只能写入 dist`);
  }
});

getSourceFiles(packagesRoot).forEach((filePath) => {
  getImportSpecifiers(readFileSync(filePath, 'utf8')).forEach((specifier) => {
    if (specifier.startsWith('@/') || specifier.startsWith('apps/')) {
      reportViolation(filePath, specifier, 'packages 不得反向依赖任何应用源码');
    }
  });
});

if (violations.length) {
  console.error('架构边界检查失败：');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exitCode = 1;
} else {
  console.log('架构边界检查通过。');
}
