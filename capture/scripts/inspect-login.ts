import {chromium} from 'playwright';
const SKYLINE = process.env.SKYLINE_URL ?? 'https://api.thewahda.com';

async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, ignoreHTTPSErrors: true});
  const p = await ctx.newPage();
  await p.goto(`${SKYLINE}/auth/login/`, {waitUntil: 'networkidle'});
  await p.waitForTimeout(2000);
  // Dump all input elements + their attributes
  const inputs = await p.$$eval('input', els => els.map(e => ({
    type: e.type, name: e.name, id: e.id, placeholder: e.placeholder,
    autocomplete: e.autocomplete, ariaLabel: e.getAttribute('aria-label'),
    visible: !!(e.offsetParent || e.getClientRects().length),
    rect: (() => { const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; })(),
  })));
  console.log('inputs:', JSON.stringify(inputs, null, 2));
  const buttons = await p.$$eval('button', els => els.map(e => ({
    text: e.textContent?.trim(), type: e.type, classes: e.className,
    visible: !!(e.offsetParent || e.getClientRects().length),
  })));
  console.log('buttons:', JSON.stringify(buttons, null, 2));
  // Also dump entire <body> outerHTML's first 2000 chars
  const html = await p.evaluate(() => document.querySelector('form')?.outerHTML ?? document.body.outerHTML.slice(0, 4000));
  console.log('form html:\n', html?.slice(0, 4000));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
