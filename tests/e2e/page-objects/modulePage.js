import {
  Selector,
  t
} from "testcafe";

export default class ModulePage {
  constructor() {
    this.installUAT_1module = "/marketplace/pos_modules/256";
    this.installUAT_blogModule = "/marketplace/pos_modules/19";
    this.element = {
      versionName: Selector("tr > td:nth-of-type(1)").withText("v2"),
      blogTagLine: Selector("h1.c-hero__title"),
      archiveURL: Selector("#DataTables_Table_0 tr td:nth-of-type(2)")
    };
    this.input = {
      moduleName: Selector("#pos_module_name"),
      overview: Selector("#pos_module_description"),
      coverImage: Selector("#pos_module_file"),
      videoURL: Selector("#pos_module_video_url"),
      license: Selector("#pos_module_license_text"),
      licenseURL: Selector("#pos_module_license_url"),
      versionNumber: Selector("#pos_module_version_name"),
      moduleArchive: Selector('[data-direct-upload="file"]')
    };
    this.link = {
      createNewVersion: Selector("a").withText("Create New Version"),
      moduleName: Selector("tr:nth-of-type(2) > td:nth-of-type(1)"),
      deleteModule: Selector("a").withText("Delete"),
      blogPage: Selector("h1 a"),
      installAvailableModule: Selector("a").withText("Install")
    };
    this.button = {
      selectInstance: Selector(
        'button[type="button"][title="Choose Instance"]'
      ),
      confirmationOfInstance: Selector('input[type="submit"]'),
      confirmationInstallModule: Selector('.btn.btn-primary.btn-success'),
      purchase: Selector('.btn.btn-success.bootbox-accept'),
      addModuleToInstance: Selector('.choices__list.choices__list--single [data-value="Choose Instance"]'),
      selectEnv: Selector('[data-id="2"]'),
      deployModule: Selector('input[value="Deploy"]'),
      uninstallModule: Selector("a").withText("Uninstall"),
      createFirstVerstion: Selector('button[name="publish"]'),
      createModule: Selector('input[value="Create"]')
    };
    this.radio = {
      pricingTypeFree: Selector("#pricing-production-free"),
      selectInstance: Selector("label.radio").withText(" uat-instance")
    };
    this.select = {
      creator: Selector(".choices__list.choices__list--single"),
      chooseCreator: Selector("#choices--pos_module_partner_id-item-choice-4")
    };
  }
  async selectInstance() {
    await t
      .click(this.button.selectInstance)
      .click(this.radio.selectInstance)
      .click(this.button.confirmationOfInstance);
  }
  async selectCreator() {
    await t.click(this.select.creator).click(this.select.chooseCreator);
  }
}