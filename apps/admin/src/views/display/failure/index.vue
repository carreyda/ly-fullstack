<template>
  <display-result-page
    variant="failure"
    title="提交失败"
    description="请核对并修改以下信息后，再重新提交。"
    detail-title="您提交的内容有如下错误："
    :detail-list="FAILURE_DETAILS"
    primary-text="返回修改"
    secondary-text="查看"
    @primary="handleBack"
    @secondary="handleDashboard"
  />
</template>

<script setup lang="ts">
import DisplayResultPage from '../components/display-result-page/index.vue';

/**
 * 失败结果的演示详情。
 */
const FAILURE_DETAILS = ['您的账户已被冻结', '您的账户还不具备申请资格'];

/**
 * 当前路由实例。
 */
const router = useRouter();

/**
 * 返回上一页。
 */
const handleBack = (): void => {
  router.back();
};

/**
 * 返回工作台查看业务数据。
 */
const handleDashboard = (): void => {
  void router.push({ name: 'dashboard' });
};
</script>
