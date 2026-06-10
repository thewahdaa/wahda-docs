import {newScene, shot, finalizeGif} from '../capture';
import {installCursor, clickAt, moveCursor} from '../cursor';

async function main() {
  const s = await newScene({scene: 'smoke', record: true});
  // Use a stable, minimal external page for the smoke test
  await s.page.goto('data:text/html,<html><body style="font-family:-apple-system;padding:40px;background:#fafafa"><h1 style="color:#16a34a">The Wahda Cloud — capture toolkit smoke test</h1><button id="hi" style="padding:10px 18px;font-size:16px;border-radius:8px;background:#16a34a;color:white;border:none">Click me</button><p id="msg" style="color:#444"></p><script>document.getElementById("hi").onclick=()=>{document.getElementById("msg").textContent="Cursor visible. Click registered. ✅"}</script></body></html>');
  await installCursor(s.page);
  await s.page.waitForTimeout(500);
  await moveCursor(s.page, 200, 200, {steps: 40, stepDelay: 18});
  await shot(s, 'initial');
  await moveCursor(s.page, 700, 500, {steps: 50, stepDelay: 14});
  await clickAt(s.page, 145, 196); // not the button — just curve
  await moveCursor(s.page, 200, 196, {steps: 20});
  await clickAt(s.page, 200, 196); // the button center area
  await s.page.waitForTimeout(800);
  await shot(s, 'after-click');
  await finalizeGif(s, 'demo', {fps: 16, width: 1100});
}
main().catch((e) => { console.error(e); process.exit(1); });
