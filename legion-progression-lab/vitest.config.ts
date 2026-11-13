import { defineConfig } from 'vitest/config';

// Default run: every test except the slower statistical ones (see vitest.stats.config.ts).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/stats/**', 'node_modules/**'],
    environment: 'node',
    testTimeout: 60_000,
  },
});
