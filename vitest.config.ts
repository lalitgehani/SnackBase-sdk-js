/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['src/react/**/*.test.tsx', 'jsdom'],
      ['**/*.test.ts', 'node'],
    ],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    css: true,
  },
});
