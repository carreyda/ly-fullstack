<template>
  <section class="icon-showcase-page">
    <el-scrollbar class="icon-showcase-page__scrollbar">
      <div class="icon-showcase-page__content">
        <header class="icon-showcase-page__hero">
          <div>
            <h1 class="icon-showcase-page__title">简洁、统一的线性图标</h1>
            <p class="icon-showcase-page__description">
              项目已接入 @lucide/vue。这里仅展示后台常用分类，完整图标与参数说明请前往官方文档查看。
            </p>
          </div>

          <a
            class="icon-showcase-page__guide-link"
            href="https://lucide.dev/guide/"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看官方指南
            <external-link :size="16" :stroke-width="1.8" />
          </a>
        </header>

        <div class="icon-showcase-page__grid">
          <section v-for="category in ICON_CATEGORIES" :key="category.key" class="icon-showcase-page__category">
            <header class="icon-showcase-page__category-header">
              <div>
                <h2 class="icon-showcase-page__category-title">{{ category.label }}</h2>
                <p class="icon-showcase-page__category-description">{{ category.description }}</p>
              </div>
              <span class="icon-showcase-page__category-count">{{ category.iconList.length }} 个</span>
            </header>

            <div class="icon-showcase-page__icon-grid">
              <div v-for="iconItem in category.iconList" :key="iconItem.name" class="icon-showcase-page__icon-item">
                <span class="icon-showcase-page__icon-wrap" aria-hidden="true">
                  <component :is="iconItem.icon" :size="24" :stroke-width="1.7" />
                </span>
                <span class="icon-showcase-page__icon-label">{{ iconItem.label }}</span>
                <code class="icon-showcase-page__icon-name">{{ iconItem.name }}</code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </el-scrollbar>
  </section>
</template>

<script setup lang="ts">
import {
  ChartNoAxesCombined,
  CircleCheck,
  CircleX,
  Database,
  Download,
  ExternalLink,
  FileText,
  House,
  Image,
  Info,
  LayoutDashboard,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  User,
  UserRoundCog,
  Users,
} from '@lucide/vue';
import type { AdminIconCategory } from '@/types';

/**
 * 后台常用图标分类。
 *
 * 示例刻意保持精简，避免把完整 Lucide 图标清单固化到业务包中。
 */
const ICON_CATEGORIES: AdminIconCategory[] = [
  {
    key: 'navigation',
    label: '导航与布局',
    description: '适用于菜单、工作台与页面结构。',
    iconList: [
      { name: 'House', label: '首页', icon: House },
      { name: 'LayoutDashboard', label: '工作台', icon: LayoutDashboard },
      { name: 'Menu', label: '菜单', icon: Menu },
      { name: 'Search', label: '搜索', icon: Search },
    ],
  },
  {
    key: 'user-permission',
    label: '用户与权限',
    description: '适用于成员、角色与访问控制。',
    iconList: [
      { name: 'User', label: '用户', icon: User },
      { name: 'Users', label: '用户组', icon: Users },
      { name: 'UserRoundCog', label: '用户设置', icon: UserRoundCog },
      { name: 'ShieldCheck', label: '权限校验', icon: ShieldCheck },
    ],
  },
  {
    key: 'operation',
    label: '常用操作',
    description: '覆盖增删改查中的主要动作。',
    iconList: [
      { name: 'Plus', label: '新增', icon: Plus },
      { name: 'Pencil', label: '编辑', icon: Pencil },
      { name: 'Trash2', label: '删除', icon: Trash2 },
      { name: 'Download', label: '下载', icon: Download },
    ],
  },
  {
    key: 'feedback',
    label: '状态反馈',
    description: '用于结果、提醒和异常状态。',
    iconList: [
      { name: 'CircleCheck', label: '成功', icon: CircleCheck },
      { name: 'CircleX', label: '失败', icon: CircleX },
      { name: 'TriangleAlert', label: '警告', icon: TriangleAlert },
      { name: 'Info', label: '提示', icon: Info },
    ],
  },
  {
    key: 'data-content',
    label: '数据与内容',
    description: '适用于数据源、报表与素材模块。',
    iconList: [
      { name: 'Database', label: '数据库', icon: Database },
      { name: 'ChartNoAxesCombined', label: '数据图表', icon: ChartNoAxesCombined },
      { name: 'FileText', label: '文档', icon: FileText },
      { name: 'Image', label: '图片', icon: Image },
    ],
  },
];
</script>

<style lang="scss" src="./index.scss" scoped></style>
