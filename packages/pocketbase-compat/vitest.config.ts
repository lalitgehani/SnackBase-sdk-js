import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'pocketbase-compat',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
