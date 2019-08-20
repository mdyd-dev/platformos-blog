import {
  Selector
} from 'testcafe';

export default class DashboardPage {
  constructor() {
    this.urlPath = '/dashboard'
    this.button = {
      logOut: Selector('input[value="Log Out"]')
    }
  }
}