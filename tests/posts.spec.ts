import { test, expect } from '@playwright/test';
import { PostsAdminPage } from './pages/postsAdmin';
import { loginAsAdmin, ADMIN_PASSWORD } from './helpers/login';

/**
 * Posts CRUD against records (task 1.4) — the plain-form replacement for the
 * legacy Forms/customizations `addPostTest`.
 *
 * Requires an authenticated admin; the shared auth credentials/fixtures are
 * provisioned by task 1.5, so the suite skips when E2E_TEST_PASSWORD is unset.
 */
test.describe('Dashboard posts CRUD', () => {
  test.skip(!ADMIN_PASSWORD, 'requires admin credentials (E2E_TEST_PASSWORD) — provisioned in task 1.5');

  const unique = `${Date.now()}`;
  const title = `E2E Post ${unique}`;
  const renamed = `E2E Post Renamed ${unique}`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('create, edit and delete a post end-to-end', async ({ page }) => {
    const admin = new PostsAdminPage(page);

    // create
    const form = await admin.gotoNewPost();
    await form.fillAndSubmit({
      title,
      content: 'Hello **markdown** body from e2e.',
      excerpt: 'An e2e excerpt',
      author_name: 'E2E Bot',
      tags: 'e2e, playwright',
      publish_now: true,
    });
    await expect(page).toHaveURL(/\/dashboard\/blog/);
    await admin.expectPostListed(title);

    // edit
    const editForm = await admin.editPost(title);
    await expect(editForm.form.getByTestId('blog-post-title')).toHaveValue(title);
    await editForm.fill({ title: renamed });
    await editForm.submitButton().click();
    await expect(page).toHaveURL(/\/dashboard\/blog/);
    await admin.expectPostListed(renamed);

    // delete
    await admin.deletePost(renamed);
    await admin.expectPostNotListed(renamed);
  });

  test('shows validation errors when required fields are missing', async ({ page }) => {
    const admin = new PostsAdminPage(page);
    const form = await admin.gotoNewPost();
    await form.submitButton().click();
    // stays on the create handler and surfaces a validation error
    await expect(form.form).toBeVisible();
    await expect(page.locator('.pos-form-error').first()).toBeVisible();
  });
});
