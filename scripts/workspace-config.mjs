/**
 * LY Fullstack workspace 配置读取与校验
 *
 * 根配置只描述跨应用工具需要的路径、包名、本地端口和健康检查地址。运行时应用不得直接依赖该文件，
 * 本地启动器会把端口转换为进程环境变量，生产部署仍由平台注入实际配置。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const APP_PATH_PATTERN = /^apps\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const PACKAGE_NAME_PATTERN = /^@repo\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const APP_KINDS = ['web', 'server'];

/**
 * 判断值是否为普通对象。
 */
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * 抛出带字段路径的配置错误。
 */
const failConfig = (field, message) => {
  throw new Error(`workspace.config.json 配置错误：${field} ${message}`);
};

/**
 * 拒绝配置对象中未声明的字段，避免拼写错误被工具静默忽略。
 */
const assertAllowedKeys = (field, value, allowedKeys) => {
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    failConfig(field, `包含未知字段 ${unknownKeys.join('、')}`);
  }
};

/**
 * 校验单个应用注册项。
 */
const validateApplication = (kind, name, app, usedValues) => {
  const field = `apps.${kind}.${name}`;

  if (!APP_NAME_PATTERN.test(name)) {
    failConfig(field, '名称必须使用 kebab-case');
  }
  if (!isRecord(app)) {
    failConfig(field, '必须是对象');
  }
  assertAllowedKeys(
    field,
    app,
    kind === 'server' ? ['path', 'packageName', 'localPort', 'healthPath'] : ['path', 'packageName', 'localPort'],
  );
  if (!APP_PATH_PATTERN.test(app.path ?? '')) {
    failConfig(`${field}.path`, '必须是 apps/<kebab-case-name>');
  }
  if (app.path !== `apps/${name}`) {
    failConfig(`${field}.path`, `必须与应用名称保持一致：apps/${name}`);
  }
  if (!PACKAGE_NAME_PATTERN.test(app.packageName ?? '')) {
    failConfig(`${field}.packageName`, '必须是 @repo/<kebab-case-name>');
  }
  if (app.packageName !== `@repo/${name}`) {
    failConfig(`${field}.packageName`, `必须与应用名称保持一致：@repo/${name}`);
  }
  if (!Number.isInteger(app.localPort) || app.localPort < 1 || app.localPort > 65_535) {
    failConfig(`${field}.localPort`, '必须是 1 到 65535 之间的整数');
  }
  if (kind === 'server' && (typeof app.healthPath !== 'string' || !app.healthPath.startsWith('/'))) {
    failConfig(`${field}.healthPath`, '必须是以 / 开头的路径');
  }

  for (const [key, value] of [
    ['path', app.path],
    ['packageName', app.packageName],
    ['localPort', app.localPort],
  ]) {
    const previousField = usedValues[key].get(value);
    if (previousField) {
      failConfig(`${field}.${key}`, `与 ${previousField} 重复`);
    }
    usedValues[key].set(value, `${field}.${key}`);
  }
};

/**
 * 校验并返回 workspace 配置。
 *
 * @param config 从 JSON 解析得到的未知配置
 */
export const validateWorkspaceConfig = (config) => {
  if (!isRecord(config)) {
    failConfig('root', '必须是对象');
  }
  assertAllowedKeys('root', config, ['$schema', 'schemaVersion', 'apps']);
  if (config.schemaVersion !== 1) {
    failConfig('schemaVersion', '当前只支持版本 1');
  }
  if (!isRecord(config.apps)) {
    failConfig('apps', '必须是对象');
  }
  assertAllowedKeys('apps', config.apps, APP_KINDS);

  const usedValues = {
    path: new Map(),
    packageName: new Map(),
    localPort: new Map(),
  };

  for (const kind of APP_KINDS) {
    const applications = config.apps[kind];
    if (!isRecord(applications)) {
      failConfig(`apps.${kind}`, '必须是对象');
    }

    for (const [name, app] of Object.entries(applications)) {
      validateApplication(kind, name, app, usedValues);
    }
  }

  return config;
};

/**
 * 从仓库根目录读取 workspace 配置。
 */
export const readWorkspaceConfig = (repoRoot) => {
  const configPath = resolve(repoRoot, 'workspace.config.json');
  const content = readFileSync(configPath, 'utf-8');

  return validateWorkspaceConfig(JSON.parse(content));
};

/**
 * 把分组配置转换为启动器和生成器使用的应用列表。
 */
export const getWorkspaceApplications = (config) => {
  return APP_KINDS.flatMap((kind) => {
    return Object.entries(config.apps[kind]).map(([name, app]) => ({
      ...app,
      name,
      kind,
    }));
  });
};

/**
 * 按稳定格式写回 workspace 配置。
 *
 * @param repoRoot 仓库根目录
 * @param config 已更新且通过校验的配置
 */
export const writeWorkspaceConfig = (repoRoot, config) => {
  validateWorkspaceConfig(config);
  const configPath = resolve(repoRoot, 'workspace.config.json');
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
};
