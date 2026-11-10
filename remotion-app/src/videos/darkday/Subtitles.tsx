// Burned-in English subtitles (requested by the channel owner 2026-11-10 — overrides the repo's
// default no-captions gate for this short). Sentence-case, bottom-center, safe-area padded,
// timed to words.json (first-word start → last-word end), cues split at sentence punctuation
// and balanced into ≤2 visual lines. No other on-screen text.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "./words.json";

type W = { word: string; start: number; end: number };
type Cue = { text: string; start: number; end: number };

const MAX = 56; // chars per cue before it must split

function splitAtMidComma(text: string, start: number, end: number): Cue[] {
  const mid = text.length / 2;
  let best = -1;
  for (const m of text.matchAll(/,|;|:/g)) {
    const i = m.index ?? -1;
    if (i < 0) continue;
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  if (best < 0) return [{ text, start, end }]; // no split point: let it wrap
  const a = text.slice(0, best + 1).trim();
  const b = text.slice(best + 1).trim();
  const t = start + ((end - start) * a.length) / text.length;
  return [
    { text: a, start, end: t },
    { text: b, start: t, end },
  ];
}

function buildCues(ws: W[]): Cue[] {
  const raw: Cue[] = [];
  let cur: W[] = [];
  const flush = () => {
    if (!cur.length) return;
    raw.push({ text: cur.map((w) => w.word).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  for (const w of ws) {
    cur.push(w);
    const len = cur.map((x) => x.word).join(" ").length;
    if (/[.!?]["'’)]?$/.test(w.word) || len > MAX) flush();
  }
  flush();
  const out: Cue[] = [];
  for (const c of raw) {
    if (c.text.length <= MAX) out.push(c);
    else out.push(...splitAtMidComma(c.text, c.start, c.end));
  }
  return out;
}

export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const cues = useMemo(() => buildCues(wordsJson as W[]), []);
  const active = cues.find((c) => t >= c.start - 0.08 && t < c.end + 0.3);
  if (!active) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: "8.5%", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: "86%",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.28,
          color: "#ffffff",
          background: "rgba(8, 10, 16, 0.62)",
          borderRadius: 16,
          padding: "10px 26px",
          textShadow: "0 2px 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
          letterSpacing: 0.2,
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
