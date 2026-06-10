# Capture toolkit

Playwright + ffmpeg + gifski pipeline for screenshots and animated walkthroughs
of the Skyline console at [console.thewahda.com](https://console.thewahda.com).

## Scripts

- `scripts/skyline-login.ts` — log in to Skyline, save storageState to `.state/demo-user.json`
- `scripts/create-vm.ts` — Create Instance wizard Step 1 deep-walkthrough
- `scripts/final.ts` — single all-in-one run: login + create-vm + GIF
- `scripts/native-capture.ts` — alternative using ffmpeg avfoundation screen recording (needs macOS Screen Recording permission)

## Quick start

```bash
# 1. Put demo-user's password into a file
echo -n 'YOUR_PASS' > /tmp/wahda_pass.txt

# 2. Run a capture
npx tsx capture/scripts/final.ts

# 3. Output
ls capture/output/screenshots/create-vm/  # PNGs
ls capture/output/gifs/                   # GIF
```

## Cursor overlay

Native browser cursors are not captured by Playwright's video recording. We
inject an SVG cursor (`cursor.ts`) and animate it manually. The cursor is
appended to `<html>` (outside React's `<body>` tree) and self-heals via a
MutationObserver if Skyline ever removes it. It is anchored at `top: 0; left: 0`
so `transform: translate(x, y)` works from the viewport origin.
