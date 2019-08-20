import 'testcafe';
import {
  BASE_URL
} from './environment/environment';
import LayoutPage from './page-objects/basePage';
import HomePage from './page-objects/homePage';

const homePage = new HomePage();
const basePage = new LayoutPage();

fixture `Home Page`
  .page(BASE_URL);

test('Should no liquid errors on the page', async () => {
  await basePage.checkLiquidErrors();
});

test('Should image in header', async t => {
  await t.expect(homePage.element.img.count).eql(1);
});

test('Should title and subtitle on the page', async t => {
  await t
    .expect(homePage.element.subtitle)
    .ok();
});

test('Should footer on the page', async t => {
  await t
    .expect(homePage.element.footer)
    .ok()
    .expect(homePage.link.homeLink)
    .ok()
    .expect(homePage.link.emailLink)
    .ok();
});