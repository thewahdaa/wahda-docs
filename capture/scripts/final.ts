/**
 * final.ts — single all-in-one capture: login then create-vm Step 1 deep flow.
 * Avoids storage-state expiry by doing both in one browser instance.
 */
import * as path from 'path';
import * as fs from 'fs';
import {execSync} from 'child_process';
import {chromium} from 'playwright';
import {installCursor, moveCursor, clickAt} from '../cursor';

const CONSOLE = 'https://console.thewahda.com';
const PASS = fs.readFileSync('/tmp/wahda_pass.txt', 'utf8').replace(/\s+$/, '');
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

async function smoothMove(page: any, x: number, y: number) {
  await moveCursor(page, x, y, {steps: 26, stepDelay: 14});
}
async function smoothClick(page: any, selector: string, label: string, pause = 0) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded({timeout: 12000});
  const box = await el.boundingBox();
  if (!box) throw new Error(`no box for ${label}`);
  await smoothMove(page, box.x + box.width/2, box.y + box.height/2);
  await page.evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [box.x + box.width/2, box.y + box.height/2]);
  await page.waitForTimeout(140);
  await el.click({force: true});
  if (pause) await page.waitForTimeout(pause);
}

async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({
    viewport: {width: 1440, height: 900},
    ignoreHTTPSErrors: true,
    recordVideo: {dir: VID, size: {width: 1440, height: 900}},
  });
  const p = await ctx.newPage();

  // ===== LOGIN =====
  for (let i = 0; i < 3; i++) {
    try { await p.goto(`${CONSOLE}/auth/login`, {waitUntil: 'domcontentloaded', timeout: 120000}); break; }
    catch (e) { console.warn('login goto retry', i+1); await p.waitForTimeout(3000); }
  }
  await p.waitForTimeout(2500);
  await installCursor(p);
  await p.locator('#normal_login_username').fill('demo-user');
  await p.locator('#normal_login_password').fill(PASS);
  await p.waitForTimeout(300);
  await p.locator('button[type="submit"]').click();
  // Poll URL change manually — waitForURL was flaky with SPA
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (!p.url().includes('/auth/login')) break;
    await p.waitForTimeout(800);
  }
  if (p.url().includes('/auth/login')) {
    console.error('still on login after 60s');
    await p.screenshot({path: '/tmp/login-fail.png'});
    throw new Error('login did not redirect');
  }
  console.log('redirected to:', p.url());
  await p.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  await p.waitForTimeout(3000);

  // ===== INSTANCES PAGE =====
  await p.goto(`${CONSOLE}/compute/instance`, {waitUntil: 'domcontentloaded', timeout: 60000});
  await p.waitForLoadState('networkidle', {timeout: 20000}).catch(() => {});
  await p.waitForTimeout(3500);
  await installCursor(p);
  await smoothMove(p, 500, 250);
  await shot(p, 'instances-list');

  // Create
  await smoothClick(p, 'button.ant-btn-primary:visible', 'create', 3000);
  await installCursor(p);
  await smoothMove(p, 700, 300);
  await shot(p, 'step1-empty');

  // Flavor
  await smoothClick(p, 'tr:has-text("m1.small") input[type="radio"]', 'flavor', 1000);
  await installCursor(p);
  await shot(p, 'step1-flavor');

  // Ubuntu tab
  await smoothClick(p, 'label.ant-radio-button-wrapper:has-text("Ubuntu")', 'ubuntu', 4000);
  await installCursor(p);
  await shot(p, 'step1-ubuntu');

  // Scroll to image table
  await p.evaluate(() => window.scrollBy(0, 400));
  await p.waitForTimeout(1500);
  await installCursor(p);

  // Image-area table is the SECOND table on the page (first = flavors). Wait for any image row.
  await p.waitForSelector('tbody tr:has(td:has-text("admin"))', {timeout: 30000}).catch(() => {});
  // Pick a row that looks like a Linux image (contains "Public" or version digits)
  const candidates = ['Ubuntu', 'Debian', 'CentOS', 'Rocky', 'Fedora'];
  let ir: any = null;
  for (const os of candidates) {
    const row = p.locator(`tbody tr:has(td:has-text("${os}"))`).first();
    if (await row.count() > 0) {
      try {
        await row.waitFor({state: 'visible', timeout: 3000});
        ir = row;
        console.log('image picked:', os);
        break;
      } catch {}
    }
  }
  if (!ir) {
    // Fallback: any row in second table
    ir = p.locator('tbody').nth(1).locator('tr').first();
    console.log('image picked: fallback (first row 2nd tbody)');
  }
  await ir.scrollIntoViewIfNeeded();
  const ic = ir.locator('td').nth(1);
  const ibox = await ic.boundingBox();
  if (ibox) {
    await smoothMove(p, ibox.x + ibox.width/2, ibox.y + ibox.height/2);
    await p.evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [ibox.x + ibox.width/2, ibox.y + ibox.height/2]);
    await ic.click({force: true});
    await p.waitForTimeout(1500);
  }
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
  await smoothMove(p, 600, 400);
  await shot(p, 'step1-disk-view');

  // Open Type dropdown
  await smoothClick(p, '.ant-form-item:has(label) .ant-select-selector >> nth=0', 'type-dropdown', 1500);
  await installCursor(p);
  await shot(p, 'step1-disk-type-open');

  // Select via keyboard
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(300);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(1200);
  await installCursor(p);
  await shot(p, 'step1-disk-type-picked');

  // Size via Tab + type
  await p.keyboard.press('Tab');
  await p.waitForTimeout(300);
  await p.keyboard.press('Meta+A');
  await p.keyboard.press('Delete');
  await p.keyboard.type('20', {delay: 80});
  await p.waitForTimeout(1000);
  await installCursor(p);
  await shot(p, 'step1-disk-sized');

  // Hover Next (don't click)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(500);
  try {
    const nb = p.locator('button:has-text("Next: Network Config")').first();
    const nbox = await nb.boundingBox();
    if (nbox) {
      await smoothMove(p, nbox.x + nbox.width/2, nbox.y + nbox.height/2);
      await p.waitForTimeout(1500);
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
  // Build GIF
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
