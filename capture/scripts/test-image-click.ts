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
  await p.waitForTimeout(800);
  await p.locator('label.ant-radio-button-wrapper:has-text("Ubuntu")').click();
  await p.waitForTimeout(1500);

  // Try multiple click strategies on Ubuntu 22 row
  const rowSel = 'tr:has-text("Ubuntu 22")';
  console.log('row count:', await p.locator(rowSel).count());

  // Strategy 1: click the radio's label/cell
  const tr = p.locator(rowSel).first();
  const tdCount = await tr.locator('td').count();
  console.log('td count in row:', tdCount);
  // Click 2nd td (skipping the radio one) which is the Name cell
  await tr.locator('td').nth(1).click();
  await p.waitForTimeout(1000);

  // Check if a checked radio exists in the image table now
  const checkedRows = await p.locator('tr.ant-table-row-selected, tr:has(input[type="radio"]:checked)').count();
  const selectedPill = await p.locator('.ant-tag').allTextContents();
  console.log('checked rows:', checkedRows);
  console.log('selected pills:', selectedPill);
  await p.screenshot({path: '/tmp/after-cell-click.png'});

  // Now try Next
  const nextBtn = p.locator('button:has-text("Next")').filter({hasNotText: 'Cancel'}).last();
  console.log('next btn count:', await p.locator('button:has-text("Next")').count());
  console.log('next disabled?', await nextBtn.isDisabled());
  await nextBtn.click();
  await p.waitForTimeout(3000);
  await p.screenshot({path: '/tmp/after-next.png'});
  // Check which step is active
  const activeStep = await p.locator('.ant-steps-item-process, [class*="active"]').first().textContent().catch(() => 'unknown');
  console.log('active step text:', activeStep);
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
