import { defineConfig } from '@rspress/core';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 官方文档站目录
 *
 * 配置文件由仓库根脚本调用，因此全部路径都从当前文件解析，避免命令执行目录改变后误读根目录的
 * `docs/` 专题文档。`website/docs` 只承载面向使用者的站点内容。
 */
const websiteDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(websiteDirectory, 'docs'),
  outDir: resolve(websiteDirectory, 'doc_build'),
  title: 'LY Fullstack',
  description: 'LY Fullstack 官方文档：从本地初始化到业务扩展、权限设计、质量门禁与生产部署。',
  lang: 'zh',
  logo: '/logo.svg',
  logoText: 'LY Fullstack',
  icon: '/logo.svg',
  llms: true,
  themeConfig: {
    darkMode: 'auto',
    search: true,
    lastUpdated: true,
    enableAppearanceAnimation: true,
    editLink: {
      docRepoBaseUrl: 'https://github.com/liangy0323/ly-fullstack/tree/main/website/docs',
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'github-stars',
        content: 'https://github.com/liangy0323/ly-fullstack',
      },
    ],
    llmsUI: {
      placement: 'outline',
    },
    footer: {
      message: 'LY Fullstack · 面向真实交付的模块化单体全栈底座',
    },
  },
});
