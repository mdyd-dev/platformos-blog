import {
  Selector
} from 'testcafe';

export default class Notifications {
  constructor() {
    this.text = {
      resetPassword: 'Your password has been changed!',
      register: 'Your account has been successfully created. Please log in.',
      removeUser: "You've successfully deleted user",
      logout: "You've successfully logged out",
      fixForm: 'There are errors inside this form. Please fix them to continue.',
      addPost: 'Post has been successfully updated',
      settingsSaved: 'Settings saved'
    };
    this.messageType = {
      success: Selector('.alert.alert-success'),
      info: Selector('.alert.alert-info'),
      warning: Selector('.alert.alert-warning.col.mt-3.mb-3'),
    };
  }
}