/**
 * network-lb.ts — Load Balancer walkthrough.
 * Captures: list page, existing LB detail, Create LB wizard (all steps).
 */
import * as path from 'path';
import {newScene, shot} from '../capture';

const CONSOLE = process.env.CONSOLE_URL ?? 'https://console.thewahda.com';
const STATE = path.resolve(__dirname, '../.state/demo-user.json');

async function goto(page: any, url: string): Promise<void> {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90000});
      break;
    } catch { await page.waitForTimeout(2500); }
  }
  await page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  await page.waitForTimeout(2500);
}

async function tryNext(page: any): Promise<boolean> {
  const btn = page.locator('button:has-text("Next"):visible, button:has-text("Skip"):visible').first();
  try {
    await btn.click({force: true, timeout: 3000});
    await page.waitForTimeout(2500);
    return true;
  } catch { return false; }
}

async function main() {
  const s = await newScene({scene: 'network-lb', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});

  // Land on Topology (known valid URL) — this expands the Network submenu.
  await goto(s.page, `${CONSOLE}/network/topo`);

  // Dump all ant-menu-items with their text + parent href attributes.
  const dump = await s.page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.ant-menu-item, .ant-menu-submenu, li, a'));
    return items
      .map((el) => ({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 60),
        txt: (el.textContent || '').trim().slice(0, 40),
        href: (el as HTMLAnchorElement).href || (el.querySelector('a') as HTMLAnchorElement)?.href || null,
      }))
      .filter((r) => /load|balanc|lb/i.test(r.txt) || /load|balanc|lb/i.test(r.href || ''));
  });
  console.log('LB candidates:', JSON.stringify(dump, null, 2));

  // Click via ant-menu-item exact filter — anchor tag or LI both fine.
  const clicked = await s.page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.ant-menu-item'));
    const target = items.find((el) => (el.textContent || '').trim() === 'Load Balancers');
    if (target) {
      (target as HTMLElement).click();
      return true;
    }
    return false;
  });
  console.log(`[LB item clicked via evaluate: ${clicked}]`);
  await s.page.waitForTimeout(3500);

  const lbListUrl = s.page.url();
  console.log(`[LB list URL: ${lbListUrl}]`);
  await shot(s, 'list');

  // --- 2. Existing LB detail (click the k8s-api-lb row) ---
  const lbLink = s.page.locator('a:has-text("k8s-api-lb"), td:has-text("k8s-api-lb") a').first();
  await lbLink.click({force: true, timeout: 4000}).catch(() => {});
  await s.page.waitForTimeout(2500);
  await shot(s, 'detail');

  // --- 3. Create LB wizard ---
  await goto(s.page, lbListUrl);
  const create = s.page.locator('button:has-text("Create Loadbalancer"), button:has-text("Create Load Balancer"), button.ant-btn-primary:visible').first();
  await create.click({force: true, timeout: 4000}).catch(() => {});
  await s.page.waitForTimeout(3000);
  await shot(s, 'wizard-step1-basic');

  // --- Fill Step 1: name + tick first network row ---
  await s.page.evaluate(() => {
    const nameInput = document.querySelector('input[placeholder="Please input name"]') as HTMLInputElement | null;
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(nameInput, 'docs-example-lb');
      nameInput.dispatchEvent(new Event('input', {bubbles: true}));
      nameInput.dispatchEvent(new Event('change', {bubbles: true}));
    }
    // Tick the first radio button in the Owned Network table
    const netRadio = document.querySelector('table tbody tr input[type="radio"]') as HTMLInputElement | null;
    if (netRadio && !netRadio.checked) netRadio.click();
  });
  await s.page.waitForTimeout(1200);

  // Advance to Listener step
  await s.page.locator('button:has-text("Next: Listener Detail")').first().click({force: true, timeout: 5000}).catch(() => {});
  await s.page.waitForTimeout(3000);
  await shot(s, 'wizard-step2-listener');

  // Fill listener name + pick TCP + port 80
  await s.page.evaluate(() => {
    const nameInput = document.querySelector('input[placeholder="Please input name"]') as HTMLInputElement | null;
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(nameInput, 'web-listener');
      nameInput.dispatchEvent(new Event('input', {bubbles: true}));
      nameInput.dispatchEvent(new Event('change', {bubbles: true}));
    }
    const portInput = document.querySelector('input.ant-input-number-input') as HTMLInputElement | null;
    if (portInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(portInput, '80');
      portInput.dispatchEvent(new Event('input', {bubbles: true}));
      portInput.dispatchEvent(new Event('change', {bubbles: true}));
    }
  });
  await s.page.waitForTimeout(1000);

  // Advance to Pool step
  await s.page.locator('button:has-text("Next: Pool Detail")').first().click({force: true, timeout: 5000}).catch(() => {});
  await s.page.waitForTimeout(3000);
  await shot(s, 'wizard-step3-pool');

  // Fill pool name (accept default algorithm/protocol)
  await s.page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[placeholder="Please input name"]'));
    const lastEmpty = inputs.find((i) => (i as HTMLInputElement).value === '') as HTMLInputElement | undefined;
    if (lastEmpty) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(lastEmpty, 'web-pool');
      lastEmpty.dispatchEvent(new Event('input', {bubbles: true}));
      lastEmpty.dispatchEvent(new Event('change', {bubbles: true}));
    }
  });
  await s.page.waitForTimeout(800);

  // Advance to Member step
  await s.page.locator('button:has-text("Next: Member Detail")').first().click({force: true, timeout: 5000}).catch(() => {});
  await s.page.waitForTimeout(3000);
  await shot(s, 'wizard-step4-member');

  // Advance to Health Monitor step (leave Members empty — optional)
  await s.page.locator('button:has-text("Next: Health Monitor Detail")').first().click({force: true, timeout: 5000}).catch(() => {});
  await s.page.waitForTimeout(3000);
  await shot(s, 'wizard-step5-monitor');

  // Cancel — never actually create the LB
  await s.page.locator('button:has-text("Cancel")').first().click({force: true, timeout: 3000}).catch(() => {});
  await s.page.waitForTimeout(1500);
  await s.page.locator('.ant-modal button.ant-btn-primary').first().click({force: true, timeout: 2000}).catch(() => {});
  await s.page.waitForTimeout(1500);

  await s.context.close();
  await s.browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
