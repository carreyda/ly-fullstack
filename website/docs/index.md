---
pageType: home
title: LY Fullstack
description: LY Fullstack 官方文档，覆盖模块化单体全栈项目的本地启动、后台开发、API 扩展、RBAC、数据库、测试与生产部署。

hero:
  name: LY Fullstack
  text: 从工程底座到真实交付
  tagline: Vue 3 + NestJS + PostgreSQL 的模块化单体全栈方案，把通用后台、清晰边界和工程门禁一次搭好。
  image:
    src: /logo.svg
    alt: LY Fullstack
  actions:
    - theme: brand
      text: 5 分钟开始
      link: /guide/getting-started
    - theme: alt
      text: 理解项目边界
      link: /architecture/

features:
  - title: 可直接运行的管理闭环
    details: 登录、动态菜单、用户、角色、菜单、字典、公共配置和五表 RBAC 已贯通，不用从空白后台起步。
    icon: 🧩
    link: /admin/
  - title: 为真实 C 端留出空间
    details: 默认 API 提供健康检查、公共字典和公共配置，并建立继续编写业务模块时应遵守的服务端基线。
    icon: 🧭
    link: /server/public-api
  - title: 工程约束可以被验证
    details: pnpm workspace、Turborepo、架构检查、类型检查、测试和 CI 共同守住应用与共享包边界。
    icon: ✅
    link: /operations/quality-gates
  - title: 从开发走到部署
    details: Setup、Prisma migration、环境变量、安全边界、Nginx、Systemd、升级和回滚都有明确流程。
    icon: 🚀
    link: /operations/production
---

LY Fullstack 不是一套把所有业务都预先写死的“万能系统”。它先把大多数真实项目都会遇到的管理端能力、服务端边界、数据库基础和协作规范搭好，再让你根据产品需求添加自己的 C 端与业务模块。

第一次使用，请从[快速开始](/guide/getting-started)进入；准备开发功能前，先阅读[项目边界](/architecture/boundaries)。
