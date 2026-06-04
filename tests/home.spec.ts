import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home';

/**
 * Smoke coverage for the public blog home page.
 *
 * This is the first spec of the Playwright suite that replaces the legacy
 * TestCafe tests. It asserts the home page renders without Liquid errors and
 * shows the core layout (heading + footer). Feature-specific specs (reads,
 * posts, auth, admin) are added as those areas are rebuilt.
 */
test.describe('Blog home page', () => {
  test('renders without Liquid errors', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.expectNoLiquidErrors();
  });

  test('shows the blog heading and footer', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.heading).toBeVisible();
    await expect(home.footer).toBeVisible();
  });
});
