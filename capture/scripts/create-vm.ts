/**
 * create-vm.ts — full wizard walkthrough.
 *
 * Walks the Create Instance wizard from open → Step 1 filled → Step 2 filled
 * → Step 3 filled → Step 4 (confirm), then **Cancel** (never clicks Create,
 * so no VM is consumed).
 *
 * Output PNGs land under capture/output/screenshots/create-vm/ with names:
 *   01-instances-list, 02-step1-empty, 03-step1-flavor, 04-step1-ubuntu,
 *   05-step1-image, 06-step1-disk-view, 07-step1-disk-type-open,
 *   08-step1-disk-type-picked, 09-step1-disk-sized, 10-step1-hover-next,
 *   11-step2-empty, 12-step2-selected,
 *   13-step3-empty, 14-step3-filled,
 *   15-step4-confirm,
 *   16-returned.
 *
 * The docs pull only a subset — the hero-per-step ones.
 */
import * as path from 'path';
import {newScene, shot, finalizeGif} from '../capture';
import {installCursor, moveCursor} from '../cursor';

const CONSOLE = process.env.CONSOLE_URL ?? 'https://console.thewahda.com';
const STATE = path.resolve(__dirname, '../.state/demo-user.json');

/** Move + visual click + real click. Silently swallows if the selector is missing. */
async function smoothClick(
  s: any,
  selector: string,
  label: string,
  opts: {pause?: number; optional?: boolean} = {},
): Promise<boolean> {
  const el = s.page.locator(selector).first();
  try {
    await el.scrollIntoViewIfNeeded({timeout: 8000});
    const box = await el.boundingBox();
    if (!box) throw new Error(`no box for ${label}`);
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await moveCursor(s.page, x, y, {steps: 24, stepDelay: 14});
    await s.page
      .evaluate(([cx, cy]: number[]) => (window as any).__wdClick?.(cx, cy), [x, y])
      .catch(() => {});
    await s.page.waitForTimeout(140);
    await el.click({force: true});
    if (opts.pause) await s.page.waitForTimeout(opts.pause);
    return true;
  } catch (e) {
    if (opts.optional) {
      console.warn(`  smoothClick[${label}] optional, skipped: ${(e as Error).message.split('\n')[0]}`);
      return false;
    }
    throw e;
  }
}

/** Move cursor to a button + click via JS fallback (survives \"outside viewport\"). */
async function clickButton(s: any, textFragment: string, label: string): Promise<boolean> {
  const btn = s.page.locator(`button:has-text("${textFragment}")`).first();
  try {
    await btn.scrollIntoViewIfNeeded({timeout: 4000});
  } catch {}
  const box = await btn.boundingBox().catch(() => null);
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await moveCursor(s.page, cx, cy, {steps: 22, stepDelay: 14});
    await s.page
      .evaluate(([x, y]: number[]) => (window as any).__wdClick?.(x, y), [cx, cy])
      .catch(() => {});
  }
  const clicked = await s.page.evaluate((frag: string) => {
    const b = Array.from(document.querySelectorAll('button')).find((el) =>
      (el.textContent ?? '').includes(frag),
    ) as HTMLButtonElement | undefined;
    if (b && !b.disabled) { b.click(); return true; }
    return false;
  }, textFragment);
  if (!clicked) console.warn(`  clickButton[${label}] button not clickable (${textFragment})`);
  await s.page.waitForTimeout(600);
  return !!clicked;
}

/** Wait until a Step-N stepper title is the active one. */
async function waitForStepper(s: any, label: string, timeout = 15000): Promise<void> {
  await s.page
    .locator(`.ant-steps-item-active :text("${label}"), .ant-steps-item-process :text("${label}")`)
    .first()
    .waitFor({timeout})
    .catch(async () => {
      // fallback: any visible occurrence
      await s.page.locator(`:text("${label}")`).first().waitFor({timeout: 5000}).catch(() => {});
    });
  await s.page.waitForTimeout(600);
}

async function main() {
  const s = await newScene({
    scene: 'create-vm',
    record: true,
    viewport: {width: 1440, height: 900},
    storageState: STATE,
  });

  // ---------- Land on Instances page ----------
  for (let i = 0; i < 3; i++) {
    try {
      await s.page.goto(`${CONSOLE}/compute/instance`, {waitUntil: 'domcontentloaded', timeout: 120000});
      break;
    } catch {
      console.warn(`goto retry ${i + 1}`);
      await s.page.waitForTimeout(3000);
    }
  }
  await s.page.waitForLoadState('networkidle', {timeout: 20000}).catch(() => {});
  await s.page.waitForTimeout(3500);
  await installCursor(s.page);

  await moveCursor(s.page, 500, 250, {steps: 30});
  await shot(s, 'instances-list');
  await s.page.waitForTimeout(800);

  // ---------- Open wizard ----------
  await smoothClick(s, 'button.ant-btn-primary:visible', 'create', {pause: 3000});
  await installCursor(s.page);
  await moveCursor(s.page, 700, 300, {steps: 25});
  await waitForStepper(s, 'Base Config');
  await shot(s, 'step1-empty');

  // ---------- STEP 1 — Base Config ----------
  await smoothClick(s, 'tr:has-text("m1.small") input[type="radio"]', 'flavor', {pause: 1000});
  await installCursor(s.page);
  await shot(s, 'step1-flavor');

  // Ubuntu tab: the <input type="radio"> inside the antd radio-button-wrapper
  // is visually hidden (opacity 0, size 0), so Playwright refuses a normal
  // click — "element is outside of the viewport". Instead: move the cursor
  // to the visible <label> so the recording shows the intent, then fire the
  // click via JS on the label (which toggles the hidden radio for us).
  const ubuntuLabel = s.page
    .locator('label.ant-radio-button-wrapper:has-text("Ubuntu")')
    .first();
  await ubuntuLabel.scrollIntoViewIfNeeded({timeout: 8000}).catch(() => {});
  const ubox = await ubuntuLabel.boundingBox();
  if (ubox) {
    const cx = ubox.x + ubox.width / 2;
    const cy = ubox.y + ubox.height / 2;
    await moveCursor(s.page, cx, cy, {steps: 22, stepDelay: 14});
    await s.page
      .evaluate(([x, y]: number[]) => (window as any).__wdClick?.(x, y), [cx, cy])
      .catch(() => {});
  }
  await s.page.evaluate(() => {
    const lbl = Array.from(document.querySelectorAll('label.ant-radio-button-wrapper'))
      .find((l) => (l.textContent ?? '').trim() === 'Ubuntu') as HTMLLabelElement | undefined;
    lbl?.click();
    const input = lbl?.querySelector('input[type="radio"]') as HTMLInputElement | undefined;
    if (input && !input.checked) input.click();
  });
  await s.page.waitForTimeout(1200);
  await installCursor(s.page);
  await shot(s, 'step1-ubuntu');

  // Image row: wait for the table to actually contain an "Ubuntu" row
  // (change signal — proves the tab switch fired).
  await s.page.evaluate(() => window.scrollBy(0, 400));
  await s.page.waitForTimeout(1500);
  const ubuntuRow = s.page.locator('tr:has-text("Ubuntu")').filter({hasNotText: 'System Version'}).first();
  try {
    await ubuntuRow.waitFor({state: 'visible', timeout: 15000});
    await ubuntuRow.scrollIntoViewIfNeeded();
    const nameCell = ubuntuRow.locator('td').nth(1);
    const cbox = await nameCell.boundingBox();
    if (cbox) {
      const cx = cbox.x + cbox.width / 2;
      const cy = cbox.y + cbox.height / 2;
      await moveCursor(s.page, cx, cy, {steps: 25});
      await s.page.evaluate(([x, y]: number[]) => (window as any).__wdClick?.(x, y), [cx, cy]).catch(() => {});
      await s.page.waitForTimeout(140);
      await nameCell.click({force: true});
      await s.page.waitForTimeout(1200);
    }
  } catch (e) {
    console.warn(`  ubuntu image row not found: ${(e as Error).message.split('\n')[0]}`);
  }
  await installCursor(s.page);
  await shot(s, 'step1-image');

  // Bring the System Disk section into view.
  await s.page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const sd = labels.find((l) => l.textContent?.trim() === 'System Disk');
    sd?.scrollIntoView({block: 'center', behavior: 'instant'});
  });
  await s.page.waitForTimeout(700);
  await installCursor(s.page);
  await moveCursor(s.page, 600, 400, {steps: 20});
  await shot(s, 'step1-disk-view');

  // System Disk → Type is required. Open the Type dropdown, pick the first
  // option (SSD-GP1) via keyboard. Size auto-fills from the image minimum,
  // so we don't touch it — that was where the previous Tab+type dance was
  // sending focus into the flavor filter and breaking image selection.
  await smoothClick(
    s,
    '.ant-form-item:has(label:has-text("System Disk")) .ant-select-selector',
    'disk-type-open',
    {pause: 900, optional: true},
  );
  // Fallback if the strict-parent selector doesn't match.
  await smoothClick(
    s,
    '.ant-form-item:has(label) .ant-select-selector >> nth=1',
    'disk-type-open-fallback',
    {pause: 900, optional: true},
  );
  await installCursor(s.page);
  await moveCursor(s.page, 550, 480, {steps: 15});
  await shot(s, 'step1-disk-type-open');

  await s.page.keyboard.press('ArrowDown');
  await s.page.waitForTimeout(250);
  await s.page.keyboard.press('Enter');
  await s.page.waitForTimeout(900);
  // Close the dropdown by pressing Escape (mouse-clicking risked landing in the left sidebar).
  await s.page.keyboard.press('Escape');
  await s.page.waitForTimeout(400);
  await installCursor(s.page);
  await shot(s, 'step1-disk-picked');

  // System Disk → Size: default is the image minimum (10 GiB) but the
  // m1.small flavor requires >= 20. Bump directly through the number input.
  try {
    const sizeInput = s.page.locator('input.ant-input-number-input').first();
    await sizeInput.scrollIntoViewIfNeeded({timeout: 4000});
    await sizeInput.click({force: true});
    await sizeInput.fill('20');
    await s.page.keyboard.press('Tab');
    await s.page.waitForTimeout(600);
  } catch (e) {
    console.warn(`  size fill failed: ${(e as Error).message.split('\n')[0]}`);
  }
  await installCursor(s.page);
  await shot(s, 'step1-disk-sized');

  // Hover Next: Network Config as the payoff shot for Step 1.
  await s.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await s.page.waitForTimeout(500);
  try {
    const nb = s.page.locator('button:has-text("Next: Network Config")').first();
    const nbox = await nb.boundingBox();
    if (nbox) {
      await moveCursor(s.page, nbox.x + nbox.width / 2, nbox.y + nbox.height / 2, {steps: 25});
      await s.page.waitForTimeout(1200);
    }
  } catch {}
  await shot(s, 'step1-hover-next');

  // ---------- STEP 2 — Network Config ----------
  await clickButton(s, 'Next: Network Config', 'next-to-step2');
  await s.page.waitForTimeout(2500);
  await installCursor(s.page);
  await waitForStepper(s, 'Network Config');
  await s.page.evaluate(() => window.scrollTo(0, 0));
  await s.page.waitForTimeout(600);
  await moveCursor(s.page, 600, 300, {steps: 20});
  await shot(s, 'step2-empty');

  // Tick the first row in the Network table and the "default" row in the
  // Security Group table. Both are Ant checkboxes with a visually-hidden
  // <input> inside a wrapper, so Playwright's normal click refuses — fire
  // the click through JS instead.
  await s.page.evaluate(() => {
    // Network is the first table on the Network Config step.
    const tables = Array.from(document.querySelectorAll('table'));
    const netTable = tables[0];
    const netCb = netTable?.querySelector('tbody tr input[type="checkbox"]') as HTMLInputElement | undefined;
    if (netCb && !netCb.checked) netCb.click();

    // Security Group is the second (or the table containing a "default" row).
    let sgTable = tables[1];
    if (!sgTable || !sgTable.textContent?.includes('default')) {
      sgTable = tables.find((t) => (t.textContent ?? '').includes('default'));
    }
    const sgCb = sgTable?.querySelector('tbody tr input[type="checkbox"]') as HTMLInputElement | undefined;
    if (sgCb && !sgCb.checked) sgCb.click();
  });
  await s.page.waitForTimeout(900);

  // Scroll back to top so the screenshot shows the network row selected.
  await s.page.evaluate(() => window.scrollTo(0, 0));
  await s.page.waitForTimeout(400);
  await installCursor(s.page);
  await moveCursor(s.page, 700, 400, {steps: 15});
  await shot(s, 'step2-selected');

  // ---------- STEP 3 — System Config ----------
  await clickButton(s, 'Next: System Config', 'next-to-step3');
  await s.page.waitForTimeout(2500);
  await installCursor(s.page);
  await waitForStepper(s, 'System Config');
  await s.page.evaluate(() => window.scrollTo(0, 0));
  await s.page.waitForTimeout(500);
  await moveCursor(s.page, 600, 250, {steps: 18});
  await shot(s, 'step3-empty');

  // Fill Instance Name — the wizard's Name field has a distinctive
  // "Please input name" placeholder we can target directly. The generic
  // input[type=text] selector was picking up the Keypair search filter.
  await s.page.evaluate(() => {
    const nameInput = document.querySelector('input[placeholder="Please input name"]') as HTMLInputElement | null;
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(nameInput, 'web-01');
      nameInput.dispatchEvent(new Event('input', {bubbles: true}));
      nameInput.dispatchEvent(new Event('change', {bubbles: true}));
    }
  });
  await s.page.waitForTimeout(400);

  // The demo project has no keypair — switch Login Type to Password so the
  // wizard doesn't demand one, then fill a throwaway password.
  await s.page.evaluate(() => {
    const passwordTab = Array.from(document.querySelectorAll('label,button,span'))
      .find((el) => (el.textContent ?? '').trim() === 'Password') as HTMLElement | undefined;
    passwordTab?.click();
  });
  // Wait for the password inputs to actually appear in the DOM after the
  // tab switch — React re-renders can take a moment.
  await s.page.locator('input[type="password"]').first().waitFor({state: 'visible', timeout: 4000}).catch(() => {});
  await s.page.waitForTimeout(400);

  // Fill Login Name (defaults to 'ubuntu' via placeholder but the underlying
  // value is empty; some wizard versions require an explicit value).
  const loginName = s.page.locator('input[placeholder="ubuntu"]').first();
  await loginName.fill('ubuntu').catch(() => {});

  // Use Playwright .fill on each password input — it triggers React's onChange
  // properly and survives concurrent renders better than a raw setter.
  const pwds = s.page.locator('input[type="password"]');
  const pwdCount = await pwds.count();
  for (let i = 0; i < pwdCount; i++) {
    await pwds.nth(i).fill('DemoPass!42').catch(() => {});
    await s.page.waitForTimeout(200);
  }
  await s.page.waitForTimeout(600);
  await installCursor(s.page);
  await moveCursor(s.page, 700, 400, {steps: 15});
  await shot(s, 'step3-filled');

  // ---------- STEP 4 — Confirm Config ----------
  await clickButton(s, 'Next: Confirm Config', 'next-to-step4');
  await s.page.waitForTimeout(2500);
  await installCursor(s.page);
  await waitForStepper(s, 'Confirm Config');
  await s.page.evaluate(() => window.scrollTo(0, 0));
  await s.page.waitForTimeout(700);
  await moveCursor(s.page, 700, 350, {steps: 20});
  await shot(s, 'step4-confirm');

  // ---------- Cancel back to list (never click Create) ----------
  try {
    await smoothClick(s, 'button:has-text("Cancel"):visible', 'cancel', {pause: 1200, optional: true});
    // If a confirmation modal appears, click its primary "OK"/"Confirm" button.
    await smoothClick(s, '.ant-modal button.ant-btn-primary', 'confirm-cancel', {
      pause: 1500,
      optional: true,
    });
  } catch {}
  await installCursor(s.page);
  await shot(s, 'returned');

  await finalizeGif(s, 'hero', {fps: 14, width: 1280});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
