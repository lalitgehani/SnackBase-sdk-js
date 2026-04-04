import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'supabase-compat',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});
