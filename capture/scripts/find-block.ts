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
  await p.waitForTimeout(1500);
  await p.locator('tr:has-text("Ubuntu 22")').first().locator('td').nth(1).click();
  await p.waitForTimeout(800);

  // Now try clicking Next; if it doesn't advance, dump validation msgs
  await p.locator('button:has-text("Next: Network Config")').click();
  await p.waitForTimeout(2000);

  // Look for any visible error/validation messages
  const errs = await p.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('.ant-form-item-explain-error, .ant-form-item-has-error, [class*="error"], [class*="errorMsg"]').forEach((el: any) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0) out.push({txt: (el.textContent ?? '').trim().slice(0, 100), cls: el.className?.slice(0, 80)});
    });
    return out;
  });
  console.log('errors:', JSON.stringify(errs, null, 2));

  // Also dump all visible form labels with their ASTERISK marker
  const reqLabels = await p.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('label, .ant-form-item-label').forEach((el: any) => {
      const r = el.getBoundingClientRect();
      if (r.height < 5 || r.y < 0 || r.y > 900) return;
      const txt = (el.textContent ?? '').trim();
      if (!txt) return;
      // Check if has asterisk style or required class
      const requiredIndicator = !!el.querySelector('.ant-form-item-required, [class*="required"], [class*="asterisk"]');
      out.push({txt: txt.slice(0, 60), required: requiredIndicator || /^\*/.test(txt), y: r.y});
    });
    return out.sort((a, b) => a.y - b.y);
  });
  console.log('labels:'); reqLabels.forEach((l: any) => console.log(`  y=${l.y.toFixed(0)} req=${l.required}: ${l.txt}`));

  await p.screenshot({path: '/tmp/after-next-try.png'});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
