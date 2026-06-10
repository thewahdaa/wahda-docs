import {chromium} from 'playwright';
import * as fs from 'fs';
const PASS = fs.readFileSync('/tmp/wahda_pass.txt', 'utf8').replace(/\s+$/, '');
async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, ignoreHTTPSErrors: true});
  const p = await ctx.newPage();
  await p.goto('https://console.thewahda.com/auth/login', {waitUntil: 'domcontentloaded', timeout: 120000});
  await p.waitForTimeout(3000);
  await p.locator('#normal_login_username').fill('demo-user');
  await p.locator('#normal_login_password').fill(PASS);
  await p.locator('button[type="submit"]').click();
  await p.waitForTimeout(8000);
  console.log('URL after submit:', p.url());
  const errs = await p.locator('.ant-message, .ant-alert-error, .ant-form-item-explain-error').allTextContents();
  console.log('errors:', errs);
  await p.screenshot({path: '/tmp/login-result.png'});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
