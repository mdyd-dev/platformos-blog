import {
  Selector,
  t
} from 'testcafe';

export default class BasePage {
  constructor() {
    this.Body = Selector('body');
    this.Content = this.Body.find('main');
  }

  async checkLiquidErrors() {
    const bodyText = await this.Body.textContent;
    return t
      .expect(bodyText)
      .notContains('Liquid Error')
      .expect(bodyText)
      .notContains('RenderFormTag Error')
      .expect(bodyText)
      .notContains('QueryGraphTag Error');
  }

  async openPage(pageName) {
    const urlPath = pageName.toLowerCase();
    return t.navigateTo(`${urlPath}`);
  }
}
