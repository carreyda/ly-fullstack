<template>
  <display-result-page
    variant="server-error"
    title="服务暂时无法响应"
    description="请求已经到达系统，但服务在处理过程中遇到了异常。你可以稍后重试，或先返回工作台。"
    code="500"
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
