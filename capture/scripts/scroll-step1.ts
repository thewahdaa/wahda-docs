import {chromium} from 'playwright';
async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({
    viewport: {width: 1440, height: 900}, ignoreHTTPSErrors: true,
    storageState: '/Users/sensei/wahda-docs/capture/.state/demo-user.json',
  });
  const p = await ctx.newPage();
  await p.goto('https://console.thewahda.com/compute/instance', {waitUntil: 'domcontentloaded', timeout: 60000});
  await p.waitForTimeout(4000);
  await p.locator('button.ant-btn-primary').first().click();
  await p.waitForTimeout(3500);
  await p.locator('tr:has-text("m1.small") input[type="radio"]').click();
  await p.waitForTimeout(500);
  await p.locator('label.ant-radio-button-wrapper:has-text("Ubuntu")').click();
  await p.waitForTimeout(1000);
  await p.locator('tr:has-text("Ubuntu 22")').first().locator('td').nth(1).click();
  await p.waitForTimeout(1000);

  // Take fullPage screenshot to see whole form
  await p.screenshot({path: '/tmp/step1-fullpage.png', fullPage: true});

  // Find required fields with empty values (asterisk + empty input)
  const required = await p.$$eval('label, [class*="required"], [class*="asterisk"]', els => els.map(e => ({
    text: (e.textContent ?? '').trim().slice(0, 50),
    cls: (e.className ?? '').toString().slice(0, 60),
    rect: e.getBoundingClientRect().toJSON(),
  })).filter(x => x.text.startsWith('*')));
  console.log('required fields:', JSON.stringify(required.slice(0, 20), null, 2));

  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
