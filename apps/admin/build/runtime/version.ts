import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { RsbuildPlugin } from '@rsbuild/core';

/**
 * 浏览器运行时读取的版本清单文件名
 */
export const VERSION_FILE_NAME = 'version.json';

/**
 * 管理后台构建产物的稳定应用标识
 */
const APP_NAME = 'ly-fullstack-admin';

/**
 * HTML 中记录应用名称的通用 meta 名称
 */
const META_APP_NAME = 'app-name';

/**
 * HTML 中记录当前构建号的通用 meta 名称
 */
const META_BUILD_ID = 'build-id';

/**
 * HTML 中记录构建时间的通用 meta 名称
 */
const META_BUILD_TIME = 'build-time';

/**
 * 构建阶段写入 `version.json` 的版本清单
 */
interface AppVersionManifest {
  /**
   * 当前构建所属的应用名称
   */
  appName: string;

  /**
   * 管理后台子包声明的版本号
   */
  packageVersion: string;

  /**
   * 根据最终静态资源内容计算的唯一构建标识
   */
  buildId: string;

  /**
   * 当前构建完成时的 ISO 时间
   */
  buildTime: string;

  /**
   * 当前构建使用的环境模式
   */
  env: AppEnv;
}

/**
 * Rsbuild 资产对象允许返回的源码类型
 */
type AssetSourceValue = string | Buffer;

/**
 * 读取管理后台子包版本号
 *
 * 构建命令以 `apps/admin` 为工作目录执行，因此直接读取当前目录的 `package.json`。
 * 文件缺失或未声明版本时使用 `0.0.0`，保证版本插件仍能生成可诊断的清单。
 *
 * @returns 当前管理后台的语义化版本号
 */
const readPackageVersion = (): string => {
  const packagePath = resolve(process.cwd(), 'package.json');
  if (!existsSync(packagePath)) {
    return '0.0.0';
  }

  const packageContent = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string };
  return packageContent.version || '0.0.0';
};

/**
 * 移除 HTML 中已有的版本 meta
 *
 * 计算资源摘要前必须排除上一次注入的构建信息，否则构建时间会参与哈希并导致相同源码每次得到不同 buildId。
 *
 * @param html 待处理的 HTML 内容
 * @returns 不包含版本 meta 的 HTML 内容
 */
const stripVersionMeta = (html: string): string => {
  return html.replace(
    new RegExp(`\\s*<meta\\s+name=["'](?:${META_APP_NAME}|${META_BUILD_ID}|${META_BUILD_TIME})["'][^>]*>`, 'g'),
    '',
  );
};

/**
 * 转义写入 HTML 属性的文本
 *
 * @param value 原始属性值
 * @returns 可安全写入双引号属性的文本
 */
const escapeHtmlAttribute = (value: string): string => {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/**
 * 根据最终构建资产计算稳定摘要
 *
 * `version.json`、gzip 副本和 HTML 中的版本 meta 不参与计算，避免派生文件反向影响构建号。
 * 资产名称与内容都会进入摘要，因此文件拆分或内容变化都能触发新版本。
 *
 * @param assets Rsbuild 当前阶段已经生成的全部静态资产
 * @returns 八位十六进制构建摘要
 */
const computeBuildHash = (assets: Record<string, { source: () => AssetSourceValue }>): string => {
  const hash = createHash('sha256');
  const assetNames = Object.keys(assets)
    .filter((assetName) => assetName !== VERSION_FILE_NAME && !assetName.endsWith('.gz'))
    .sort();

  assetNames.forEach((assetName) => {
    hash.update(assetName);
    const source = assets[assetName].source();
    hash.update(assetName.endsWith('.html') ? stripVersionMeta(String(source)) : source);
  });

  return hash.digest('hex').slice(0, 8);
};

/**
 * 向 HTML 注入当前构建信息
 *
 * 使用 `build-id` 等通用名称，不携带历史项目或业务品牌前缀，方便未来模板项目直接复用。
 *
 * @param html 构建生成的 HTML 内容
 * @param manifest 当前构建版本清单
 * @returns 已注入版本 meta 的 HTML 内容
 */
const injectVersionMeta = (html: string, manifest: AppVersionManifest): string => {
  const cleanHtml = stripVersionMeta(html);
  const metaContent = [
    `    <meta name="${META_APP_NAME}" content="${escapeHtmlAttribute(manifest.appName)}" />`,
    `    <meta name="${META_BUILD_ID}" content="${escapeHtmlAttribute(manifest.buildId)}" />`,
    `    <meta name="${META_BUILD_TIME}" content="${escapeHtmlAttribute(manifest.buildTime)}" />`,
  ].join('\n');

  if (cleanHtml.includes('<meta name="viewport"')) {
    return cleanHtml.replace(/(\s*<meta\s+name=["']viewport["'][^>]*>)/, `$1\n${metaContent}`);
  }

  return cleanHtml.replace(/(<head[^>]*>)/i, `$1\n${metaContent}`);
};

/**
 * 创建管理后台版本产物插件
 *
 * 构建收尾阶段会根据最终静态资源计算 buildId，并同时写入：
 * 1. `version.json`，供浏览器运行时轮询检测新版本。
 * 2. HTML meta，供当前页面记录自身已经加载的构建号。
 *
 * 插件只在 Rsbuild 的 build 阶段执行，本地开发服务器不会生成或轮询版本清单。
 *
 * @param env 当前管理后台构建环境
 * @returns 可注册到 Rsbuild 的版本插件
 */
export const createVersionPlugin = (env: AppEnv): RsbuildPlugin => {
  return {
    name: 'ly-fullstack-admin:app-version',
    apply: 'build',
    setup(api) {
      api.processAssets({ stage: 'summarize', targets: ['web'] }, ({ assets, compilation, sources }) => {
        const packageVersion = readPackageVersion();
        const buildHash = computeBuildHash(assets);
        const manifest: AppVersionManifest = {
          appName: APP_NAME,
          packageVersion,
          buildId: `${APP_NAME}@${packageVersion}:${buildHash}`,
          buildTime: new Date().toISOString(),
          env,
        };

        Object.entries(assets).forEach(([assetName, asset]) => {
          if (!assetName.endsWith('.html')) {
            return;
          }

          compilation.updateAsset(
            assetName,
            new sources.RawSource(injectVersionMeta(String(asset.source()), manifest)),
          );
        });

        const versionContent = `${JSON.stringify(manifest, null, 2)}\n`;
        if (assets[VERSION_FILE_NAME]) {
          compilation.updateAsset(VERSION_FILE_NAME, new sources.RawSource(versionContent));
          return;
        }

        compilation.emitAsset(VERSION_FILE_NAME, new sources.RawSource(versionContent));
      });
    },
  };
};
