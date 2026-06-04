import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './page';
import { step } from '../utils/utils';

/**
 * Public blog home page (served at "/").
 */
export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    super(page, '/');
    this.heading = this.page.locator('h1').first();
    this.footer = this.page.locator('footer');
  }

  @step
  async open(): Promise<void> {
    await this.goto();
  }
}
