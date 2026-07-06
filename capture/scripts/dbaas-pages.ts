/**
 * dbaas-pages.ts — captures for the Databases section.
 * URL discovery via sidebar (like network-lb.ts).
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

async function main() {
  const s = await newScene({scene: 'dbaas', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});

  // Land somewhere and discover Databases sidebar URLs via DOM enumeration.
  await goto(s.page, `${CONSOLE}/base/overview`);

  const dbLinks = await s.page.evaluate(() => {
    // Look for menu items whose text matches Databases-family names
    const items = Array.from(document.querySelectorAll('.ant-menu-item'));
    return items
      .filter((el) => /Instance|Backup|Config|Configuration/i.test(el.textContent ?? ''))
      .map((el) => ({
        text: (el.textContent ?? '').trim(),
        rect: el.getBoundingClientRect(),
      }));
  });
  console.log('DB menu items found:', JSON.stringify(dbLinks, null, 2));

  // Expand Database parent submenu first (it's collapsed by default).
  await s.page.evaluate(() => {
    const parents = Array.from(document.querySelectorAll('.ant-menu-submenu-title'));
    const dbParent = parents.find((el) => (el.textContent ?? '').trim() === 'Database');
    (dbParent as HTMLElement)?.click();
  });
  await s.page.waitForTimeout(1500);

  // Now find the children and click each in turn to discover URLs
  const clickAndCapture = async (menuText: string, filename: string) => {
    const url = await s.page.evaluate((txt: string) => {
      const items = Array.from(document.querySelectorAll('.ant-menu-item'));
      const target = items.find((el) => (el.textContent ?? '').trim() === txt);
      if (target) {
        (target as HTMLElement).click();
        return true;
      }
      return false;
    }, menuText);
    if (!url) {
      console.warn(`[${menuText}] not found in menu`);
      return;
    }
    await s.page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
    await s.page.waitForTimeout(2500);
    console.log(`[${menuText}] URL: ${s.page.url()}`);
    await shot(s, filename);
  };

  await clickAndCapture('Instances', 'instances-list');
  await clickAndCapture('Backups', 'backups-list');
  await clickAndCapture('Configuration Groups', 'config-groups-list');

  // Go back to instances list and click Create Instance
  await s.page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.ant-menu-item'));
    const target = items.find((el) => (el.textContent ?? '').trim() === 'Instances');
    (target as HTMLElement)?.click();
  });
  await s.page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  await s.page.waitForTimeout(2500);

  const createBtn = s.page.locator('button:has-text("Create"):visible, button.ant-btn-primary:visible').first();
  await createBtn.click({force: true, timeout: 4000}).catch(() => {});
  await s.page.waitForTimeout(3000);
  await shot(s, 'create-instance-step1');

  await s.context.close();
  await s.browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
