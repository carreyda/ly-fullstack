<template>
  <display-result-page
    variant="success"
    title="提交成功"
    description="提交结果页用于反馈一系列操作任务的处理结果，如果仅是简单操作，使用全局消息提示反馈即可。详情区域可以展示必要的补充信息。"
    :detail-list="SUCCESS_DETAILS"
    primary-text="返回修改"
    secondary-text="查看"
    tertiary-text="打印"
    @primary="handleBack"
    @secondary="handleDashboard"
    @tertiary="handlePrint"
  />
</template>

<script setup lang="ts">
import DisplayResultPage from '../components/display-result-page/index.vue';

/**
 * 成功结果的演示详情。
 */
const SUCCESS_DETAILS = ['已提交申请，等待部门审核。'];

/**
 * 当前路由实例。
 */
const router = useRouter();

/**
 * 返回上一页继续修改。
 */
const handleBack = (): void => {
  router.back();
};

/**
 * 返回工作台查看提交结果。
 */
const handleDashboard = (): void => {
  void router.push({ name: 'dashboard' });
};

/**
 * 打印当前结果页。
 */
const handlePrint = (): void => {
  window.print();
};
</script>
