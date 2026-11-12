// Graphic layer over the 3D picture: stamps, name tags, quote cards, dates and counters.
// Everything here adds something the caption does not say (a source, a name, the exact quote); every cue is a word.
// Layout: graphics live in the top 9-30 % of the frame, name tags for people at a podium sit just above the captions.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SHOTS, shotEnd, W} from './story';

const INK = '#15121c', RED = '#e3342f', YELLOW = '#ffe14a', PAPER = '#fffdf4';
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const out3 = (t: number) => 1 - (1 - t) ** 3;
/** 0 -> 1 with a little overshoot */
const back = (t: number) => 1 + 2.9 * (t - 1) ** 3 + 1.9 * (t - 1) ** 2;
/** scale of something stamped onto the picture: starts big, lands in 5 frames */
const slam = (f: number, at: number) => 2.4 - 1.4 * out3(c01((f - at) / 5));
const pop = (f: number, at: number, d = 8) => back(c01((f - at) / d));
/** [first frame, end) of shot i */
const S = (i: number): [number, number] => [SHOTS[i].at, shotEnd(i)];
const anton: React.CSSProperties = {fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.08, whiteSpace: 'nowrap'};
const mont = (weight: 700 | 900 = 900): React.CSSProperties => ({fontFamily: 'Montserrat, sans-serif', fontWeight: weight});
const sticker = (bg: string, color: string): React.CSSProperties => ({background: bg, color, border: `0.085em solid ${INK}`, borderRadius: '0.16em', boxShadow: `0 0.11em 0 ${INK}`});
const row = (top: string): React.CSSProperties => ({position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center'});

type Tone = 'red' | 'yellow' | 'white' | 'green';
const TONES: Record<Tone, [string, string]> = {red: [RED, '#ffffff'], yellow: [YELLOW, INK], white: [PAPER, INK], green: ['#2fbf71', '#ffffff']};

/** rubber stamp: slams in on its word and stays to the end of the shot */
const Stamp: React.FC<{f: number; at: number; text: string; tone?: Tone; top?: string; size?: number; rot?: number; dx?: number}> = ({f, at, text, tone = 'red', top = '10%', size = 10.5, rot = -4, dx = 0}) => {
  const [bg, fg] = TONES[tone], age = f - at, wobble = age < 9 ? Math.sin(age * 2.2) * (1 - age / 9) * 2.5 : 0;
  return (
    <div style={row(top)}>
      <div style={{...anton, ...sticker(bg, fg), fontSize: `${size}cqw`, padding: '0.02em 0.3em 0', transform: `translateX(${dx}cqw) rotate(${rot + wobble}deg) scale(${slam(f, at)})`, opacity: c01((age + 1) / 2)}}>{text}</div>
    </div>
  );
};

/** who is this: name on a white plate, role on a yellow strip */
const NameTag: React.FC<{f: number; at: number; name: string; role: string; top?: string; size?: number}> = ({f, at, name, role, top = '9.5%', size = 10}) => {
  const k = pop(f, at, 7), slide = (1 - out3(c01((f - at - 2) / 6))) * -40;
  return (
    <div style={{...row(top), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, ...sticker(PAPER, INK), fontSize: `${size}cqw`, padding: '0.02em 0.3em 0', transform: `scale(${k}) rotate(-2deg)`, zIndex: 1}}>{name}</div>
      <div style={{...mont(900), ...sticker(YELLOW, INK), fontSize: '3.5cqw', padding: '0.25em 0.7em', marginTop: '-0.35em', letterSpacing: '0.04em', whiteSpace: 'nowrap', transform: `translateX(${slide}cqw) rotate(1deg)`, opacity: c01((f - at - 2) / 3), zIndex: 2}}>{role}</div>
    </div>
  );
};

/** somebody's exact words, with who said them */
const Quote: React.FC<{f: number; at: number; text: React.ReactNode; by: string; top?: string; size?: number}> = ({f, at, text, by, top = '9%', size = 5}) => (
  <div style={row(top)}>
    <div style={{width: '84%', transform: `scale(${pop(f, at, 8)}) rotate(-1deg)`, transformOrigin: '50% 0%', opacity: c01((f - at + 1) / 2)}}>
      <div style={{...sticker(PAPER, INK), borderRadius: '2.2cqw', border: `0.8cqw solid ${INK}`, boxShadow: `0 1cqw 0 ${INK}`, padding: '3.2cqw 4cqw 3.4cqw 4cqw', position: 'relative'}}>
        <div style={{...anton, position: 'absolute', left: '2.4cqw', top: '-5.6cqw', fontSize: '17cqw', color: RED, WebkitTextStroke: `0.9cqw ${INK}`, paintOrder: 'stroke fill', lineHeight: 1}}>“</div>
        <div style={{...mont(900), fontSize: `${size}cqw`, lineHeight: 1.16, color: INK, textAlign: 'center', letterSpacing: '-0.01em'}}>{text}</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '-1.4cqw', paddingRight: '3cqw'}}>
        <div style={{...mont(900), ...sticker(INK, '#ffffff'), border: `0.5cqw solid ${INK}`, boxShadow: 'none', fontSize: '3.1cqw', padding: '0.9cqw 2.2cqw', letterSpacing: '0.05em', whiteSpace: 'nowrap', transform: 'rotate(1.5deg)'}}>{by}</div>
      </div>
    </div>
  </div>
);
const Hot: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{background: YELLOW, padding: '0 0.14em', borderRadius: '0.12em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{children}</span>;

/** small source or dateline pill */
const Pill: React.FC<{f: number; at: number; text: string; top?: string; tone?: Tone; dx?: number}> = ({f, at, text, top = '10%', tone = 'white', dx = 0}) => {
  const [bg, fg] = TONES[tone];
  return (
    <div style={row(top)}>
      <div style={{...mont(900), ...sticker(bg, fg), fontSize: '3.7cqw', padding: '0.5em 0.9em', letterSpacing: '0.05em', whiteSpace: 'nowrap', transform: `translateX(${dx}cqw) scale(${pop(f, at, 7)}) rotate(-1.5deg)`}}>{text}</div>
    </div>
  );
};

/** tear-off calendar leaf */
const Day: React.FC<{f: number; at: number; day: string; children: React.ReactNode}> = ({f, at, day, children}) => (
  <div style={{position: 'absolute', left: '6%', top: '9%', width: '27cqw', transform: `scale(${pop(f, at, 8)}) rotate(-5deg)`, transformOrigin: '0% 0%'}}>
    <div style={{...sticker(PAPER, INK), borderRadius: '2cqw', border: `0.75cqw solid ${INK}`, boxShadow: `0 0.9cqw 0 ${INK}`, overflow: 'hidden'}}>
      <div style={{...anton, background: RED, color: '#fff', fontSize: '6.4cqw', textAlign: 'center', padding: '0.4cqw 0 0', borderBottom: `0.75cqw solid ${INK}`}}>{day}</div>
      <div style={{height: '15cqw', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
    </div>
  </div>
);

/** a number rolling up to its total */
const Count: React.FC<{f: number; from: number; to: number; total: number; prefix?: string; suffix?: string; label: string; color?: string}> = ({f, from, to, total, prefix = '', suffix = '', label, color = YELLOW}) => {
  const t = out3(c01((f - from) / (to - from))), done = f >= to, step = total / 23;
  const value = done ? total : Math.floor(total * t / step) * step + ((f * 7919) % 97) * (step / 100);
  const shakeX = done && f < to + 8 ? Math.sin((f - to) * 2.4) * (1 - (f - to) / 8) * 1.2 : 0;
  return (
    <div style={{...row('9.5%'), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, fontSize: '11.5cqw', color, WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, fontVariantNumeric: 'tabular-nums',
        transform: `translateX(${shakeX}cqw) scale(${pop(f, from, 6) * (done ? 1 + 0.1 * Math.max(0, 1 - (f - to) / 5) : 1)})`}}>{prefix}{Math.round(value).toLocaleString('en-US')}{suffix}</div>
      <div style={{...mont(900), ...sticker(INK, '#ffffff'), boxShadow: 'none', fontSize: '3.6cqw', padding: '0.5em 1em', letterSpacing: '0.08em', marginTop: '-0.6cqw', opacity: c01((f - from - 4) / 4), whiteSpace: 'nowrap'}}>{label}</div>
    </div>
  );
};
const Big: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 11.5}) => <span style={{...anton, fontSize: `${size}cqw`, color: INK, lineHeight: 1}}>{children}</span>;

/** A or B: the two ways to read the story */
const Choice: React.FC<{f: number; at: number; letter: 'A' | 'B'; text: string; top: string; tone: Tone}> = ({f, at, letter, text, top, tone}) => {
  const [bg, fg] = TONES[tone], k = pop(f, at, 7);
  return (
    <div style={row(top)}>
      <div style={{display: 'flex', alignItems: 'stretch', transform: `scale(${k}) rotate(${letter === 'A' ? -2 : 1.5}deg)`}}>
        <div style={{...anton, ...sticker(INK, '#fff'), borderRadius: '0.16em 0 0 0.16em', fontSize: '8.2cqw', padding: '0.02em 0.32em 0'}}>{letter}</div>
        <div style={{...anton, ...sticker(bg, fg), borderRadius: '0 0.16em 0.16em 0', borderLeft: 'none', fontSize: '8.2cqw', padding: '0.02em 0.32em 0'}}>{text}</div>
      </div>
    </div>
  );
};

export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const during = (i: number, from = S(i)[0]) => f >= from && f < S(i)[1];
  const closing = S(41)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {during(0, W(1)) ? <Stamp f={f} at={W(1)} text="THE FREEZER HACK" top="10%" size={11.5} /> : null}
      {during(1, W(9) - 2) ? <Count f={f} from={W(9) - 2} to={W(12) + 4} total={700} label="SHOPS HIT · PARIS PROSECUTOR" /> : null}
      {during(2, W(15)) ? <Stamp f={f} at={W(15)} text="FRANCE SAYS: IRAN" tone="yellow" top="9.5%" size={11.5} /> : null}
      {during(2, W(17) + 2) ? <Pill f={f} at={W(17) + 2} text="IRAN CALLS THAT BASELESS" top="19.5%" /> : null}
      {during(3, W(20)) ? <Day f={f} at={W(20)} day="OCTOBER"><Big size={8.4}>11–12</Big></Day> : null}
      {during(4, W(26)) ? <Stamp f={f} at={W(26)} text="50°C" top="9%" size={15} /> : null}
      {during(4, W(27) + 3) ? <Pill f={f} at={W(27) + 3} text="122°F · “AS HIGH AS”, REUTERS" top="20.5%" /> : null}
      {during(5, W(31)) || during(6) ? <Stamp f={f} at={W(31)} text="TENS OF MILLIONS OF €" tone="yellow" top="9.5%" size={9.6} /> : null}
      {during(5, W(32) + 3) || during(6) ? <Pill f={f} at={W(32) + 3} text="ONE RETAILER'S ESTIMATE" top="18.5%" /> : null}
      {during(7, W(37)) ? <Stamp f={f} at={W(37)} text="15+ FIRES" top="9.5%" size={13} /> : null}
      {during(7, W(40)) ? <Pill f={f} at={W(40)} text="OFFICIAL REPORT: AT LEAST 15" top="20%" /> : null}
      {during(8, W(43)) ? <Stamp f={f} at={W(43)} text="NO BREAK-IN" tone="white" top="34%" size={12.5} /> : null}
      {during(9, W(50)) ? <Pill f={f} at={W(50)} text="THE PROSECUTOR'S ACCOUNT" /> : null}
      {during(10, W(57)) || during(11) || (during(12) && f < W(62)) ? <Stamp f={f} at={W(57)} text="ALARMS: OFF" top="9.5%" size={12.5} /> : null}{/* 10-12 are one take: the stamp stays until the next one replaces it */}
      {during(12, W(62)) ? <Stamp f={f} at={W(62)} text="DEFROST: NO END" tone="yellow" top="9.5%" size={11.5} /> : null}
      {during(14, W(71)) ? <Pill f={f} at={W(71)} text="SAYS THE BOSS OF A FRENCH CHAIN" /> : null}
      {during(15, W(79)) ? <Pill f={f} at={W(79)} text="A CYBERSECURITY PROFESSOR" /> : null}
      {during(16, W(82)) || during(17) ? <Quote f={f} at={W(82)} text={<>A fridge doesn't look like a security risk, <Hot>and that's exactly why attackers like it.</Hot></>} by="PROF. KATERINA MITROKOTSA · NEWSWEEK" size={5} /> : null}
      {during(18, W(97)) || (during(19) && f < W(106)) ? <NameTag f={f} at={W(97)} name="DANFOSS" role="DANISH MAKER OF MANY PANELS" /> : null}{/* match cut: the tag stays until the stamp replaces it */}
      {during(19, W(106)) ? <Stamp f={f} at={W(106)} text="OUTDATED" tone="yellow" top="9.5%" size={13} /> : null}
      {during(19, W(107)) ? <Pill f={f} at={W(107)} text="DANFOSS: “OUTDATED FIRMWARE”" top="20%" /> : null}
      {during(20, W(108)) ? <Day f={f} at={W(108)} day="NOVEMBER"><Big>2</Big></Day> : null}
      {during(21, W(115)) ? <Stamp f={f} at={W(115)} text="100+ STORES" top="9.5%" size={12.5} /> : null}
      {during(21, W(117)) ? <Pill f={f} at={W(117)} text="AT LEAST FIVE COUNTRIES · AFP" top="20%" /> : null}
      {during(22, W(121)) ? <Pill f={f} at={W(121)} text="ONE STORE IN BELGIUM · IKEA" /> : null}
      {during(23, W(124)) ? <Stamp f={f} at={W(124)} text="STATUS: UNKNOWN" tone="yellow" top="9.5%" size={11.5} /> : null}
      {during(24, W(132)) ? <NameTag f={f} at={W(132)} name="FRANCE'S BLOOD SERVICE" role="ITS COLD STORAGE · NOV 2" size={8} /> : null}
      {during(25, W(138)) ? <Stamp f={f} at={W(138)} text="NOTHING LOST" tone="green" top="9.5%" size={12.5} /> : null}
      {during(25, W(140)) ? <Pill f={f} at={W(140)} text="NOT DAMAGED · CBS NEWS" top="20%" /> : null}
      {during(26, W(145)) ? <Stamp f={f} at={W(145)} text="NO PROVEN LINK" tone="white" top="9.5%" size={12} /> : null}
      {during(27, S(27)[0] + 3) ? <Quote f={f} at={S(27)[0] + 3} text={<>…the first offensive cyber campaign carried out <Hot>purely for the purposes of sabotage on French soil.</Hot></>} by="FRENCH FOREIGN MINISTRY, NOV 10" size={4.7} /> : null}
      {during(28, W(159)) ? <NameTag f={f} at={W(159)} name="SHAHID KAVEH" role="THE UNIT FRANCE ACCUSES · NOV 9" size={9.4} /> : null}
      {during(28, W(162)) ? <Pill f={f} at={W(162)} text="CONTEXT: THE IRAN WAR, SINCE FEB" top="24%" /> : null}
      {during(29, W(165) + 2) || during(30) ? <Pill f={f} at={W(165) + 2} text="THE PROSECUTOR'S EVIDENCE" /> : null}
      {during(31, W(178)) ? <Stamp f={f} at={W(178)} text="“WITH CERTAINTY”" tone="yellow" top="9.5%" size={11} /> : null}
      {during(31, W(179)) ? <Pill f={f} at={W(179)} text="JEAN-NOËL BARROT · VIA CNN" top="19.5%" /> : null}
      {during(32, W(182)) ? <Stamp f={f} at={W(182)} text="HOW? NOT DISCLOSED" tone="white" top="9.5%" size={10} /> : null}
      {during(32, W(182) + 6) ? <Pill f={f} at={W(182) + 6} text="THE MINISTER, VIA CNN" top="19%" /> : null}
      {during(33, W(186)) ? <Stamp f={f} at={W(186)} text="DENIED" tone="white" top="9.5%" size={14} /> : null}
      {during(34, W(189)) || (during(35) && f < W(195)) ? <NameTag f={f} at={W(189)} name="IRAN'S FOREIGN MINISTRY" role="STATEMENT · NOV 10" size={7.8} /> : null}{/* 34 and 35 are one take: the tag stays until the quote card takes its place */}
      {during(35, W(195)) || during(36) ? <Quote f={f} at={W(195)} text={<><Hot>A government that cannot even manage the temperature of its own refrigerators</Hot> now seeks to shift the blame onto foreign actors through these preposterous accusations.</>} by="IRAN'S FOREIGN MINISTRY, NOV 10" size={4.4} /> : null}
      {during(37, W(209)) ? <Pill f={f} at={W(209)} text="FOR THE UNIT'S LEADERS" /> : null}
      {during(38, W(212)) ? <Pill f={f} at={W(212)} text="FRANCE WILL ASK THE EU" /> : null}
      {during(39, W(215)) ? <Pill f={f} at={W(215)} text="FRANCE'S CERT-FR AND THE FBI" /> : null}
      {during(40, W(219)) ? <Stamp f={f} at={W(219)} text="“OFF THE PUBLIC INTERNET”" tone="white" top="9.5%" size={7.6} rot={-2} /> : null}
      {during(40, W(221)) ? <Pill f={f} at={W(221)} text="FBI CYBER · VIA CBS NEWS" top="16.8%" /> : null}
      {f >= closing ? (
        <>
          <div style={row('8.5%')}><div style={{...anton, fontSize: '10cqw', color: '#fff', WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(223), 8)})`}}>WHAT DO YOU THINK?</div></div>
          {f >= W(230) ? <Choice f={f} at={W(230)} letter="A" text="UNPLUG IT" top="16.5%" tone="red" /> : null}
          {f >= W(232) ? <Choice f={f} at={W(232)} letter="B" text="LOCK IT DOWN" top="23.5%" tone="yellow" /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
