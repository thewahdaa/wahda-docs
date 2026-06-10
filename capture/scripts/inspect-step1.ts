import {chromium} from 'playwright';
import * as fs from 'fs';

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

  // Select flavor first
  await p.locator('tr:has-text("m1.small") input[type="radio"]').click();
  await p.waitForTimeout(1000);

  // Scroll down inside the wizard content area to find image table
  await p.evaluate(() => {
    const scroller = document.querySelector('.ant-layout-content, main, [class*="content"]');
    if (scroller) scroller.scrollTop = 600;
  });
  await p.waitForTimeout(500);

  // Find Image tab content + dump all clickable image elements
  const items = await p.evaluate(() => {
    const els: any[] = [];
    // Look for image rows under "Start Source" tab "Image"
    document.querySelectorAll('img, .image-card, [class*="image"], tr').forEach((el: any) => {
      const r = el.getBoundingClientRect();
      if (r.height < 5 || r.width < 5) return;
      const txt = (el.textContent ?? '').trim().slice(0, 80);
      const src = el.getAttribute('src') ?? '';
      const alt = el.getAttribute('alt') ?? '';
      const cls = (el.className ?? '').toString().slice(0, 100);
      if (txt.toLowerCase().includes('ubuntu') || alt.toLowerCase().includes('ubuntu') || src.toLowerCase().includes('ubuntu')) {
        els.push({tag: el.tagName, txt, src: src.slice(0, 80), alt, cls, rect: {x: r.x, y: r.y, w: r.width, h: r.height}});
      }
    });
    return els.slice(0, 20);
  });
  console.log('ubuntu candidates:', JSON.stringify(items, null, 2));

  // Also dump first 30 visible rows containing OS-like text
  const rows = await p.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('tr').forEach((tr: any) => {
      const r = tr.getBoundingClientRect();
      if (r.height < 10 || r.y < 0) return;
      const txt = (tr.textContent ?? '').trim().slice(0, 120);
      out.push({txt, rect: {x: r.x, y: r.y, w: r.width, h: r.height}});
    });
    return out.slice(0, 40);
  });
  console.log('=== visible rows ==='); rows.forEach((r: any) => console.log(' ', r.rect.y.toFixed(0), '|', r.txt));

  await p.screenshot({path: '/tmp/step1-scrolled.png', fullPage: true});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
