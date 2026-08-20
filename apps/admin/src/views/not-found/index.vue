<template>
  <div class="not-found-page">
    <div class="not-found-page__panel">
      <p class="not-found-page__code" aria-hidden="true">404</p>
      <h1>页面不存在</h1>
      <p class="not-found-page__description">当前地址没有匹配的后台页面，可能已被移除或尚未建设。</p>
      <el-button type="primary" @click="handleBackDashboard">返回工作台</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();

/**
 * 返回工作台
 *
 * 使用 replace 避免用户从 404 返回时再次进入无效地址。
 */
const handleBackDashboard = async (): Promise<void> => {
  await router.replace({ name: 'Dashboard' });
};
</script>

<style lang="scss" scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--spacing-xl);
}

.not-found-page__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) calc(var(--spacing-2xl) * 2);
  border: 1px solid var(--card-border-color);
  border-radius: calc(var(--custom-radius) + 4px);
  background: var(--color-surface);
  text-align: center;
}

.not-found-page__code {
  color: var(--color-primary);
  font-size: 56px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
}

.not-found-page__panel h1 {
  color: var(--color-text-base);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.not-found-page__description {
  max-width: 40ch;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.7;
}
</style>
