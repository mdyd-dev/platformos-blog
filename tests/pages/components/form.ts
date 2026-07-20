import { Locator, Page } from '@playwright/test';

export type FieldConfig = {
  type: 'textbox' | 'radio' | 'checkbox' | 'postbox';
  getLocator: (page: Page) => Locator;
  getErrorMessageLocator?: (page: Page) => Locator;
  initialize?: () => Promise<void>;
};

/**
 * Reusable form component, mirroring the `Form<T>` base in pos-module-community.
 *
 * Subclasses declare a `fieldsMapping` describing how to locate each field and its
 * validation-error element. `postbox` covers rich editors (e.g. the common-styling
 * markdown editor), and a file `<input type="file">` locator is exposed for the
 * common-styling / Uppy image-upload component.
 *
 * Auth and post-editor page objects (tasks 1.4 / 1.5) extend this.
 */
export abstract class Form<TData extends Record<string, any>> {
  readonly page: Page;
  readonly action: string;
  readonly form: Locator;
  readonly fileInput: Locator;
  protected abstract fieldsMapping: Partial<{ [K in keyof TData]: FieldConfig }>;

  constructor(page: Page, action: string = '') {
    this.page = page;
    this.action = action;
    this.form = action ? this.page.locator(`form[action="${action}"]`) : this.page.locator('form');
    this.fileInput = this.page.locator('input[type="file"]').first();
  }

  submitButton(text?: string): Locator {
    return text
      ? this.page.getByRole('button', { name: text })
      : this.form.getByRole('button', { type: 'submit' } as any).first();
  }

  async fill(fieldsData: Partial<TData>): Promise<void> {
    for (const key of Object.keys(fieldsData) as Array<keyof TData>) {
      const value = fieldsData[key];
      if (value == null) continue;
      const fieldConfig = this.fieldsMapping[key];
      if (!fieldConfig) continue;

      const fieldLocator = fieldConfig.getLocator(this.page);
      await fieldLocator.waitFor({ state: 'visible' });

      switch (fieldConfig.type) {
        case 'postbox':
          if (fieldConfig.initialize) await fieldConfig.initialize();
          await fieldLocator.pressSequentially(value as string, { delay: 25 });
          break;
        case 'textbox':
          await fieldLocator.fill('');
          await fieldLocator.fill(value as string);
          break;
        case 'radio':
        case 'checkbox':
          if (!(await fieldLocator.isChecked())) {
            try {
              await fieldLocator.check({ timeout: 2000 });
            } catch {
              // styled switches wrap the input in a covering <label> that
              // intercepts pointer events — toggle through the label instead
              await fieldLocator.locator('xpath=ancestor::label[1]').click();
            }
          }
          break;
      }
    }
  }

  /** Fills the form, submits, and captures per-field validation messages. */
  async fillSubmitAndCaptureValidation(
    fieldsData: Partial<TData>,
  ): Promise<Partial<Record<keyof TData, string>>> {
    await this.fill(fieldsData);
    await this.submitButton().click();

    const errors: Partial<Record<keyof TData, string>> = {};
    for (const key of Object.keys(fieldsData) as Array<keyof TData>) {
      const fieldConfig = this.fieldsMapping[key];
      if (!fieldConfig?.getErrorMessageLocator) continue;
      const errorLocator = fieldConfig.getErrorMessageLocator(this.page);
      try {
        await errorLocator.waitFor({ state: 'visible', timeout: 1000 });
        errors[key] = await errorLocator.innerText();
      } catch {
        /* no validation message for this field */
      }
    }
    return errors;
  }
}
