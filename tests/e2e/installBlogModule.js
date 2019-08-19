import 'testcafe';
import {
  BASE_URL,
  USER_NAME,
  USER_PASS,
} from './environment/environment';
import LoginPage from './page-objects/loginPage';
import Notifications from './page-objects/notifications';
import Navigation from './page-objects/navigation';
import InstancePage from './page-objects/instancePage';
import BasePage from './page-objects/basePage';
import ModulePage from './page-objects/modulePage';

const loginPage = new LoginPage();
const notifications = new Notifications();
const navigation = new Navigation();
const instancePage = new InstancePage();
const basePage = new BasePage();
const modulePage = new ModulePage();

const user_name = USER_NAME;
const user_pass = USER_PASS;

fixture `Install and check blog module`.page(BASE_URL);

test('Should install blog module', async t => {
  await loginPage.login(user_name, user_pass);
  await t
    .click(navigation.link.instances)
    .click(instancePage.link.instanceName)
    .click(modulePage.link.installAvailableModule)
    .click(modulePage.button.deployModule);
});

test('Blog module should be installed on the page', async t => {
  await loginPage.login(user_name, user_pass);
  await t
    .wait(30000) //waiting for module deploy
    .click(navigation.link.instances)
    .click(instancePage.link.instanceName);
  await t.expect(modulePage.button.uninstallModule.exists).ok();
  await t.click(modulePage.link.blogPage);
  await t.expect(modulePage.element.blogTagLine.innerText).eql('PlatformOS Blog');
});

test.only('Should let you remove module', async t => {
  await loginPage.login(user_name, user_pass);
  await t
    .click(instancePage.link.instanceName)
    .setNativeDialogHandler(() => true)
    .click(modulePage.button.uninstallModule)
    .wait(30000); //waiting for removing of module
  await t.eval(() => location.reload(true));
  await t.expect(modulePage.button.uninstallModule.exists).notOk();
});