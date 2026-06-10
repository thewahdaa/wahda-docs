import {chromium} from 'playwright';
async function main() {
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, ignoreHTTPSErrors: true});
  const p = await ctx.newPage();
  await p.goto('https://console.thewahda.com/', {waitUntil: 'networkidle', timeout: 30000});
  await p.waitForTimeout(2500);
  console.log('URL:', p.url());
  const inputs = await p.$$eval('input', els => els.map(e => ({
    type: e.type, name: e.name, id: e.id, placeholder: e.placeholder,
    visible: !!(e.offsetParent || e.getClientRects().length),
    rect: e.getBoundingClientRect().toJSON(),
  })));
  console.log('inputs:', JSON.stringify(inputs, null, 2));
  const buttons = await p.$$eval('button', els => els.map(e => ({
    text: e.textContent?.trim()?.slice(0, 60), type: e.type,
    visible: !!(e.offsetParent || e.getClientRects().length),
  })));
  console.log('buttons:', JSON.stringify(buttons.filter(b => b.visible), null, 2));
  await p.screenshot({path: '/tmp/console-login.png'});
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
