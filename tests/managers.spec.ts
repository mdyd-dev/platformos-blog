import { test, expect } from '@playwright/test';
import { LoginPage, RegistrationPage, AuthHeader } from './pages/auth';
import { loginAsAdmin, ADMIN_PASSWORD } from './helpers/login';

/**
 * Authorization + managers screen (task 1.8): the blog admin is gated by the
 * blog.manage permission (blog_manager role on the pos-module-user profile),
 * granted/revoked on /dashboard/managers.
 *
 * Serial: later tests reuse the non-manager account registered in the 403 test.
 */
const unique = Date.now();
const EMAIL = `e2e-manager-${unique}@example.com`;
const PASSWORD = `E2e-pass-${unique}!`;
const FIRST_NAME = `Mgr${unique}`;

const ADMIN_PAGES = ['/dashboard/blog', '/dashboard/posts/new', '/dashboard/blog/settings', '/dashboard/managers'];

test.describe.configure({ mode: 'serial' });

test.describe('Blog managers & authorization', () => {
  test.skip(!ADMIN_PASSWORD, 'requires admin credentials (E2E_TEST_PASSWORD)');

  test('anonymous visitors read the blog but are sent to login from admin pages', async ({ page }) => {
    const home = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(home?.status()).toBe(200);

    await page.goto('/dashboard/blog', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sessions\/new/);
  });

  test('a logged-in user without blog.manage is forbidden from every admin page', async ({ page }) => {
    const registration = new RegistrationPage(page);
    await registration.register({ first_name: FIRST_NAME, last_name: 'User', email: EMAIL, password: PASSWORD });
    await page.waitForURL('**/');

    for (const path of ADMIN_PAGES) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${path} should be forbidden`).toBe(403);
      await expect(page.getByText("You don't have access to this page")).toBeVisible();
    }

    // no Dashboard affordance in the public header either
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
  });

  test('a manager can grant blog.manage on the managers screen', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/managers', { waitUntil: 'domcontentloaded' });

    const row = page.locator('[data-tc="manager-row"]').filter({ hasText: EMAIL });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('manager-badge')).toHaveCount(0);

    await row.getByTestId('manager-grant').click();
    await page.waitForURL('**/dashboard/managers');
    await expect(page.locator('[data-tc="manager-row"]').filter({ hasText: EMAIL }).getByTestId('manager-badge')).toBeVisible();
  });

  test('the granted user can use the admin; after revoke they are forbidden again', async ({ page }) => {
    const login = new LoginPage(page);
    const header = new AuthHeader(page);

    await login.login({ email: EMAIL, password: PASSWORD });
    const allowed = await page.goto('/dashboard/blog', { waitUntil: 'domcontentloaded' });
    expect(allowed?.status()).toBe(200);
    await expect(page.getByRole('link', { name: 'Managers' })).toBeVisible();
    await header.logout();

    await loginAsAdmin(page);
    await page.goto('/dashboard/managers', { waitUntil: 'domcontentloaded' });
    const row = page.locator('[data-tc="manager-row"]').filter({ hasText: EMAIL });
    await row.getByTestId('manager-revoke').click();
    await page.waitForURL('**/dashboard/managers');
    await expect(page.locator('[data-tc="manager-row"]').filter({ hasText: EMAIL }).getByTestId('manager-badge')).toHaveCount(0);
    await header.logout();

    await login.login({ email: EMAIL, password: PASSWORD });
    const forbidden = await page.goto('/dashboard/blog', { waitUntil: 'domcontentloaded' });
    expect(forbidden?.status()).toBe(403);
  });

  test('a manager cannot revoke their own access', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/managers', { waitUntil: 'domcontentloaded' });

    const adminRow = page.locator('[data-tc="manager-row"]').filter({ hasText: 'admin@example.com' });
    await expect(adminRow.getByTestId('manager-badge')).toBeVisible();
    await expect(adminRow.getByTestId('manager-revoke')).toHaveCount(0);
  });
});
