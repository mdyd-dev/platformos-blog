import {
  Selector
} from 'testcafe';
import BasePage from './basePage';

const basePage = new BasePage();

export default class HomePage {
  constructor() {
    this.txt = {
      textContent: 'Sorry, no content matched your criteria.\nPlease go back to main blog page',
    };
    this.element = {
      img: basePage.Content.find('[data-src*="uploads/image"]'),
      title: Selector('h1'),
      subtitle: Selector('.c-hero__subtitle').withText('QA Stuff'),
      footer: Selector('footer'),
      content: Selector('.o-section__title'),
      userName: Selector('.ml-auto.mr-2.float-right.mr-5'),
    };
    this.link = {
      homeLink: Selector('a').withText('Home'),
      emailLink: Selector('a').withText('jacek@near-me.com'),
      dashboard: Selector('a').withText('Dashboard'),
    };
    this.button = {
      logOut: Selector('.btn.btn-info.ml-auto.mr-5'),
    };
  }
}