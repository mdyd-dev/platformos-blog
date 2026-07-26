import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './page';
import { step } from '../utils/utils';

/**
 * Page objects for the auth surface rebuilt on pos-module-user (task 1.5).
 *
 * Login and registration use the pos-module-user built-in pages:
 *   /sessions/new -> form[action="/sessions"] (email, password, "Log In")
 *   /users/new    -> form[action="/users"]    (first_name, last_name, email, password, "Register")
 *   /passwords/reset -> form[action="/authentication_links"] (password reset request)
 * The blog module adds its own thin pages on top:
 *   /edit-profile -> form[action="/edit-profile"] (first_name, last_name, "Save")
 *   /log-out      -> plain POST form in the header
 */

export type Credentials = {
  email: string;
  password: string;
};

export type RegistrationData = Credentials & {
  first_name: string;
  last_name: string;
};

export class LoginPage extends BasePage {
  readonly form: Locator;

  constructor(page: Page) {
    super(page, '/sessions/new');
    this.form = page.locator('form[action="/sessions"]');
  }

  emailInput(): Locator {
    return this.form.locator('input[name="email"]');
  }

  passwordInput(): Locator {
    return this.form.locator('input[name="password"]');
  }

  submitButton(): Locator {
    return this.form.getByRole('button', { name: 'Log In' });
  }

  @step
  async login({ email, password }: Credentials): Promise<void> {
    await this.goto();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }
}

export class RegistrationPage extends BasePage {
  readonly form: Locator;

  constructor(page: Page) {
    super(page, '/users/new');
    this.form = page.locator('form[action="/users"]');
  }

  submitButton(): Locator {
    return this.form.getByRole('button', { name: 'Register' });
  }

  @step
  async register(data: RegistrationData): Promise<void> {
    await this.goto();
    await this.form.locator('input[name="first_name"]').fill(data.first_name);
    await this.form.locator('input[name="last_name"]').fill(data.last_name);
    await this.form.locator('input[name="email"]').fill(data.email);
    await this.form.locator('input[name="password"]').fill(data.password);
    await this.submitButton().click();
  }
}

export class EditProfilePage extends BasePage {
  readonly form: Locator;

  constructor(page: Page) {
    super(page, '/edit-profile');
    this.form = page.locator('form[action="/edit-profile"]');
  }

  submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' });
  }

  @step
  async updateNames(first_name: string, last_name: string): Promise<void> {
    await this.goto();
    await this.form.locator('input[name="first_name"]').fill(first_name);
    await this.form.locator('input[name="last_name"]').fill(last_name);
    await this.submitButton().click();
    await this.page.waitForURL('**/edit-profile');
  }
}

export class RecoverPasswordPage extends BasePage {
  readonly form: Locator;

  constructor(page: Page) {
    super(page, '/passwords/reset');
    this.form = page.locator('form[action="/authentication_links"]');
  }

  emailInput(): Locator {
    return this.form.locator('input[name="authentication_link[email]"]');
  }

  submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Email an authentication link' });
  }

  @step
  async requestReset(email: string): Promise<void> {
    await this.goto();
    await this.emailInput().fill(email);
    await this.submitButton().click();
  }
}

/** The header widgets driven by the authentication state. */
export class AuthHeader {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  userLink(): Locator {
    return this.page.getByTestId('header-user');
  }

  logoutButton(): Locator {
    return this.page.getByRole('button', { name: 'Log Out' });
  }

  loginLink(): Locator {
    return this.page.getByRole('link', { name: 'Log In' });
  }

  @step
  async expectLoggedIn(firstName: string): Promise<void> {
    await expect(this.userLink()).toHaveText(firstName);
  }

  @step
  async logout(): Promise<void> {
    await this.logoutButton().click();
    await expect(this.loginLink()).toBeVisible();
  }
}
