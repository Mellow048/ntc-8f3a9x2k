// prints the shot table of a film: index, kind/v, first frame, last frame, mid frame
import fs from 'node:fs';
const film = process.argv[2] ?? 'binance';
const src = fs.readFileSync(`src/videos/${film}/story.ts`, 'utf8');
const words = JSON.parse(fs.readFileSync(`src/videos/${film}/words.json`, 'utf8'));
const re = /^\s*s\((\d+), '(\w+)', '(\w+)'/gm; const shots = []; let m;
while ((m = re.exec(src))) shots.push({word: +m[1], kind: m[2], v: m[3]});
const at = (i) => Math.max(0, Math.round(words[shots[i].word].start * 30) - 2), total = Math.round((words[words.length - 1].end + 1.55) * 30);
const rows = shots.map((s, i) => ({i, ...s, a: at(i), b: (i + 1 < shots.length ? at(i + 1) : total) - 1}));
const mode = process.argv[3] ?? 'table';
if (mode === 'mid') console.log(rows.map((r) => Math.round((r.a + r.b) / 2)).join(','));
else if (mode === 'late') console.log(rows.map((r) => r.b - 2).join(','));
else if (mode === 'early') console.log(rows.map((r) => r.a + 1).join(','));
else if (mode === 'cuts') console.log(rows.slice(1).flatMap((r) => [r.a - 1, r.a]).join(','));
else for (const r of rows) console.log(String(r.i).padStart(2), `${r.kind}/${r.v}`.padEnd(18), String(r.a).padStart(5), String(r.b).padStart(5), String(Math.round((r.a + r.b) / 2)).padStart(5), `${((r.b - r.a + 1) / 30).toFixed(2)}s`);
