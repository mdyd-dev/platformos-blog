import { type Page, expect } from '@playwright/test';
import process from 'process';

/**
 * Logs in an admin user so the dashboard (/dashboard/blog*) pages — which are
 * behind the `dashboard_access` / `instance_blog_edition` policies — can be
 * exercised by the posts/admin specs.
 *
 * Credentials come from the environment:
 *   - E2E_TEST_EMAIL    (default: admin@example.com)
 *   - E2E_TEST_PASSWORD (required)
 *
 * NOTE: the shared auth fixtures/credentials are owned by task 1.5; until they
 * are provisioned these specs are skipped (see posts.spec.ts / admin.spec.ts).
 */
export const ADMIN_EMAIL = process.env.E2E_TEST_EMAIL ?? 'admin@example.com';
export const ADMIN_PASSWORD = process.env.E2E_TEST_PASSWORD ?? '';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/log-in', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
