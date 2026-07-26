import { test, expect } from '@playwright/test';
import { LoginPage, RegistrationPage, EditProfilePage, RecoverPasswordPage, AuthHeader } from './pages/auth';

/**
 * End-to-end auth flows for the blog-module pages rebuilt on pos-module-user
 * (task 1.5): register -> auto-login -> log out -> log in -> edit profile,
 * plus negative login and the password-reset request page.
 *
 * The suite is serial: later tests reuse the account created in the first one.
 */
const unique = Date.now();
const EMAIL = `e2e-auth-${unique}@example.com`;
const PASSWORD = `E2e-pass-${unique}!`;
const FIRST_NAME = `E2E${unique}`;
const LAST_NAME = 'Auth';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication', () => {
  test('registers a new user and auto-logs them in', async ({ page }) => {
    const registration = new RegistrationPage(page);
    await registration.register({ first_name: FIRST_NAME, last_name: LAST_NAME, email: EMAIL, password: PASSWORD });

    await page.waitForURL('**/');
    const header = new AuthHeader(page);
    await header.expectLoggedIn(FIRST_NAME);
    await registration.expectNoLiquidErrors();
  });

  test('logs out and logs back in with the same credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login({ email: EMAIL, password: PASSWORD });

    const header = new AuthHeader(page);
    await header.expectLoggedIn(FIRST_NAME);

    await header.logout();
    await expect(header.userLink()).toHaveCount(0);
  });

  test('rejects a wrong password with a form error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login({ email: EMAIL, password: 'wrong-password-123' });

    await expect(page.locator('.pos-form-error').first()).toBeVisible();
    const header = new AuthHeader(page);
    await expect(header.userLink()).toHaveCount(0);
  });

  test('edits the profile names', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login({ email: EMAIL, password: PASSWORD });

    const profile = new EditProfilePage(page);
    const renamed = `${FIRST_NAME}X`;
    await profile.updateNames(renamed, LAST_NAME);

    const header = new AuthHeader(page);
    await header.expectLoggedIn(renamed);
    await expect(profile.form.locator('input[name="first_name"]')).toHaveValue(renamed);
  });

  test('redirects anonymous users from /edit-profile to the login page', async ({ page }) => {
    await page.goto('/edit-profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sessions\/new/);
  });

  test('password reset request page accepts an email', async ({ page }) => {
    const recover = new RecoverPasswordPage(page);
    await recover.requestReset(EMAIL);

    // the pos-module-user flow always redirects home with a confirmation toast
    await page.waitForURL('**/');
    await recover.expectNoLiquidErrors();
  });
});
