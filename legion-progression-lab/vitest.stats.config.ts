import { defineConfig } from 'vitest/config';

// Statistical tests only: fixed seeds, pre-declared significance (alpha = 0.001).
export default defineConfig({
  test: {
    include: ['test/stats/**/*.test.ts'],
    environment: 'node',
    testTimeout: 300_000,
  },
});
