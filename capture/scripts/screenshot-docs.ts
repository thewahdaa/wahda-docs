/**
 * Capture rendered docs page screenshots for preview.
 */
import {chromium} from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const URL = process.env.URL ?? 'http://localhost:3737';
const PAGE = process.env.PAGE ?? '/';
const OUT = path.resolve(__dirname, '../output/site-preview');
fs.mkdirSync(OUT, {recursive: true});

async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2});
  const p = await ctx.newPage();
  await p.goto(URL + PAGE, {waitUntil: 'networkidle'});
  await p.waitForTimeout(800);

  // landing page screenshot
  const landing = path.join(OUT, '01-landing.png');
  await p.screenshot({path: landing, fullPage: false});
  console.log('landing →', landing);

  // create-vm page top
  await p.goto(URL + '/compute/create-vm', {waitUntil: 'networkidle'});
  await p.waitForTimeout(500);
  const top = path.join(OUT, '02-create-vm-top.png');
  await p.screenshot({path: top, fullPage: false});
  console.log('create-vm top →', top);

  // create-vm page full
  const full = path.join(OUT, '03-create-vm-full.png');
  await p.screenshot({path: full, fullPage: true});
  console.log('create-vm full →', full);

  await b.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
