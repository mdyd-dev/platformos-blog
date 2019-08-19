import { Selector, t } from "testcafe";

export default class InstancesPage {
  constructor() {
    this.selectEnv = Selector("#instance_endpoint_id");
    this.envOption = this.selectEnv.find("option");
    this.selectBilling = Selector(".card:nth-of-type(3) > .card__heading");
    this.selectSubBillingPlan = Selector(".card");
    this.button = {
      newInstance: Selector("a").withText("New Instance"),
      create: Selector(".btn.btn-primary"),
      deleteInstance: Selector(
        '.button_to:nth-of-type(1) > input[type="submit"].btn.btn-danger'
      )
    };
    this.input = {
      instanceName: Selector("#instance_name")
    };
    this.radio = {
      newStackEnv: Selector("label.radio").withText("STAGING-US-WEST-2 [FAST]"),
      unbilledPlan: Selector("label.radio").withText(
        "Unbilled, Usage Fee: $0.00 (None)"
      )
    };
    this.link = {
      instanceName: Selector("#DataTables_Table_0 tr td:nth-of-type(1) a"),
      dangerZone: Selector("a").withText("Danger zone")
    };
  }
}
