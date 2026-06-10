/**
 * cursor.ts — visible cursor + click ripple overlay for Playwright captures.
 *
 * Playwright doesn't render the OS cursor in screenshots/videos. We inject a
 * fixed-position SVG cursor that follows page.mouse.move() calls, plus a
 * radial click ripple on each click. This way Skyline screenshots and GIFs
 * show a visible mouse pointer with smooth motion — like AWS / GCP docs.
 */
import {Page} from 'playwright';

export async function installCursor(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      #wd-cursor {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        width: 32px;
        height: 38px;
        pointer-events: none;
        transition: transform 32ms linear, opacity 200ms;
        will-change: transform, opacity;
        opacity: 1;
      }
      #wd-cursor svg {
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 1px rgba(0,0,0,0.9));
      }
      .wd-click-ripple {
        position: fixed;
        z-index: 2147483646;
        width: 36px;
        height: 36px;
        margin-left: -18px;
        margin-top: -18px;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.55);
        box-shadow: 0 0 14px rgba(37, 99, 235, 0.6);
        pointer-events: none;
        transform: scale(0.4);
        animation: wd-click-ripple 520ms ease-out forwards;
      }
      @keyframes wd-click-ripple {
        0%   { transform: scale(0.4); opacity: 1; }
        100% { transform: scale(3.0); opacity: 0; }
      }
    `,
  });

  await page.evaluate(() => {
    // Remove + re-create (Skyline React may wipe DOM on route changes)
    const old = document.getElementById('wd-cursor');
    if (old) old.remove();
    const c = document.createElement('div');
    c.id = 'wd-cursor';
    c.innerHTML = `<svg viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 1 L1.5 14.5 L5.5 11 L8.6 16.4 L10.5 15.3 L7.4 9.9 L12.5 9.5 Z"
            fill="#0f172a" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"
            paint-order="stroke"/>
    </svg>`;
    document.documentElement.appendChild(c);
    (window as any).__wdMoveCursor = (x: number, y: number) => {
      c.style.transform = `translate(${x}px, ${y}px)`;
    };
    (window as any).__wdClick = (x: number, y: number) => {
      const r = document.createElement('div');
      r.className = 'wd-click-ripple';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      document.documentElement.appendChild(r);
      setTimeout(() => r.remove(), 500);
    };
    // Self-heal: if React unmounts the cursor, re-append it
    const obs = new MutationObserver(() => {
      if (!document.getElementById('wd-cursor')) {
        document.documentElement.appendChild(c);
      }
    });
    obs.observe(document.documentElement, {childList: true, subtree: false});
  });
}

export interface MoveOptions {
  /** Number of intermediate steps for smooth motion. Higher = smoother + slower. */
  steps?: number;
  /** Delay between steps in ms. */
  stepDelay?: number;
}

/**
 * Move the visible cursor (and Playwright's hidden mouse) smoothly from
 * its current position to (x, y). Internal state tracks the last (x, y).
 */
const _state = new WeakMap<Page, {x: number; y: number}>();

export async function moveCursor(
  page: Page,
  x: number,
  y: number,
  opts: MoveOptions = {},
): Promise<void> {
  const steps = opts.steps ?? 45;
  const stepDelay = opts.stepDelay ?? 16;
  const from = _state.get(page) ?? {x: 20, y: 20};

  // Playwright's own mouse — needed for the click target to fire
  await page.mouse.move(x, y, {steps});

  for (let i = 1; i <= steps; i++) {
    const ix = from.x + ((x - from.x) * i) / steps;
    const iy = from.y + ((y - from.y) * i) / steps;
    await page.evaluate(([cx, cy]) => (window as any).__wdMoveCursor(cx, cy), [ix, iy]);
    await page.waitForTimeout(stepDelay);
  }
  _state.set(page, {x, y});
}

export async function clickAt(
  page: Page,
  x: number,
  y: number,
  opts: MoveOptions = {},
): Promise<void> {
  await moveCursor(page, x, y, opts);
  await page.evaluate(([cx, cy]) => (window as any).__wdClick(cx, cy), [x, y]);
  await page.waitForTimeout(150);
  await page.mouse.click(x, y);
}

/**
 * Smoothly move to a Playwright element and click it.
 */
export async function clickElement(
  page: Page,
  selector: string,
  opts: MoveOptions = {},
): Promise<void> {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error(`element not visible: ${selector}`);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await clickAt(page, cx, cy, opts);
}

export async function typeInto(
  page: Page,
  selector: string,
  text: string,
  opts: {delay?: number} = {},
): Promise<void> {
  await clickElement(page, selector);
  await page.locator(selector).first().fill('');
  await page.locator(selector).first().type(text, {delay: opts.delay ?? 35});
}
