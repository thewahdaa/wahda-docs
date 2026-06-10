import * as fs from 'fs';
import {chromium} from 'playwright';
import {installCursor, moveCursor} from '../cursor';

const PASS = fs.readFileSync('/tmp/wahda_pass.txt', 'utf8').replace(/\s+$/, '');

async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, ignoreHTTPSErrors: true});
  const p = await ctx.newPage();

  await p.goto('https://console.thewahda.com/auth/login', {waitUntil: 'domcontentloaded', timeout: 120000});
  await p.waitForTimeout(2500);
  await installCursor(p);
  await moveCursor(p, 720, 365, {steps: 40});
  await p.screenshot({path: '/tmp/cursor-test-1.png'});
  console.log('login shot 1');

  await p.locator('#normal_login_username').fill('demo-user');
  await p.locator('#normal_login_password').fill(PASS);
  await p.locator('button[type="submit"]').click();
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (!p.url().includes('/auth/login')) break;
    await p.waitForTimeout(800);
  }
  if (p.url().includes('/auth/login')) { console.error('login fail'); process.exit(1); }
  await p.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  await p.waitForTimeout(3000);

  // After SPA navigation, verify cursor still alive
  const exists1 = await p.evaluate(() => !!document.getElementById('wd-cursor'));
  console.log('cursor after nav (before re-install):', exists1);

  // Re-install (idempotent)
  await installCursor(p);
  await moveCursor(p, 500, 400, {steps: 40});
  await p.screenshot({path: '/tmp/cursor-test-2.png'});
  console.log('dashboard shot');

  // Navigate to Instances
  await p.goto('https://console.thewahda.com/compute/instance', {waitUntil: 'domcontentloaded'});
  await p.waitForTimeout(3500);
  const exists2 = await p.evaluate(() => !!document.getElementById('wd-cursor'));
  console.log('cursor after 2nd nav:', exists2);
  await installCursor(p);
  await moveCursor(p, 800, 250, {steps: 40});
  await p.screenshot({path: '/tmp/cursor-test-3.png'});
  console.log('instances shot');

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
