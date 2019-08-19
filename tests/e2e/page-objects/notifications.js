import {
  Selector
} from 'testcafe';

export default class Notifications {
  constructor() {
    this.text = {
      login: `×\nSigned in successfully.`,
      homePageNotification: `In the next few weeks we'll be rolling out Billing functionality. Please read detailed schedule and required actions.`,
      preparingInstance: `We're preparing your Instance. Check your email in a few minutes.`,
      createPartner: `×\nPartner successfully created`,
      moduleIsNotPublished: `This module is not published and can't be seen in Modules marketplace`,
      pendingInvitation: `PENDING INVITATION`,
      invalidEmailPassword: `Invalid Email or password.`,
      receivePassword: `You will receive an email with instructions on how to reset your password in a few minutes.`,
      moduleRemoved: `Module removed`,
      moduleSuccessfullyCreated: `ModuleVersion successfully created`,
      pendingVerification: `Pending verification`,
      acceptedVerification: `Accepted`
    };
    this.messageType = {
      successStaus: Selector('.alert.alert-success'),
      reviewStatus: Selector('.alert.alert-info'),
      alertForm: Selector('.notice.is-alert'),
      noticeForm: Selector('.notice.is-notice'),
      success: Selector('.alert.alert-success.alert-dismissable.fade-in'),
      info: Selector('.alert.alert-info'),
      warning: Selector('.alert.alert-warning.col.mt-3.mb-3'),
      alertWarning: Selector('.alert.alert-warning'),
      billingAnnouncement: Selector('.billing-announcement p'),
      badgeWarning: Selector('.badge.badge-warning.mx-2')
    };
  }
}
