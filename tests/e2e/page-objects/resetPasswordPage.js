import {
  Selector
} from 'testcafe';

export default class ResetPasswordPage {
  constructor() {
    this.input = {
      password: Selector('#form-password'),
    };
  }
}