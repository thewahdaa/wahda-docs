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
  await moveCursor(p, 700, 400, {steps: 40, stepDelay: 16});
  await p.waitForTimeout(800);
  const state = await p.evaluate(() => {
    const c = document.getElementById('wd-cursor') as HTMLElement | null;
    if (!c) return {exists: false};
    const r = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    return {
      exists: true,
      rect: {x: r.x, y: r.y, w: r.width, h: r.height},
      position: cs.position,
      zIndex: cs.zIndex,
      visibility: cs.visibility,
      display: cs.display,
      opacity: cs.opacity,
      transform: cs.transform,
      innerHTML: c.innerHTML.slice(0, 200),
      parent: c.parentElement?.tagName,
    };
  });
  console.log(JSON.stringify(state, null, 2));
  await p.screenshot({path: '/tmp/cursor-state.png'});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
