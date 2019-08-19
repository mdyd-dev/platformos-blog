import {
  Selector
} from 'testcafe';

export default class RegistrationPage {
  constructor() {
    this.urlPath = '/sign-up'
    this.input = {
      firstname: Selector('#form-first-name'),
      lastname: Selector('#form-last-name'),
      email: Selector('#form-email'),
      emailConfirmation: Selector('#form-email-confirmation'),
      password: Selector('#form-password'),
    };
    this.button = {
      submit: Selector('.btn.btn-primary.btn-lg'),
    };
  }
}
