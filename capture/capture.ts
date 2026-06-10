/**
 * capture.ts — high-level capture helpers.
 *
 * shot(page, name)             — save a clean PNG under output/screenshots/<scene>/<name>.png
 * startRecording(scene)        — begin a webm video capture for this scene
 * stopAndGif(scene, name, ...) — stop video, transcode to gif via ffmpeg+gifski
 *
 * Each "scene" gets its own dir so a walkthrough page can mix stills and gifs
 * cleanly.
 */
import * as fs from 'fs';
import * as path from 'path';
import {execSync} from 'child_process';
import {Browser, BrowserContext, Page, chromium} from 'playwright';

export const OUTPUT_DIR = path.resolve(__dirname, 'output');
export const SHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
export const VID_DIR = path.join(OUTPUT_DIR, 'videos');
export const GIF_DIR = path.join(OUTPUT_DIR, 'gifs');

for (const d of [OUTPUT_DIR, SHOT_DIR, VID_DIR, GIF_DIR]) {
  fs.mkdirSync(d, {recursive: true});
}

export interface Scene {
  scene: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  videoEnabled: boolean;
  step: number;
}

export interface SceneOptions {
  scene: string;
  viewport?: {width: number; height: number};
  record?: boolean;
  baseURL?: string;
  storageState?: string;
}

export async function newScene(opts: SceneOptions): Promise<Scene> {
  const viewport = opts.viewport ?? {width: 1440, height: 900};
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
    recordVideo: opts.record
      ? {dir: path.join(VID_DIR, opts.scene), size: viewport}
      : undefined,
    storageState: opts.storageState,
  });
  const page = await context.newPage();
  fs.mkdirSync(path.join(SHOT_DIR, opts.scene), {recursive: true});
  return {scene: opts.scene, browser, context, page, videoEnabled: !!opts.record, step: 0};
}

export async function shot(s: Scene, name: string): Promise<string> {
  s.step += 1;
  const file = path.join(SHOT_DIR, s.scene, `${String(s.step).padStart(2, '0')}-${name}.png`);
  await s.page.screenshot({path: file, fullPage: false});
  console.log(`  shot → ${file}`);
  return file;
}

/**
 * Encode the last recorded webm as a polished .gif under output/gifs/.
 * Uses ffmpeg → frames → gifski for high quality + small size.
 */
export async function finalizeGif(
  s: Scene,
  name: string,
  opts: {fps?: number; width?: number} = {},
): Promise<string> {
  const fps = opts.fps ?? 16;
  const width = opts.width ?? 1280;

  await s.context.close(); // flushes the webm
  const videoDir = path.join(VID_DIR, s.scene);
  const webms = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (!webms.length) throw new Error(`no webm in ${videoDir}`);
  const latest = webms.map((f) => path.join(videoDir, f)).sort((a, b) =>
    fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs > 0 ? 1 : -1,
  )[0];

  const framesDir = fs.mkdtempSync('/tmp/wd-frames-');
  execSync(
    `ffmpeg -y -loglevel error -i "${latest}" -vf "fps=${fps},scale=${width}:-1:flags=lanczos" "${framesDir}/f-%04d.png"`,
  );
  const gifPath = path.join(GIF_DIR, `${s.scene}--${name}.gif`);
  execSync(
    `gifski --fps ${fps} --width ${width} --quality 85 --output "${gifPath}" "${framesDir}"/f-*.png`,
  );
  fs.rmSync(framesDir, {recursive: true, force: true});
  console.log(`  gif  → ${gifPath}`);
  await s.browser.close();
  return gifPath;
}

export async function teardown(s: Scene): Promise<void> {
  await s.context.close();
  await s.browser.close();
}
