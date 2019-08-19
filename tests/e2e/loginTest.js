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
import DashboardPage from './page-objects/dashboardPage';

const loginPage = new LoginPage();
const basePage = new BasePage();
const notifications = new Notifications();
const homePage = new HomePage();
const dashboardPage = new DashboardPage();

const admin_user = ADMIN_USER
const admin_pass = ADMIN_PASS

fixture `Log in`
  .page(BASE_URL)
  .beforeEach(async t => {
    await basePage.openPage(loginPage.urlPath);
  });

test('Should no liquid errors on the page', async () => {
  await basePage.checkLiquidErrors();
});

test('Should error on a invalid password', async t => {
  await loginPage.login('test@test.com', 'wrongpassword');
  await t
    .expect(notifications.messageType.warning.innerText)
    .eql(notifications.text.fixForm)
    .expect(loginPage.validation.invalidEmail.innerText)
    .eql('Invalid email or password');
});

test('Should let you log out from Dashboard', async t => {
  await loginPage.login(admin_user, admin_pass);
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .click(homePage.button.logOut)
    .expect(notifications.messageType.success.innerText)
    .eql(notifications.text.logout);
});