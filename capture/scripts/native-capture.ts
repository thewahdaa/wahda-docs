/**
 * native-capture.ts — record OS screen with native cursor.
 *
 * Approach: headed Playwright at fixed window position + ffmpeg avfoundation
 * captures the screen region of the browser. Native macOS cursor included.
 */
import * as fs from 'fs';
import * as path from 'path';
import {spawn, execSync} from 'child_process';
import {chromium} from 'playwright';

const CONSOLE = 'https://console.thewahda.com';
const PASS = fs.readFileSync('/tmp/wahda_pass.txt', 'utf8').replace(/\s+$/, '');
const OUT = '/Users/sensei/wahda-docs/capture/output';
const VID = path.join(OUT, 'native');
const GIF = path.join(OUT, 'gifs');
fs.mkdirSync(VID, {recursive: true});
fs.mkdirSync(GIF, {recursive: true});

// Browser window will be placed at (0, 30) on screen 0 (below menu bar)
const WIN_X = 0;
const WIN_Y = 50;
const WIN_W = 1440;
const WIN_H = 900;

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const mp4 = path.join(VID, `screen-${Date.now()}.mp4`);

  // Start ffmpeg in background to capture screen region
  console.log('starting ffmpeg avfoundation capture →', mp4);
  const ff = spawn('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-f', 'avfoundation',
    '-pixel_format', 'uyvy422',
    '-capture_cursor', '1',
    '-capture_mouse_clicks', '1',
    '-framerate', '30',
    '-i', '2:none',   // device 2 = Capture screen 0
    '-vf', `crop=${WIN_W}:${WIN_H}:${WIN_X}:${WIN_Y}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    mp4,
  ], {stdio: ['pipe', 'inherit', 'inherit']});

  // Give ffmpeg time to initialize
  await sleep(2500);

  // Launch headed Playwright
  console.log('launching headed Chromium...');
  const b = await chromium.launch({
    headless: false,
    args: [`--window-position=${WIN_X},${WIN_Y}`, `--window-size=${WIN_W},${WIN_H}`],
  });
  const ctx = await b.newContext({
    viewport: {width: WIN_W, height: WIN_H},
    ignoreHTTPSErrors: true,
  });
  const p = await ctx.newPage();

  // ===== LOGIN =====
  console.log('login...');
  await p.goto(`${CONSOLE}/auth/login`, {waitUntil: 'domcontentloaded', timeout: 120000});
  await sleep(2500);

  // Slowly type credentials so cursor shows motion
  await p.locator('#normal_login_username').hover();
  await sleep(500);
  await p.locator('#normal_login_username').click();
  await p.locator('#normal_login_username').type('demo-user', {delay: 100});
  await sleep(500);
  await p.locator('#normal_login_password').hover();
  await p.locator('#normal_login_password').click();
  await p.locator('#normal_login_password').type(PASS, {delay: 65});
  await sleep(500);
  await p.locator('button[type="submit"]').hover();
  await sleep(400);
  await p.locator('button[type="submit"]').click();

  // Wait for redirect
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (!p.url().includes('/auth/login')) break;
    await sleep(700);
  }
  if (p.url().includes('/auth/login')) {
    ff.kill('SIGINT');
    throw new Error('login failed');
  }
  console.log('logged in →', p.url());
  await sleep(2000);

  // ===== GO TO INSTANCES =====
  await p.goto(`${CONSOLE}/compute/instance`, {waitUntil: 'domcontentloaded'});
  await p.waitForLoadState('networkidle', {timeout: 20000}).catch(() => {});
  await sleep(3000);

  // ===== CREATE WIZARD =====
  console.log('opening Create wizard');
  const createBtn = p.locator('button.ant-btn-primary:visible').first();
  await createBtn.hover();
  await sleep(600);
  await createBtn.click();
  await sleep(3000);

  // === STEP 1 ===
  console.log('Step 1: flavor');
  const flavorRow = p.locator('tr:has-text("m1.small") input[type="radio"]').first();
  await flavorRow.scrollIntoViewIfNeeded();
  await flavorRow.hover();
  await sleep(600);
  await flavorRow.click({force: true});
  await sleep(1500);

  console.log('Step 1: Ubuntu tab');
  const ubuntuTab = p.locator('label.ant-radio-button-wrapper:has-text("Ubuntu")').first();
  await ubuntuTab.scrollIntoViewIfNeeded();
  await ubuntuTab.hover();
  await sleep(500);
  await ubuntuTab.click({force: true});
  await sleep(4000);

  // Scroll to image area
  await p.evaluate(() => window.scrollBy(0, 400));
  await sleep(1500);

  // Image row
  console.log('Step 1: image');
  const candidates = ['Ubuntu', 'Debian', 'Rocky', 'Fedora', 'CentOS'];
  for (const os of candidates) {
    const row = p.locator(`tbody tr:has(td:has-text("${os}"))`).first();
    if (await row.count() > 0) {
      try {
        await row.waitFor({state: 'visible', timeout: 3000});
        await row.locator('td').nth(1).hover();
        await sleep(500);
        await row.locator('td').nth(1).click({force: true});
        await sleep(1500);
        console.log('picked:', os);
        break;
      } catch {}
    }
  }

  // Scroll to System Disk
  console.log('Step 1: system disk');
  await p.evaluate(() => {
    const lbls = Array.from(document.querySelectorAll('label'));
    const sd = lbls.find(l => l.textContent?.trim() === 'System Disk');
    sd?.scrollIntoView({block: 'center'});
  });
  await sleep(1500);

  // Open Type dropdown
  const typeSel = p.locator('.ant-form-item:has(label) .ant-select-selector').first();
  await typeSel.hover();
  await sleep(500);
  await typeSel.click({force: true});
  await sleep(1500);
  await p.keyboard.press('ArrowDown');
  await sleep(400);
  await p.keyboard.press('Enter');
  await sleep(1500);

  // Hover Next button (don't click — quota)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(700);
  const nb = p.locator('button:has-text("Next: Network Config")').first();
  const nbox = await nb.boundingBox();
  if (nbox) {
    await nb.hover();
    await sleep(2000);
  }

  // Cancel out
  console.log('Cancel');
  await p.locator('button:has-text("Cancel"):visible').hover();
  await sleep(500);
  await p.locator('button:has-text("Cancel"):visible').click({force: true});
  await sleep(1500);
  try { await p.locator('.ant-modal button.ant-btn-primary').click({force: true}); await sleep(1500); } catch {}

  await sleep(1500);
  await ctx.close();
  await b.close();

  // Stop ffmpeg gracefully
  console.log('stopping ffmpeg...');
  ff.stdin.write('q');
  ff.stdin.end();
  await new Promise(r => ff.on('exit', r));
  console.log('mp4 ready:', mp4);

  // Convert mp4 → GIF
  const frames = fs.mkdtempSync('/tmp/wd-frames-');
  execSync(`ffmpeg -y -loglevel error -i "${mp4}" -vf "fps=24,scale=1440:-1:flags=lanczos" "${frames}/f-%04d.png"`);
  const gifPath = path.join(GIF, 'create-vm--hero.gif');
  execSync(`gifski --fps 24 --width 1440 --quality 92 --output "${gifPath}" "${frames}"/f-*.png`);
  fs.rmSync(frames, {recursive: true, force: true});
  console.log('GIF:', gifPath);
}
main().catch((e) => { console.error(e); process.exit(1); });
