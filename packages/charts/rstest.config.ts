import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
});
