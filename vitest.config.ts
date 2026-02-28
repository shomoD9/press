/*
This configuration file defines how we execute the automated checks that protect
schema integrity, compiler behavior, quality gates, and deterministic utilities.
It exists separately so test execution policy stays centralized and independent
from runtime engine modules.
*/

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
  },
});
