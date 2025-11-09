import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for API tests only
 * Does not require frontend server
 */
export default defineConfig({
  testDir: './tests/api',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-api' }],
    ['junit', { outputFile: 'test-results/junit-api.xml' }]
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'api-tests',
    },
  ],

  // Only start backend for API tests
  webServer: {
    command: 'npm run dev:backend',
    url: 'http://localhost:3000/health',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
