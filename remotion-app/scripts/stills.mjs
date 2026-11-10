// Render review stills from one bundle and one browser, much faster than calling `remotion still` per frame.
//
//   node scripts/stills.mjs <CompositionId> <outDir> --frames=0,75,118        specific frames
//   node scripts/stills.mjs <CompositionId> <outDir> --every=30 [--range=0-600]  a regular sample
//   options: --width=720 (output width; height follows the composition), --concurrency=1, --log=5 (progress every N frames),
//            --props='{"fx":"nolens"}' (input props; the Nvidia short reads `fx` to switch post passes off for profiling)
//
// Uses software WebGL (SwiftShader). Set REMOTION_BROWSER to a Chrome/Chromium binary if Remotion's own
// download is not usable on the machine.
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderFrames, renderStill, selectComposition} from '@remotion/renderer';

const [id, outDir, ...rest] = process.argv.slice(2);
if (!id || !outDir) { console.error('usage: node scripts/stills.mjs <CompositionId> <outDir> --frames=a,b,c | --every=N [--range=a-b]'); process.exit(2); }
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, '').split('=')));
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const chromiumOptions = {gl: 'swiftshader'};
const t0 = Date.now(), log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
log('bundled');
const inputProps = JSON.parse(opt.props ?? '{}');
const comp = await selectComposition({serveUrl, id, browserExecutable, chromiumOptions, inputProps});
const width = Number(opt.width ?? 720), scale = width / comp.width;
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions});
try {
  if (opt.frames) {
    for (const f of opt.frames.split(',').map(Number)) {
      await renderStill({composition: comp, serveUrl, frame: f, output: path.join(outDir, `f${String(f).padStart(4, '0')}.jpeg`), imageFormat: 'jpeg', jpegQuality: 88,
        scale, puppeteerInstance: browser, chromiumOptions, timeoutInMilliseconds: 240000, inputProps});
      log(`frame ${f}`);
    }
  } else {
    const every = Number(opt.every ?? 30), [a, b] = (opt.range ?? `0-${comp.durationInFrames - 1}`).split('-').map(Number);
    await renderFrames({composition: comp, serveUrl, outputDir: outDir, imageFormat: 'jpeg', jpegQuality: 88, scale, frameRange: [a, b], everyNthFrame: every,
      concurrency: Number(opt.concurrency ?? 1), puppeteerInstance: browser, chromiumOptions, timeoutInMilliseconds: 240000, inputProps, muted: true,
      onStart: () => undefined, onFrameUpdate: (n) => { if (n % Number(opt.log ?? 5) === 0) log(`${n} frames`); }});
    // Remotion numbers the files by index; rename them to the frame they show.
    for (const name of fs.readdirSync(outDir)) {
      const m = /^element-(\d+)\.jpeg$/.exec(name);
      if (m) fs.renameSync(path.join(outDir, name), path.join(outDir, `f${String(a + Number(m[1]) * every).padStart(4, '0')}.jpeg`));
    }
  }
} finally { await browser.close({silent: true}); }
log('done');
