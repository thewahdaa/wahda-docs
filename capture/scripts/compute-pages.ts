/**
 * compute-pages.ts — capture the plain list pages under Compute and the
 * flows a tenant actually cares about: uploading a custom image, creating
 * or importing a key pair.
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

async function captureImages() {
  const s = await newScene({scene: 'compute-images', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});
  await goto(s.page, `${CONSOLE}/compute/image`);

  // Base list — "Current Project Images" tab lands active. Capture it,
  // then flip to Public Images to show the catalog.
  await shot(s, 'list-empty');

  const publicTab = s.page.locator('.ant-tabs-tab :text("Public Images"), :text("Public Images")').first();
  await publicTab.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(1500);
  await shot(s, 'list-public');

  // Open Create Image dialog/route.
  const createBtn = s.page.locator('button:has-text("Create Image")').first();
  await createBtn.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2500);
  await shot(s, 'create-image');

  await s.context.close();
  await s.browser.close();
}

async function captureFlavors() {
  const s = await newScene({scene: 'compute-flavors', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});
  await goto(s.page, `${CONSOLE}/compute/flavor`);
  await shot(s, 'list');
  await s.context.close();
  await s.browser.close();
}

async function captureKeyPairs() {
  const s = await newScene({scene: 'compute-keypairs', record: false, viewport: {width: 1440, height: 900}, storageState: STATE});
  await goto(s.page, `${CONSOLE}/compute/keypair`);
  await shot(s, 'list-empty');

  // Open Create Keypair dialog.
  const createBtn = s.page.locator('button:has-text("Create Keypair")').first();
  await createBtn.click({force: true}).catch(() => {});
  await s.page.waitForTimeout(2000);
  await shot(s, 'create-keypair');

  await s.context.close();
  await s.browser.close();
}

async function main() {
  console.log('\n=== images ===');   await captureImages();
  console.log('\n=== flavors ===');  await captureFlavors();
  console.log('\n=== keypairs ==='); await captureKeyPairs();
}

main().catch((e) => { console.error(e); process.exit(1); });
