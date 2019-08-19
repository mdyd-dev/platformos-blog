export const BASE_URL =
  process.env.BASE_URL || 'https://blog-module.staging.oregon.platform-os.com';
export const ADMIN_USER = process.env.ADMIN_USER_GUI || 'admin@example.com';
export const ADMIN_PASS = process.env.ADMIN_PASS_GUI || 'admin1234';
export const USERDATA = process.env.DATA_GUI || {
  NAME: 'test_user',
  LASTNAME: 'qa',
  USER_EMAIL: `test+${+new Date ()}@example.com`,
  PASSWORD: 'password',
};