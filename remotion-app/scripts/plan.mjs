// Split a composition into frame ranges, one per parallel CI render job.
//
//   node scripts/plan.mjs <CompositionId> [chunks=20]
//
// The compositions come from src/index.ts; set REMOTION_ENTRY to bundle another entry file instead.
//
// Asks Remotion how long the composition is, then prints two lines in GitHub's step-output format:
//   frames=2075
//   matrix={"include":[{"part":"01","range":"0-102"}, ...]}
// Every range is inclusive, the way `remotion render --frames=a-b` wants it. Parts are numbered so that sorting the
// file names puts them back in order.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';

const [id, chunksArg] = process.argv.slice(2);
if (!id) { console.error('usage: node scripts/plan.mjs <CompositionId> [chunks]'); process.exit(2); }
const serveUrl = await bundle({entryPoint: path.resolve(process.env.REMOTION_ENTRY || 'src/index.ts')});
const comp = await selectComposition({serveUrl, id, browserExecutable: process.env.REMOTION_BROWSER || undefined, chromiumOptions: {gl: 'swiftshader'}, inputProps: {}});
const frames = comp.durationInFrames;
// no part shorter than one second: a tiny part costs a whole job's set-up for nothing
const chunks = Math.max(1, Math.min(Number(chunksArg ?? 20) || 20, Math.floor(frames / comp.fps) || 1));
const include = [];
for (let i = 0; i < chunks; i++) {
  const a = Math.floor((frames * i) / chunks), b = Math.floor((frames * (i + 1)) / chunks) - 1;
  include.push({part: String(i + 1).padStart(2, '0'), range: `${a}-${b}`});
}
console.error(`${id}: ${frames} frames at ${comp.fps} fps, ${comp.width}x${comp.height}, ${chunks} parts`);
console.log(`frames=${frames}`);
console.log(`matrix=${JSON.stringify({include})}`);
