/**
 * capture-only.ts — Create-Instance capture using pre-existing storageState
 * Avoids UI login (rate-limited today). Storage state loaded from API session cookie.
 */
import * as path from 'path';
import * as fs from 'fs';
import {execSync} from 'child_process';
import {chromium} from 'playwright';
import {installCursor, moveCursor} from '../cursor';

const CONSOLE = 'https://console.thewahda.com';
const STATE = '/Users/sensei/wahda-docs/capture/.state/demo-user.json';
const OUT = '/Users/sensei/wahda-docs/capture/output';
const SHOT = path.join(OUT, 'screenshots/create-vm');
const VID = path.join(OUT, 'videos/create-vm');
const GIF = path.join(OUT, 'gifs');
for (const d of [SHOT, VID, GIF]) fs.mkdirSync(d, {recursive: true});

let step = 0;
async function shot(page: any, name: string) {
  step++;
  const file = path.join(SHOT, `${String(step).padStart(2, '0')}-${name}.png`);
  await page.screenshot({path: file, fullPage: false});
  console.log('  shot ->', file);
}

async function smoothClick(page: any, selector: string, label: string, pause = 0) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded({timeout: 12000});
  const box = await el.boundingBox();
  if (!box) throw new Error(`no box for ${label}`);
  const x = box.x + box.width/2;
  const y = box.y + box.height/2;
  await moveCursor(page, x, y, {steps: 45, stepDelay: 16});
  await page.evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [x, y]);
  await page.waitForTimeout(140);
  await el.click({force: true});
  if (pause) await page.waitForTimeout(pause);
}

async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({
    viewport: {width: 1440, height: 900},
    ignoreHTTPSErrors: true,
    storageState: STATE,
    recordVideo: {dir: VID, size: {width: 1440, height: 900}},
  });
  const p = await ctx.newPage();

  // Direct to instances — storage state handles auth
  for (let i = 0; i < 3; i++) {
    try {
      await p.goto(`${CONSOLE}/compute/instance`, {waitUntil: 'domcontentloaded', timeout: 120000});
      break;
    } catch (e) { console.warn('goto retry', i+1); await p.waitForTimeout(3000); }
  }
  await p.waitForLoadState('networkidle', {timeout: 20000}).catch(() => {});
  await p.waitForTimeout(4000);

  // Verify we're logged in (not redirected to login)
  if (p.url().includes('/auth/login')) {
    console.error('storageState expired, on login page:', p.url());
    process.exit(1);
  }
  console.log('logged in via storageState, URL:', p.url());

  await installCursor(p);
  await moveCursor(p, 500, 250, {steps: 40, stepDelay: 16});
  await shot(p, 'instances-list');

  // Open Create
  await smoothClick(p, 'button.ant-btn-primary:visible', 'create', 3000);
  await installCursor(p);
  await moveCursor(p, 700, 300, {steps: 35, stepDelay: 16});
  await shot(p, 'step1-empty');

  // Flavor
  await smoothClick(p, 'tr:has-text("m1.small") input[type="radio"]', 'flavor', 1500);
  await installCursor(p);
  await shot(p, 'step1-flavor');

  // Ubuntu tab
  await smoothClick(p, 'label.ant-radio-button-wrapper:has-text("Ubuntu")', 'ubuntu', 4000);
  await installCursor(p);
  await shot(p, 'step1-ubuntu');

  // Scroll to image area
  await p.evaluate(() => window.scrollBy(0, 400));
  await p.waitForTimeout(2000);
  await installCursor(p);

  // Pick first image row with Ubuntu/Debian/etc
  const candidates = ['Ubuntu', 'Debian', 'Rocky', 'Fedora', 'CentOS'];
  let irFound = false;
  for (const os of candidates) {
    const row = p.locator(`tbody tr:has(td:has-text("${os}"))`).first();
    if (await row.count() > 0) {
      try {
        await row.waitFor({state: 'visible', timeout: 3000});
        const cell = row.locator('td').nth(1);
        const cbox = await cell.boundingBox();
        if (cbox) {
          await moveCursor(p, cbox.x + cbox.width/2, cbox.y + cbox.height/2, {steps: 40, stepDelay: 16});
          await p.evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [cbox.x + cbox.width/2, cbox.y + cbox.height/2]);
          await p.waitForTimeout(140);
          await cell.click({force: true});
          await p.waitForTimeout(1500);
          irFound = true;
          console.log('picked image:', os);
          break;
        }
      } catch {}
    }
  }
  if (!irFound) console.warn('no image row clickable');
  await installCursor(p);
  await shot(p, 'step1-image');

  // Scroll to System Disk
  await p.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const sd = labels.find(l => l.textContent?.trim() === 'System Disk');
    sd?.scrollIntoView({block: 'center'});
  });
  await p.waitForTimeout(800);
  await installCursor(p);
  await moveCursor(p, 600, 400, {steps: 40, stepDelay: 16});
  await shot(p, 'step1-disk-view');

  // Click Type dropdown
  try {
    await smoothClick(p, '.ant-form-item:has(label) .ant-select-selector >> nth=0', 'disk-type', 1500);
    await installCursor(p);
    await shot(p, 'step1-disk-type-open');
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(300);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1200);
    await installCursor(p);
    await shot(p, 'step1-disk-type-picked');
    // Size via Tab
    await p.keyboard.press('Tab');
    await p.waitForTimeout(300);
    await p.keyboard.press('Meta+A');
    await p.keyboard.press('Delete');
    await p.keyboard.type('20', {delay: 80});
    await p.waitForTimeout(1000);
    await installCursor(p);
    await shot(p, 'step1-disk-sized');
  } catch (e) { console.warn('disk config:', (e as Error).message.slice(0, 100)); }

  // Hover Next (don't click — bail)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(500);
  try {
    const nb = p.locator('button:has-text("Next: Network Config")').first();
    const nbox = await nb.boundingBox();
    if (nbox) {
      await moveCursor(p, nbox.x + nbox.width/2, nbox.y + nbox.height/2, {steps: 40, stepDelay: 16});
      await p.waitForTimeout(1800);
    }
  } catch {}
  await shot(p, 'step1-hover-next');

  // Cancel
  try {
    await smoothClick(p, 'button:has-text("Cancel"):visible', 'cancel', 1500);
    try { await smoothClick(p, '.ant-modal button.ant-btn-primary', 'confirm-cancel', 1500); } catch {}
  } catch {}
  await shot(p, 'returned');

  await ctx.close();

  // GIF
  const webms = fs.readdirSync(VID).filter(f => f.endsWith('.webm'));
  if (webms.length) {
    const latest = webms.map(f => path.join(VID, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    const frames = fs.mkdtempSync('/tmp/wd-frames-');
    execSync(`ffmpeg -y -loglevel error -i "${latest}" -vf "fps=24,scale=1440:-1:flags=lanczos" "${frames}/f-%04d.png"`);
    const gifPath = path.join(GIF, 'create-vm--hero.gif');
    execSync(`gifski --fps 24 --width 1440 --quality 92 --output "${gifPath}" "${frames}"/f-*.png`);
    fs.rmSync(frames, {recursive: true, force: true});
    console.log('  gif  ->', gifPath);
  }
  await b.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
