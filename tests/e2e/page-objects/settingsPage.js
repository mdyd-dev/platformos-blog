import {
  Selector
} from 'testcafe';

export default class SettingsPage {
  constructor() {
    this.form = {
      tags: Selector('#form-properties-attributes-tags-filter'),
    };
    this.link = {
      settings: Selector('a').withText('Blog Settings')
    }
  }
}
