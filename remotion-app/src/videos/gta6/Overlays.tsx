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
const Stamp: React.FC<{f: number; at: number; text: string; tone?: Tone; top?: string; size?: number; rot?: number}> = ({f, at, text, tone = 'red', top = '10%', size = 10.5, rot = -4}) => {
  const [bg, fg] = TONES[tone], age = f - at, wobble = age < 9 ? Math.sin(age * 2.2) * (1 - age / 9) * 2.5 : 0;
  return (
    <div style={row(top)}>
      <div style={{...anton, ...sticker(bg, fg), fontSize: `${size}cqw`, padding: '0.02em 0.3em 0', transform: `rotate(${rot + wobble}deg) scale(${slam(f, at)})`, opacity: c01((age + 1) / 2)}}>{text}</div>
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
const Pill: React.FC<{f: number; at: number; text: string; top?: string; tone?: Tone}> = ({f, at, text, top = '10%', tone = 'white'}) => {
  const [bg, fg] = TONES[tone];
  return (
    <div style={row(top)}>
      <div style={{...mont(900), ...sticker(bg, fg), fontSize: '3.7cqw', padding: '0.5em 0.9em', letterSpacing: '0.05em', whiteSpace: 'nowrap', transform: `scale(${pop(f, at, 7)}) rotate(-1.5deg)`}}>{text}</div>
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
const Big: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{...anton, fontSize: '11.5cqw', color: INK, lineHeight: 1}}>{children}</span>;

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
  const closing = S(43)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {during(0, W(2)) ? <Stamp f={f} at={W(2)} text="THE THREAT" top="10%" size={12.5} /> : null}
      {during(1, W(7)) ? <Stamp f={f} at={W(7)} text="A 13-YEAR WAIT" tone="yellow" top="9.5%" size={12} /> : null}
      {during(2, W(13)) ? <Pill f={f} at={W(13)} text="THE STUDIO: ROCKSTAR GAMES" /> : null}
      {during(3, W(17)) ? <NameTag f={f} at={W(17)} name="GRAND THEFT AUTO VI" role="OPEN-WORLD CRIME GAME · PS5 AND XBOX" size={8.2} /> : null}
      {during(4, W(22)) ? <Day f={f} at={W(22)} day="NOV"><Big>19</Big></Day> : null}
      {during(5, W(27) - 2) ? <Count f={f} from={W(27) - 2} to={W(31) + 8} total={230000000} suffix="+" label="COPIES OF GTA V SOLD" /> : null}
      {during(5, W(32) + 6) ? <Pill f={f} at={W(32) + 6} text="ONLY MINECRAFT HAS SOLD MORE" top="23.5%" /> : null}
      {during(6, W(34)) ? <Pill f={f} at={W(34)} text="AUGUST 18, 2026" /> : null}
      {during(7, W(38)) ? <NameTag f={f} at={W(38)} name="CYBERLEEK" role="ANONYMOUS ACCOUNT · IDENTITY UNKNOWN" /> : null}
      {during(9, W(44)) ? <Stamp f={f} at={W(44)} text="LEAKED" top="9.5%" size={13} /> : null}
      {during(10, W(47)) ? <Pill f={f} at={W(47)} text="THE LEAKER'S STATED REASON" /> : null}
      {during(11, W(55)) ? <Stamp f={f} at={W(55)} text="NO DISC" top="9.5%" size={13.5} /> : null}
      {during(12, W(58)) ? <Pill f={f} at={W(58)} text="CONFIRMED BY ROCKSTAR, JUNE 2026" /> : null}
      {during(13, W(63)) ? <Pill f={f} at={W(63)} text="COIN HOLDERS VOTED ON LEAKS" /> : null}
      {during(14, W(68)) ? <Stamp f={f} at={W(68)} text="CRYPTO COIN" tone="yellow" top="9.5%" size={12} /> : null}
      {during(15, W(77)) || during(16) ? <Count f={f} from={W(77)} to={W(81) + 6} total={200000} prefix="$" suffix="+" label="OUTSIDE ESTIMATES, AUGUST" color="#7dffa0" /> : null}
      {during(17, W(84)) ? <Quote f={f} at={W(84)} text={<>CL was transparent about the token from day one: <Hot>a donation, never an investment.</Hot></>} by="CYBERLEEK'S STATEMENT, OCT 14" size={4.6} /> : null}
      {during(18, W(89)) ? <NameTag f={f} at={W(89)} name="ROCKSTAR GAMES" role="THE STUDIO BEHIND GRAND THEFT AUTO" /> : null}
      {during(19, W(94)) ? <Quote f={f} at={W(94)} text={<>…has been <Hot>heartbreaking for our team</Hot>, and this is obviously not how we intended for you to see the game after all this time.</>} by="ROCKSTAR GAMES, AUG 26" size={4.5} /> : null}
      {during(20, W(100)) ? <NameTag f={f} at={W(100)} name="TAKE-TWO" role="ROCKSTAR'S PARENT COMPANY" /> : null}
      {during(21, W(105)) ? <Pill f={f} at={W(105)} text="SUBPOENAS: MICROSOFT, DISCORD" /> : null}
      {during(22, W(110)) ? <Day f={f} at={W(110)} day="OCT"><Big>10</Big></Day> : null}
      {during(23, W(117)) ? <Stamp f={f} at={W(117)} text="$30,000,000" tone="yellow" top="9.5%" size={12.5} /> : null}
      {during(24, W(121)) ? <Stamp f={f} at={W(121)} text="THE WHOLE GAME" top="10%" size={10.5} /> : null}
      {during(25, W(126)) ? <Pill f={f} at={W(126)} text="POSTED ON THE LEAKER'S WEBSITE" /> : null}
      {during(26, W(129)) ? <Quote f={f} at={W(129)} text={<>Take-Two gets one way out: <Hot>physical disks and a public apology.</Hot></>} by="CYBERLEEK'S WEBSITE, OCT 10" size={5} /> : null}
      {during(27, W(136)) ? <Pill f={f} at={W(136)} text="YES, THAT IS THE REAL QUOTE" /> : null}
      {during(28, W(144)) || during(29) ? <Stamp f={f} at={W(144)} text="UNVERIFIED" tone="yellow" top="9.5%" size={13} /> : null}
      {during(30, W(155)) ? <Stamp f={f} at={W(155)} text="$7.8 MILLION" tone="green" top="9.5%" size={12} /> : null}
      {during(30, W(157)) ? <Pill f={f} at={W(157)} text="PEAK, OCT 11 · SOURCE: IGN" top="20%" /> : null}
      {during(32, S(32)[0] + 5) ? <Stamp f={f} at={S(32)[0] + 5} text="DOWN 78%" top="9.5%" size={13} /> : null}
      {during(33, W(167)) ? <Stamp f={f} at={W(167)} text="$1.7 MILLION" top="9.5%" size={12} /> : null}
      {during(33, W(168)) ? <Pill f={f} at={W(168)} text="OCT 13 · SOURCE: IGN" top="20%" /> : null}
      {during(34, W(172)) ? <Stamp f={f} at={W(172)} text="CALLED OFF" tone="white" top="9.5%" size={12.5} /> : null}
      {during(35, W(176)) || during(36) ? <Quote f={f} at={W(176)} text={<>The Edict stands. <Hot>The leeks stop here. For now.</Hot></>} by="CYBERLEEK, OCT 14" size={5.6} /> : null}
      {during(37, W(187)) ? <Stamp f={f} at={W(187)} text="NOT IDENTIFIED" tone="yellow" top="9.5%" size={10.5} /> : null}
      {during(37, W(189)) ? <Stamp f={f} at={W(189)} text="NOT CHARGED" tone="green" top="18.5%" size={10.5} rot={3} /> : null}
      {during(38, W(191)) || during(39) ? <Pill f={f} at={W(191)} text="TAKE-TWO EARNINGS CALL, NOV 9" /> : null}
      {during(40, W(200)) ? <NameTag f={f} at={W(200)} name="STRAUSS ZELNICK" role="CEO OF TAKE-TWO" /> : null}
      {during(41, W(202)) ? <Quote f={f} at={W(202)} text={<>…discs just — and note I said discs — <Hot>don't really make sense for the consumer.</Hot></>} by="STRAUSS ZELNICK, AUGUST 2026" size={4.8} /> : null}
      {during(42, W(211)) ? <Pill f={f} at={W(211)} text="THE BOX HOLDS A CODE, NOT A DISC" /> : null}
      {f >= closing ? (
        <>
          <div style={row('8.5%')}><div style={{...anton, fontSize: '10cqw', color: '#fff', WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(215), 8)})`}}>WHAT DO YOU THINK?</div></div>
          {f >= W(231) ? <Choice f={f} at={W(231)} letter="A" text="DISC IN THE BOX" top="16.5%" tone="red" /> : null}
          {f >= W(234) + 4 ? <Choice f={f} at={W(234) + 4} letter="B" text="A CODE IS FINE" top="23.5%" tone="yellow" /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
