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

  // Scroll to System Disk area
  await p.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const sd = labels.find(l => l.textContent?.trim() === 'System Disk');
    sd?.scrollIntoView({block: 'center'});
  });
  await p.waitForTimeout(700);

  // Click on the System Disk's Type select — find by parent form-item containing "System Disk"
  // Form-item with required class on System Disk should be the container
  const typeSel = p.locator('.ant-form-item:has(label:text-is("System Disk")) .ant-select-selector').first();
  console.log('type sel count:', await typeSel.count());
  await typeSel.click();
  await p.waitForTimeout(800);

  // Dropdown opened — dump all option texts
  const opts = await p.locator('.ant-select-item-option:visible').allTextContents();
  console.log('disk type options:', opts);
  await p.screenshot({path: '/tmp/disk-dropdown.png'});

  // Pick first available option
  if (opts.length > 0) {
    await p.locator(`.ant-select-item-option:has-text("${opts[0]}")`).first().click();
    await p.waitForTimeout(800);
  }
  await p.screenshot({path: '/tmp/disk-picked.png'});

  // Try Next now
  await p.locator('button:has-text("Next: Network Config")').click();
  await p.waitForTimeout(2500);
  const activeStep = await p.locator('.ant-steps-item-active, [class*="StepHorizontal"] .active, .ant-steps-item-process').first().textContent().catch(() => 'n/a');
  console.log('active step after next:', activeStep);
  await p.screenshot({path: '/tmp/after-next2.png'});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
