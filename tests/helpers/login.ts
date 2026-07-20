import { type Page, expect } from '@playwright/test';
import process from 'process';

/**
 * Logs in an admin user so the dashboard (/dashboard/blog*) pages — which are
 * behind the `dashboard_access` / `instance_blog_edition` policies — can be
 * exercised by the posts/admin specs.
 *
 * Uses the pos-module-user built-in /sessions/new page (task 1.5). A successful
 * login redirects to the homepage, where the header shows the user widget.
 *
 * Credentials come from the environment:
 *   - E2E_TEST_EMAIL    (default: admin@example.com)
 *   - E2E_TEST_PASSWORD (required)
 */
export const ADMIN_EMAIL = process.env.E2E_TEST_EMAIL ?? 'admin@example.com';
export const ADMIN_PASSWORD = process.env.E2E_TEST_PASSWORD ?? '';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/sessions/new', { waitUntil: 'domcontentloaded' });
  await page.locator('form[action="/sessions"] input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('form[action="/sessions"] input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByTestId('header-user')).toBeVisible();
}
