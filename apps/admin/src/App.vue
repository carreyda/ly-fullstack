<template>
  <el-config-provider :locale="zhCn">
    <router-view></router-view>
  </el-config-provider>
</template>

<script lang="ts" setup>
/**
 * Element Plus 默认不内置中文文案，根级 Config Provider 统一注入中文语言包，
 * 避免日期、分页、弹窗等组件在各页面重复配置 locale。
 */
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
</script>
