import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Base page object shared by all blog page objects.
 *
 * Mirrors the BasePage pattern from pos-module-community: a `path`, a `goto()`,
 * and a set of role/text based locators that favour semantic, resilient selectors
 * over brittle CSS.
 */
export class BasePage {
  protected page: Page;
  readonly path: string;
  readonly buttonWithText: (text: string) => Locator;
  readonly headingWithText: (text: string) => Locator;
  readonly linkWithText: (text: string) => Locator;
  readonly elementWithText: (text: string) => Locator;
  readonly flashMessage: (text: string) => Locator;

  constructor(page: Page, path: string) {
    this.page = page;
    this.path = path;
    this.buttonWithText = (text: string) => this.page.getByRole('button', { name: text });
    this.headingWithText = (text: string) => this.page.getByRole('heading', { name: text });
    this.linkWithText = (text: string) => this.page.getByRole('link', { name: text, exact: true });
    this.elementWithText = (text: string) => this.page.getByText(text, { exact: true });
    this.flashMessage = (text: string) => this.page.getByText(text);
  }

  async goto() {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
  }

  async getPath(): Promise<string> {
    return this.page.url();
  }

  /**
   * Asserts the rendered page contains no platformOS Liquid error output.
   * Liquid errors are rendered inline (e.g. "Liquid error: ...") when a template
   * raises, so a clean page must not contain that marker.
   */
  async expectNoLiquidErrors(): Promise<void> {
    const body = await this.page.locator('body').innerText();
    expect(body, 'page should not contain Liquid error output').not.toMatch(/Liquid error|Liquid syntax error/i);
  }
}
