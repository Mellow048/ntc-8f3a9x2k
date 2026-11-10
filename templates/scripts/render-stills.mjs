// usage: node templates/scripts/render-stills.mjs <compositionId> <outPrefix> <frame,frame,...> [scale]
// Bundles remotion-app, renders stills (swiftshader via @sparticuz/chromium, default path /tmp/chromium).
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
const [compId, prefix, frames, scale = "0.5"] = process.argv.slice(2);
const appRoot = path.resolve(fileURLToPath(new URL("../../remotion-app", import.meta.url)));
const browserExecutable = process.env.CHROME_PATH || "/tmp/chromium";
process.chdir(appRoot);
const req = createRequire(path.join(appRoot, "package.json"));
const importFromApp = async (name) => import(pathToFileURL(req.resolve(name)).href);
const { bundle } = await importFromApp("@remotion/bundler");
const { renderStill, selectComposition } = await importFromApp("@remotion/renderer");
const serveUrl = await bundle({ entryPoint: path.join(appRoot, "src/index.ts"), publicDir: path.join(appRoot, "public") });
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable, chromiumOptions: { gl: "angle" } });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 240)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    browserExecutable, chromiumOptions: { gl: "angle" }, timeoutInMilliseconds: 240000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  process.exitCode = 0;
}
