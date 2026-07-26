import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './page';
import { Form, FieldConfig } from './components/form';
import { step } from '../utils/utils';

/**
 * Data shape for the plain blog settings form (task 1.4). Field names mirror the
 * `blog_instance[...]` params posted by the new plain <form>.
 */
export type SettingsFormData = {
  title?: string;
  subtitle?: string;
  tags_filter?: string;
  facebook_app_id?: string;
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;
  instagram_link?: string;
  enabled?: boolean;
  sidebar_enabled?: boolean;
  grid_view_enabled?: boolean;
};

/**
 * The blog settings editor (/dashboard/blog/settings): a plain <form> with the
 * common-styling header-image upload. Mirrors the legacy `settingsPage` page
 * object, retargeted to the new plain-form markup (the legacy `.simple_form`
 * and `#form-custom-images-attributes-*` selectors no longer exist).
 */
export class SettingsForm extends Form<SettingsFormData> {
  constructor(page: Page) {
    super(page, '');
    this.form = page.getByTestId('blog-settings-form');
  }

  protected fieldsMapping: Partial<{ [K in keyof SettingsFormData]: FieldConfig }> = {
    title: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-title') },
    subtitle: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-subtitle') },
    tags_filter: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-tags-filter') },
    facebook_app_id: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-facebook-app-id') },
    facebook_link: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-facebook-link') },
    twitter_link: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-twitter-link') },
    linkedin_link: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-linkedin-link') },
    instagram_link: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-settings-instagram-link') },
    enabled: { type: 'checkbox', getLocator: (p) => p.getByTestId('blog-settings-enabled') },
    sidebar_enabled: { type: 'checkbox', getLocator: (p) => p.getByTestId('blog-settings-sidebar-enabled') },
    grid_view_enabled: { type: 'checkbox', getLocator: (p) => p.getByTestId('blog-settings-grid-view-enabled') },
  };

  submitButton(): Locator {
    return this.page.getByTestId('blog-settings-submit');
  }
}

export class SettingsPage extends BasePage {
  readonly form: SettingsForm;

  constructor(page: Page) {
    super(page, '/dashboard/blog/settings');
    this.form = new SettingsForm(page);
  }

  @step
  async open(): Promise<void> {
    await this.goto();
  }

  @step
  async save(data: SettingsFormData): Promise<void> {
    await this.form.fill(data);
    await this.form.submitButton().click();
    await this.page.waitForURL('**/dashboard/blog/settings');
  }

  @step
  async expectFieldValue(testId: string, value: string): Promise<void> {
    await expect(this.page.getByTestId(testId)).toHaveValue(value);
  }
}
