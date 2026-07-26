import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/settings';
import { loginAsAdmin, ADMIN_PASSWORD } from './helpers/login';

/**
 * Blog settings update against records (task 1.4) — the plain-form replacement
 * for the legacy `settingsTest`.
 *
 * Requires an authenticated admin; skips when E2E_TEST_PASSWORD is unset
 * (shared auth fixtures provisioned in task 1.5).
 */
test.describe('Dashboard blog settings', () => {
  test.skip(!ADMIN_PASSWORD, 'requires admin credentials (E2E_TEST_PASSWORD) — provisioned in task 1.5');

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('updates the blog subtitle and persists it', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();

    const subtitle = `Updated subtitle ${Date.now()}`;
    await settings.save({ subtitle });

    // reload and confirm the value persisted to the record
    await settings.open();
    await settings.expectFieldValue('blog-settings-subtitle', subtitle);
  });

  test('shows a validation error when the title is cleared', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();
    await settings.form.fill({ title: '' });
    await settings.form.submitButton().click();
    await expect(page.locator('.pos-form-error').first()).toBeVisible();
  });
});
