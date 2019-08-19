import {
  Selector,
  t
} from 'testcafe';

export default class Navigation {
  constructor() {
    this.entriesSelect = Selector('[name="DataTables_Table_0_length"]');
    this.entriesCount = this.entriesSelect.find('option');
    this.link = {
      instances: Selector('a').withText('Instances'),
      partners: Selector('a').withText('Partners'),
      users: Selector('a').withText('Users'),
      create: Selector('#createDropdownLink'),
      createModule: Selector('a[href="/pos_modules/new"]'),
      modules: Selector('a[href="/pos_modules"]'),
      marketplace: Selector('a[href="/marketplace/pos_modules"]')
    };
  }
}
