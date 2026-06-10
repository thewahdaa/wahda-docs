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

  // Scroll to find System Disk
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(500);

  // Find dropdown selectors near "System Disk"
  const diskInfo = await p.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('.ant-select, .ant-select-selector, label, [role="combobox"]').forEach((el: any) => {
      const r = el.getBoundingClientRect();
      if (r.height < 5) return;
      const parent = el.closest('[class*="volume" i], [class*="disk" i], .ant-form-item');
      const parentTxt = parent?.textContent?.trim()?.slice(0, 100) ?? '';
      const txt = (el.textContent ?? '').trim().slice(0, 60);
      if (parentTxt.toLowerCase().includes('disk') || parentTxt.toLowerCase().includes('volume') || txt.toLowerCase().includes('disk')) {
        out.push({tag: el.tagName, txt, cls: el.className?.slice(0, 80), parentTxt: parentTxt.slice(0, 80), rect: {x: r.x, y: r.y, w: r.width, h: r.height}});
      }
    });
    return out.slice(0, 15);
  });
  console.log('disk elements:', JSON.stringify(diskInfo, null, 2));
  await p.screenshot({path: '/tmp/disk-area.png', fullPage: true});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
