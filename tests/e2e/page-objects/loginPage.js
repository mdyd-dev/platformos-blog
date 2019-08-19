import { Selector, t } from "testcafe";
import Notifications from "../page-objects/notifications";

const notifications = new Notifications();

export default class LoginPage {
  constructor() {
    this.element = {
      title: Selector(".jumbotron.text-center h1")
    };
    this.form = {
      email: Selector("#user_email"),
      password: Selector("#user_password")
    };
    this.button = {
      loginHomePage: Selector('a[href="/users/sign_in"].btn'),
      login: Selector(".btn.btn-primary.m-r-3"),
      resetPassword: Selector(".btn.btn-primary")
    };
    this.link = {
      forgotPassword: Selector("a").withText("Forgot password?")
    };
  }

  async login(username, password) {
    await t
      .typeText(this.form.email, username, {
        replace: true
      })
      .typeText(this.form.password, password, {
        replace: true
      })
      .click(this.button.login);
  }
}
