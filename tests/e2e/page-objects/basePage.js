import {
  Selector,
  t
} from 'testcafe';

export default class BasePage {
  constructor() {
    this.Body = Selector('body');
    this.Content = this.Body.find('main');
    this.createButton = Selector('.btn.btn-primary')
    this.file = Selector('#file')
  }

  async openPage(pageName) {
    const urlPath = pageName.toLowerCase();
    return t.navigateTo(`${urlPath}`);
  }
}
