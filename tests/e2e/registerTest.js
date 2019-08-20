import 'testcafe';
import {
  BASE_URL,
  ADMIN_USER,
  ADMIN_PASS,
  USERDATA
} from './environment/environment';
import BasePage from './page-objects/basePage';
import HomePage from './page-objects/homePage';
import RegistrationPage from './page-objects/registrationPage';
import LoginPage from './page-objects/loginPage';
import UserListPage from './page-objects/userListPage';
import Notifications from './page-objects/notifications';
import DashboardPage from './page-objects/dashboardPage';

const homePage = new HomePage();
const basePage = new BasePage();
const registrationPage = new RegistrationPage();
const loginPage = new LoginPage();
const userListPage = new UserListPage();
const notifications = new Notifications();
const dashboardPage = new DashboardPage();

const userName = USERDATA.NAME;
const lastName = USERDATA.LASTNAME;
const userEmail = USERDATA.USER_EMAIL;
const userPass = USERDATA.PASSWORD;

const admin_user = ADMIN_USER
const admin_pass = ADMIN_PASS

fixture `Register`
  .page(BASE_URL)
  .beforeEach(async t => {
    await basePage.openPage(registrationPage.urlPath);
  });

test('Should no liquid errors on the page', async () => {
  await basePage.checkLiquidErrors();
});

test('Should let you register with valid credentials', async t => {
  await t
    .typeText(registrationPage.input.firstname, userName)
    .typeText(registrationPage.input.lastname, lastName)
    .typeText(registrationPage.input.email, userEmail)
    .typeText(registrationPage.input.emailConfirmation, userEmail)
    .typeText(registrationPage.input.password, userPass)
    .click(registrationPage.button.submit);
  await t
    .expect(notifications.messageType.success.innerText)
    .eql(notifications.text.register);
});

test('Should let you log in as new user', async t => {
  await basePage.openPage(loginPage.urlPath);
  await loginPage.login(userEmail, userPass);
  await t
    .expect(dashboardPage.button.logOut.exists).ok();
});

test('Should let you remove users when you login as admin', async t => {
  await basePage.openPage(loginPage.urlPath);
  await loginPage.login(admin_user, admin_pass);
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .setNativeDialogHandler(() => true)
    .click(userListPage.button.delete);
  await t.expect(notifications.messageType.success.innerText).eql(notifications.text.removeUser);
});