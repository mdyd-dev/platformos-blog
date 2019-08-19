import {
  Selector
} from 'testcafe';

export default class PostPage {
  constructor() {
    this.text = {
      title: `Lorem ipsum`,
      content: `Test`
    };
    this.form = {
      title: Selector('.c-hero__title'),
      content: Selector('.c-article__content'),
      author: Selector('.c-user__title').withText('Test User')
    };
  }
}
