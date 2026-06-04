import { defineConfig, devices } from '@playwright/test';
import process from 'process';

/**
 * Playwright configuration for the platformOS Blog module.
 *
 * Mirrors the patterns used in pos-module-community:
 * - `MPKIT_URL` points at the platformOS instance under test (the `tests` env).
 * - `E2E_TEST_PASSWORD` is the shared password used by auth specs (optional until
 *   the auth suite lands in task 1.5).
 * - `data-tc` is the test-id attribute rendered in templates.
 * - Tests are grouped into projects per feature area; specs are added as each
 *   feature is rebuilt (reads → 1.3, posts → 1.4, auth → 1.5, admin → 1.8).
 */
export const PASSWORD = process.env.E2E_TEST_PASSWORD;

const URL = process.env.MPKIT_URL;
if (!URL) throw new Error('MPKIT_URL environment variable is not set');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : 3,
  timeout: 30_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: URL,
    screenshot: { mode: 'only-on-failure', fullPage: true },
    viewport: null,
    testIdAttribute: 'data-tc',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'home',
      testMatch: /home\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'reads',
      testMatch: /reads\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'posts',
      testMatch: /posts\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
