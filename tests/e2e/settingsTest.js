import 'testcafe';
import {
  BASE_URL,
  ADMIN_USER,
  ADMIN_PASS
} from './environment/environment';
import BasePage from './page-objects/basePage';
import LoginPage from './page-objects/loginPage';
import Notifications from './page-objects/notifications';
import HomePage from './page-objects/homePage';
import PostAdminPage from './page-objects/postsAdminPage';
import SettingsPage from './page-objects/settingsPage';
import DashboardPage from './page-objects/dashboardPage';

const loginPage = new LoginPage();
const basePage = new BasePage();
const notifications = new Notifications();
const homePage = new HomePage();
const postAdminPage = new PostAdminPage();
const settingsPage = new SettingsPage();
const dashboardPage = new DashboardPage();

const admin_user = ADMIN_USER;
const admin_pass = ADMIN_PASS;

fixture `Settings`.page(BASE_URL);

test('Should let you change name of blog', async t => {
  await basePage.openPage(loginPage.urlPath);
  await loginPage.login(admin_user, admin_pass);
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .click(postAdminPage.link.blogPage)
    .click(settingsPage.link.settings)
    .selectText(postAdminPage.form.title)
    .pressKey('delete')
    .typeText(postAdminPage.form.title, 'QA Blog - edit')
    .click(postAdminPage.button.savePost);
  await t
    .expect(notifications.messageType.success.innerText)
    .eql(notifications.text.settingsSaved);
  await t
    .click(postAdminPage.link.home)
    .expect(homePage.element.title.innerText)
    .eql('QA Blog - edit');
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .click(postAdminPage.link.blogPage)
    .click(settingsPage.link.settings)
    .selectText(postAdminPage.form.title)
    .pressKey('delete')
    .typeText(postAdminPage.form.title, 'QA Blog')
    .click(postAdminPage.button.savePost);
  await t
    .expect(notifications.messageType.success.innerText)
    .eql(notifications.text.settingsSaved);
});