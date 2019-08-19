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
import PostPage from './page-objects/postPage';
import DashboardPage from './page-objects/dashboardPage';

const loginPage = new LoginPage();
const basePage = new BasePage();
const notifications = new Notifications();
const homePage = new HomePage();
const postAdminPage = new PostAdminPage();
const postPage = new PostPage();
const dashboardPage = new DashboardPage();

const admin_user = ADMIN_USER;
const admin_pass = ADMIN_PASS;

fixture `Posts`.page(BASE_URL);

test('Should let you add new post', async t => {
  await basePage.openPage(loginPage.urlPath);
  await loginPage.login(admin_user, admin_pass);
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .click(postAdminPage.link.blogPage)
    .click(postAdminPage.link.newPost);
  await t
    .typeText(postAdminPage.form.title, 'Lorem ipsum')
    .click(postAdminPage.form.publishNow)
    .setFilesToUpload(postAdminPage.form.heroImage, ['./uploads/hero.png'])
    .typeText(postAdminPage.form.content, 'Test')
    .typeText(postAdminPage.form.excerpt, 'Lorem ipsum')
    .setFilesToUpload(postAdminPage.form.avatar, ['./uploads/hero.png'])
    .typeText(postAdminPage.form.author, 'Test User')
    .click(postAdminPage.button.savePost);
  await t
    .expect(notifications.messageType.success.innerText)
    .eql(notifications.text.addPost);
});

test('Post should exist on the home page', async t => {
  await basePage.openPage(loginPage.urlPath);
  await loginPage.login(admin_user, admin_pass);
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .click(postAdminPage.link.blogPage)
    .click(postAdminPage.link.blogPost);
  await t
    .expect(homePage.element.title.innerText)
    .eql('Lorem ipsum')
    .expect(postPage.form.content.innerText)
    .eql(postPage.text.content)
    .expect(postPage.form.author)
    .ok();
});

test('Should let you remove post', async t => {
  await basePage.openPage(loginPage.urlPath);
  await loginPage.login(admin_user, admin_pass);
  await basePage.openPage(dashboardPage.urlPath)
  await t
    .click(postAdminPage.link.blogPage)
    .setNativeDialogHandler(() => true)
    .click(postAdminPage.button.removePost);
});