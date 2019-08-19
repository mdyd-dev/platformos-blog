import {
  Selector,
  t
} from 'testcafe';
import RegistrationPage from './registrationPage';

const registrationPage = new RegistrationPage();

export default class LoginPage {
  constructor() {
    this.urlPath = '/log-in'
    this.validation = {
      invalidEmail: Selector('.error-block'),
    };
    this.link = {
      resetPassword: Selector('a').withText('Reset your password')
    }
  }

  async login(username, password) {
    await t
      .typeText(registrationPage.input.email, username)
      .typeText(registrationPage.input.password, password)
      .click(registrationPage.button.submit);
  }
}