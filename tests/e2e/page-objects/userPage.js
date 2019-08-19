import {
  Selector,
} from 'testcafe';

import {
  USERDATA
} from '../environment/environment';

export default class UserPage {
  constructor() {
    this.email = USERDATA.USER_EMAIL;

    this.link = {
      newUser: Selector('a').withText('New User'),
    }
    this.input = {
      userEmail: Selector('#user_email')
    }
    this.button = {
      inviteUser: Selector('.btn.btn-success'),
      delete: Selector('.btn.btn-danger')
    }
    this.element = {
      writePermission: Selector('#policy_name_write'),
      grantPermission: Selector('#grant_permissions_to_instances'),
      userEmailList: Selector('a').withText(this.email),
      userOnList: Selector('.sorting_1')
    }
  }
}