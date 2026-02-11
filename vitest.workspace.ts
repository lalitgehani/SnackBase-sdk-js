import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'sdk',
      root: 'packages/sdk',
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'react',
      root: 'packages/react',
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'integration',
      root: 'packages/sdk',
      environment: 'node',
      include: ['tests/integration/**/*.test.ts'],
      setupFiles: ['tests/integration/setup.ts'],
      // Run integration tests sequentially to avoid SQLite database locking issues
      fileParallelism: false,
      // Disable test concurrency within files
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      // Ensure tests within a file run sequentially
      maxConcurrency: 1,
    },
  },
  {
    test: {
      name: 'mcp',
      root: 'packages/mcp',
      environment: 'node',
      include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    },
  },
]);
