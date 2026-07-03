/**
 * network-pages.ts — captures for the Security Groups and Floating IPs docs.
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

// --- Security Groups ---
async function captureSecurityGroups() {
  const s = await newScene({scene: 'network-security-groups', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});
  await goto(s.page, `${CONSOLE}/network/security-group`);
  await shot(s, 'list');

  // Click "default" security group name → detail (rules) page.
  const defaultLink = s.page.locator('a:has-text("default"), td:has-text("default") a').first();
  await defaultLink.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2500);
  await shot(s, 'default-detail');

  // Back to list + open Create Security Group.
  await goto(s.page, `${CONSOLE}/network/security-group`);
  const createBtn = s.page.locator('button:has-text("Create"):visible').first();
  await createBtn.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2000);
  await shot(s, 'create-sg');

  // Cancel out; click Create Rule from the default detail page.
  await s.page.keyboard.press('Escape').catch(() => {});
  await s.page.waitForTimeout(600);
  await defaultLink.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2000);
  const createRuleBtn = s.page.locator('button:has-text("Create Rule"), button:has-text("Add Rule")').first();
  await createRuleBtn.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2000);
  await shot(s, 'create-rule');

  await s.context.close();
  await s.browser.close();
}

// --- Floating IPs ---
async function captureFloatingIPs() {
  const s = await newScene({scene: 'network-floating-ips', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});
  await goto(s.page, `${CONSOLE}/network/floatingip`);
  await shot(s, 'list');

  // Open Allocate / Create FIP dialog.
  const allocBtn = s.page.locator('button:has-text("Allocate"), button:has-text("Create Floating IP"), button.ant-btn-primary:visible').first();
  await allocBtn.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2000);
  await shot(s, 'allocate');

  // Escape + try the More actions on an existing FIP row (Associate).
  await s.page.keyboard.press('Escape').catch(() => {});
  await s.page.waitForTimeout(600);
  const moreLink = s.page.locator('td:has-text("165.99.104.") ~ * >> text=More, tr:has-text("165.99.104.") a:has-text("More")').first();
  await moreLink.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(1200);
  await shot(s, 'more-actions');

  await s.context.close();
  await s.browser.close();
}

async function main() {
  console.log('\n=== security groups ==='); await captureSecurityGroups();
  console.log('\n=== floating IPs ===');    await captureFloatingIPs();
}

main().catch((e) => { console.error(e); process.exit(1); });
