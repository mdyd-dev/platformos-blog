import {
  Selector
} from 'testcafe';

export default class UserListPage {
  constructor() {
    this.button = {
      delete: Selector('tr:nth-of-type(1) > td > .simple_form.form .btn.btn-link'),
    };
  }
}
