/**
 * create-vm.ts — Step 1 deep walkthrough.
 * Captures the Create Instance wizard from open → Step 1 fully filled.
 * Bails at "Next: Network Config" without clicking (preserve quota).
 */
import * as path from 'path';
import {newScene, shot, finalizeGif} from '../capture';
import {installCursor, moveCursor} from '../cursor';

const CONSOLE = process.env.CONSOLE_URL ?? 'https://console.thewahda.com';
const STATE = path.resolve(__dirname, '../.state/demo-user.json');

async function smoothClick(s: any, selector: string, label: string, opts: {pause?: number} = {}) {
  const el = s.page.locator(selector).first();
  await el.scrollIntoViewIfNeeded({timeout: 8000});
  const box = await el.boundingBox();
  if (!box) throw new Error(`no box for ${label}`);
  const x = box.x + box.width/2;
  const y = box.y + box.height/2;
  await moveCursor(s.page, x, y, {steps: 26, stepDelay: 14});
  await s.page.evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [x, y]);
  await s.page.waitForTimeout(140);
  await el.click({force: true});
  if (opts.pause) await s.page.waitForTimeout(opts.pause);
}

async function main() {
  const s = await newScene({scene: 'create-vm', record: true, viewport: {width: 1440, height: 900}, storageState: STATE});

  // Resilient goto
  for (let i = 0; i < 3; i++) {
    try {
      await s.page.goto(`${CONSOLE}/compute/instance`, {waitUntil: 'domcontentloaded', timeout: 120000});
      break;
    } catch (e) { console.warn(`goto retry ${i+1}`); await s.page.waitForTimeout(3000); }
  }
  await s.page.waitForLoadState('networkidle', {timeout: 20000}).catch(() => {});
  await s.page.waitForTimeout(3500);
  await installCursor(s.page);

  await moveCursor(s.page, 500, 250, {steps: 30});
  await shot(s, 'instances-list');
  await s.page.waitForTimeout(800);

  // Open Create wizard
  await smoothClick(s, 'button.ant-btn-primary:visible', 'create', {pause: 3000});
  await installCursor(s.page);
  await moveCursor(s.page, 700, 300, {steps: 25});
  await shot(s, 'step1-empty');

  // Flavor
  await smoothClick(s, 'tr:has-text("m1.small") input[type="radio"]', 'flavor', {pause: 1000});
  await installCursor(s.page);
  await shot(s, 'step1-flavor');

  // Ubuntu OS tab
  await smoothClick(s, 'label.ant-radio-button-wrapper:has-text("Ubuntu")', 'ubuntu-tab', {pause: 1500});
  await installCursor(s.page);
  await shot(s, 'step1-ubuntu');

  // Wait for image table to load + scroll into view
  await s.page.evaluate(() => window.scrollBy(0, 400));
  await s.page.waitForTimeout(2500);
  // Image row
  const imgRow = s.page.locator('tr:has-text("Ubuntu 22")').first();
  await imgRow.waitFor({state: 'visible', timeout: 15000});
  await imgRow.scrollIntoViewIfNeeded();
  const nameCell = imgRow.locator('td').nth(1);
  const cbox = await nameCell.boundingBox();
  if (cbox) {
    await moveCursor(s.page, cbox.x + cbox.width/2, cbox.y + cbox.height/2, {steps: 25});
    await s.page.evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [cbox.x + cbox.width/2, cbox.y + cbox.height/2]);
    await s.page.waitForTimeout(140);
    await nameCell.click({force: true});
    await s.page.waitForTimeout(1200);
  }
  await installCursor(s.page);
  await shot(s, 'step1-image');

  // Scroll to System Disk section
  await s.page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const sd = labels.find(l => l.textContent?.trim() === 'System Disk');
    sd?.scrollIntoView({block: 'center', behavior: 'instant'});
  });
  await s.page.waitForTimeout(700);
  await installCursor(s.page);
  await moveCursor(s.page, 600, 400, {steps: 20});
  await shot(s, 'step1-disk-view');

  // Open Type dropdown
  await smoothClick(s, '.ant-form-item:has(label) .ant-select-selector >> nth=0', 'disk-type-open', {pause: 1200});
  // Trying a slightly different approach: scroll select into view first
  await installCursor(s.page);
  await moveCursor(s.page, 550, 480, {steps: 18});
  await shot(s, 'step1-disk-type-open');

  // Pick first option (only SSD-GP1) via keyboard
  await s.page.keyboard.press('ArrowDown');
  await s.page.waitForTimeout(300);
  await s.page.keyboard.press('Enter');
  await s.page.waitForTimeout(1000);
  await installCursor(s.page);
  await shot(s, 'step1-disk-type-picked');

  // Size — Tab over and type 20
  await s.page.keyboard.press('Tab');
  await s.page.waitForTimeout(300);
  await s.page.keyboard.press('Meta+A');
  await s.page.keyboard.press('Delete');
  await s.page.keyboard.type('20', {delay: 70});
  await s.page.waitForTimeout(900);
  await installCursor(s.page);
  await shot(s, 'step1-disk-sized');

  // Move cursor toward Next button (don't click — we bail here)
  await s.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await s.page.waitForTimeout(400);
  try {
    const nb = s.page.locator('button:has-text("Next: Network Config")').first();
    const nbox = await nb.boundingBox();
    if (nbox) {
      await moveCursor(s.page, nbox.x + nbox.width/2, nbox.y + nbox.height/2, {steps: 25});
      await s.page.waitForTimeout(1200);
    }
  } catch {}
  await shot(s, 'step1-hover-next');

  // Cancel
  try {
    await smoothClick(s, 'button:has-text("Cancel"):visible', 'cancel', {pause: 1200});
    try { await smoothClick(s, '.ant-modal button.ant-btn-primary', 'confirm-cancel', {pause: 1500}); } catch {}
  } catch {}
  await shot(s, 'returned');

  await finalizeGif(s, 'hero', {fps: 14, width: 1280});
}
main().catch((e) => { console.error(e); process.exit(1); });
