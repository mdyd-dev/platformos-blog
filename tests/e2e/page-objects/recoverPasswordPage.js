import {
  Selector
} from 'testcafe';

export default class RecoverPasswordPage {
  constructor() {
    this.input = {
      email: Selector('#form-properties-attributes-email'),
    };
    this.button = {
      sendVerificationEmail: Selector('.btn.btn-info')
    }
    this.element = {
      sentEmail: Selector('.row > div > p:nth-of-type(1)')
    }
  }
}