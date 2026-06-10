import * as fs from 'fs';
import * as path from 'path';
import {newScene, shot, finalizeGif} from '../capture';
import {installCursor, clickElement, moveCursor, typeInto} from '../cursor';

const CONSOLE = process.env.CONSOLE_URL ?? 'https://console.thewahda.com';
const USER = process.env.WAHDA_USER ?? 'demo-user';
const PASS = require("fs").readFileSync("/tmp/wahda_pass.txt", "utf8").replace(/\s+$/,"");


const STATE_DIR = path.resolve(__dirname, '../.state');
fs.mkdirSync(STATE_DIR, {recursive: true});
const STATE = path.join(STATE_DIR, 'demo-user.json');

async function main() {
  const s = await newScene({scene: 'login', record: true, viewport: {width: 1440, height: 900}});
  await s.page.goto(`${CONSOLE}/auth/login`, {waitUntil: "domcontentloaded", timeout: 60000});
  await s.page.waitForTimeout(2000);
  await installCursor(s.page);
  await moveCursor(s.page, 720, 365, {steps: 40, stepDelay: 18});
  await shot(s, 'login-page');

  await typeInto(s.page, '#normal_login_username', USER, {delay: 50});
  await typeInto(s.page, '#normal_login_password', PASS, {delay: 35});
  await s.page.waitForTimeout(400);
  await shot(s, 'login-filled');

  await clickElement(s.page, 'button[type="submit"]');
  await s.page.waitForURL((u) => !u.toString().includes('/auth/login'), {timeout: 25000});
  await s.page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  await s.page.waitForTimeout(2500);
  await installCursor(s.page);
  await moveCursor(s.page, 500, 400, {steps: 30});
  await shot(s, 'dashboard');

  await s.context.storageState({path: STATE});
  console.log(`storageState saved to ${STATE}`);
  await finalizeGif(s, 'flow', {fps: 14, width: 1280});
}
main().catch((e) => { console.error(e); process.exit(1); });
