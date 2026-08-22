<template>
  <display-result-page
    variant="not-found"
    title="没有找到这个页面"
    description="当前地址可能已经失效、页面被移动，或你暂时没有访问该页面的权限。"
    code="404"
    primary-text="返回工作台"
    @primary="handleDashboard"
  />
</template>

<script setup lang="ts">
import DisplayResultPage from '../components/display-result-page/index.vue';

/**
 * 当前路由实例。
 */
const router = useRouter();

/**
 * 返回工作台。
 */
const handleDashboard = (): void => {
  void router.push({ name: 'dashboard' });
};
</script>
