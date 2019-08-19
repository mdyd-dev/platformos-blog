import {
  Selector,
  t
} from 'testcafe';

export default class PartnersPage {
  constructor() {
    this.element = {
      ccDate: Selector('.list-inline > .list-inline-item.mr-4.text-secondary:nth-of-type(3)').withText('12/2023')
    }
    this.button = {
      submit: Selector('button[type="submit"]')
    }
    this.link = {
      newPartner: Selector('a').withText('New Partner'),
      jacekCorpPartner: Selector('.sorting_1 a'),
      creditCards: Selector('a').withText('Credit Cards'),
      newCreditCard: Selector('a').withText('New Credit Card')
    }
    this.input = {
      partnerName: Selector('#partner_name'),
      cardNumber: Selector(
        '.Fieldset-childLeftRight > .Textbox-inputRow > input[type="tel"].Fieldset-input.Textbox-control'
      ),
      date: Selector('.Fieldset-childLeft > .Textbox-inputRow > input[type="tel"].Fieldset-input.Textbox-control'),
      ccv: Selector('.Fieldset-childRight > .Textbox-inputRow > input[type="tel"].Fieldset-input.Textbox-control')
    }
    this.iframe = {
      iframeStripe: Selector('iframe[name="stripe_checkout_app"]'),
    }
  }
}
