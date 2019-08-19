import {
  Selector,
} from 'testcafe';

export default class PutsBoxPage {
  constructor() {
    this.urlEmailBox = 'https://putsbox.com/franco/inspect';
    this.urlEmailBoxProd = '/arno/inspect';
    this.noEmailsFound = Selector('[data-react-class="Emails"] p');
    this.instanceActivated = Selector('a').withText('manage');
    this.moduleDeployed = Selector('td p').withText('Module "UAT_1" successfully deployed.');
    this.input = {
      email: Selector('#user_email'),
      password: Selector('#user_password')
    };
    this.button = {
      signIn: Selector('.btn.btn-primary'),
      clearHistory: Selector('.btn.btn-default.tm10')
    };
    this.link = {
      openEmail: Selector('table.requests-header > tbody > tr > td:nth-of-type(4) a').withText('HTML'),
      resetPassword: Selector('a').withText('click here: reset password'),
      emailbox: Selector('a').withText('franco (2)')
    };
  }
}
