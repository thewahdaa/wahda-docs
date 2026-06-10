import {chromium} from 'playwright';
import * as fs from 'fs';
async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({
    viewport: {width: 1440, height: 900},
    ignoreHTTPSErrors: true,
    storageState: '/Users/sensei/wahda-docs/capture/.state/demo-user.json',
  });
  const p = await ctx.newPage();
  await p.goto('https://console.thewahda.com/compute/instance', {waitUntil: 'domcontentloaded'});
  await p.waitForTimeout(4000);
  await p.locator('button.ant-btn-primary').first().click();
  await p.waitForTimeout(3000);
  // Scroll down and snapshot to see image+OS area
  await p.locator('button:has-text("Next")').first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await p.screenshot({path: '/tmp/wiz-bottom.png', fullPage: false});

  // List all images/icons in the OS area
  const items = await p.$$eval('label, .ant-tabs-tab, [class*="image"]', els => els.slice(0, 40).map(e => ({
    tag: e.tagName, text: e.textContent?.trim()?.slice(0, 50), classes: e.className?.slice(0, 80),
    rect: e.getBoundingClientRect().toJSON(),
  })).filter(x => x.rect.height > 0));
  console.log(JSON.stringify(items.slice(0, 25), null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
