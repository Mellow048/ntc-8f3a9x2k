// Graphic layer over the 3D picture: stamps, name tags, quote cards, sources, a date, whose words these are.
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
      <div style={{...mont(900), ...sticker(YELLOW, INK), fontSize: `${Math.min(3.5, 80 / (0.74 * role.length + 1.4))}cqw`, padding: '0.25em 0.7em', marginTop: '-0.35em', letterSpacing: '0.04em', whiteSpace: 'nowrap', transform: `translateX(${slide}cqw) rotate(1deg)`, opacity: c01((f - at - 2) / 3), zIndex: 2}}>{role}</div>
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
        <div style={{...mont(900), ...sticker(INK, '#ffffff'), border: `0.5cqw solid ${INK}`, boxShadow: 'none', fontSize: `${Math.min(3.1, 72 / (0.7 * by.length + 1.4))}cqw`, padding: '0.9cqw 2.2cqw', letterSpacing: '0.05em', whiteSpace: 'nowrap', transform: 'rotate(1.5deg)'}}>{by}</div>
      </div>
    </div>
  </div>
);
const Hot: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{background: YELLOW, padding: '0 0.14em', borderRadius: '0.12em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{children}</span>;

/** small source or dateline pill; a long line is set smaller so that it never reaches the edges of the frame */
const Pill: React.FC<{f: number; at: number; text: string; top?: string; tone?: Tone; dx?: number; size?: number}> = ({f, at, text, top = '10%', tone = 'white', dx = 0, size = 3.7}) => {
  const [bg, fg] = TONES[tone], fit = Math.min(size, 84 / (0.76 * text.length + 1.8));
  return (
    <div style={row(top)}>
      <div style={{...mont(900), ...sticker(bg, fg), fontSize: `${fit}cqw`, padding: '0.5em 0.9em', letterSpacing: '0.05em', whiteSpace: 'nowrap', transform: `translateX(${dx}cqw) scale(${pop(f, at, 7)}) rotate(-1.5deg)`}}>{text}</div>
    </div>
  );
};

/** tear-off calendar leaf */
const Day: React.FC<{f: number; at: number; day: string; size?: number; children: React.ReactNode}> = ({f, at, day, size = 6.4, children}) => (
  <div style={{position: 'absolute', left: '6%', top: '9%', width: '27cqw', transform: `scale(${pop(f, at, 8)}) rotate(-5deg)`, transformOrigin: '0% 0%'}}>
    <div style={{...sticker(PAPER, INK), borderRadius: '2cqw', border: `0.75cqw solid ${INK}`, boxShadow: `0 0.9cqw 0 ${INK}`, overflow: 'hidden'}}>
      <div style={{...anton, background: RED, color: '#fff', fontSize: `${size}cqw`, lineHeight: '7.4cqw', textAlign: 'center', padding: '0.4cqw 0 0', borderBottom: `0.75cqw solid ${INK}`}}>{day}</div>
      <div style={{height: '15cqw', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
    </div>
  </div>
);

/** a sum of money rolling up to its total */
const Count: React.FC<{f: number; from: number; to: number; total: number; prefix?: string; suffix?: string; label: string; color?: string; digits?: number}> = ({f, from, to, total, prefix = '', suffix = '', label, color = YELLOW, digits = 1}) => {
  const t = out3(c01((f - from) / (to - from))), done = f >= to, p10 = 10 ** digits, value = done ? total : Math.floor(total * t * p10) / p10;
  const shakeX = done && f < to + 8 ? Math.sin((f - to) * 2.4) * (1 - (f - to) / 8) * 1.2 : 0;
  return (
    <div style={{...row('9.5%'), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, fontSize: '11.5cqw', color, WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, fontVariantNumeric: 'tabular-nums',
        transform: `translateX(${shakeX}cqw) scale(${pop(f, from, 6) * (done ? 1 + 0.1 * Math.max(0, 1 - (f - to) / 5) : 1)})`}}>{prefix}{value.toFixed(digits)}{suffix}</div>
      <div style={{...mont(900), ...sticker(INK, '#ffffff'), boxShadow: 'none', fontSize: '3.5cqw', padding: '0.5em 1em', letterSpacing: '0.06em', marginTop: '-0.6cqw', opacity: c01((f - from - 4) / 4), whiteSpace: 'nowrap'}}>{label}</div>
    </div>
  );
};
const Big: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 11.5}) => <span style={{...anton, fontSize: `${size}cqw`, color: INK, lineHeight: 1}}>{children}</span>;

/** A or B: the two ways to read the story */
const Choice: React.FC<{f: number; at: number; letter: 'A' | 'B'; text: string; top: string; tone: Tone; size?: number}> = ({f, at, letter, text, top, tone, size = 8.2}) => {
  const [bg, fg] = TONES[tone], k = pop(f, at, 7);
  return (
    <div style={row(top)}>
      <div style={{display: 'flex', alignItems: 'stretch', transform: `scale(${k}) rotate(${letter === 'A' ? -2 : 1.5}deg)`}}>
        <div style={{...anton, ...sticker(INK, '#fff'), borderRadius: '0.16em 0 0 0.16em', fontSize: `${size}cqw`, padding: '0.02em 0.32em 0'}}>{letter}</div>
        <div style={{...anton, ...sticker(bg, fg), borderRadius: '0 0.16em 0.16em 0', borderLeft: 'none', fontSize: `${size}cqw`, padding: '0.02em 0.32em 0'}}>{text}</div>
      </div>
    </div>
  );
};

/** whose account this is, for as long as the film is telling it: a small tab on the left edge */
const Tab: React.FC<{f: number; at: number; text: string}> = ({f, at, text}) => (
  <div style={{position: 'absolute', left: 0, top: '31.2%', transform: `translateX(${-100 * (1 - out3(c01((f - at) / 8)))}%)`}}>
    <div style={{...mont(900), background: INK, color: '#ffffff', fontSize: '2.7cqw', padding: '0.62em 1.1em 0.62em 0.9em', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderRadius: '0 1.6cqw 1.6cqw 0', borderLeft: `1.1cqw solid ${YELLOW}`}}>{text}</div>
  </div>
);

export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const during = (i: number, from = S(i)[0]) => f >= from && f < S(i)[1];
  /** from a frame in shot a to the end of shot b: a card that stays up over a cut */
  const over = (a: number, b: number, from = S(a)[0]) => f >= from && f < S(b)[1];
  const closing = S(43)[0];
  const POST = "THE GROUP'S POST, OCT. 27, 2026";
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* What the group posted, claimed and wrote is its own account: say so for as long as it runs (lines 4-8 and 10).
          It is off for the university's notice and for what reporters and staff heard. */}
      {over(16, 29) ? <Tab f={f} at={S(16)[0]} text="THE GROUP'S OWN WORDS" /> : null}
      {over(34, 36) ? <Tab f={f} at={S(34)[0]} text="THE GROUP'S OWN WORDS" /> : null}

      {during(0, W(1) + 4) ? <Pill f={f} at={W(1) + 4} text="ALBUQUERQUE, NEW MEXICO · OCT. 26, 2026" /> : null}
      {during(1, W(4)) ? <Pill f={f} at={W(4)} text="“DIVERTED AMBULANCE TRAFFIC” · UNM HEALTH" /> : null}
      {during(2, W(9)) ? <NameTag f={f} at={W(9)} name="UNM HOSPITAL" role="“THE STATE'S ONLY LEVEL 1 TRAUMA CENTER” · AP" size={9.4} /> : null}
      {during(3, W(14)) ? <Pill f={f} at={W(14)} text="THE NEXT DAY, ON ITS OWN SITE · OCT. 27" /> : null}
      {during(4, W(19) - 2) ? <Stamp f={f} at={W(19) - 2} text="UP TO $2,500 EACH" tone="yellow" top="9.5%" size={11} /> : null}
      {during(5, W(21) + 1) ? <Day f={f} at={W(21) + 1} day="OCT 2026"><Big>26</Big></Day> : null}
      {during(6, W(24)) ? <NameTag f={f} at={W(24)} name="UNM HEALTH" role="THE UNIVERSITY OF NEW MEXICO · ALBUQUERQUE" /> : null}
      {during(7, W(31)) ? <Pill f={f} at={W(31)} text="WHAT EMPLOYEES TOLD THE ASSOCIATED PRESS" /> : null}
      {during(8, W(38) + 2) ? <Stamp f={f} at={W(38) + 2} text="A CLAIM" tone="yellow" top="9.5%" size={13} /> : null}
      {during(8, W(40)) ? <Pill f={f} at={W(40)} text="NOT CONFIRMED BY THE UNIVERSITY" top="20.5%" /> : null}
      {during(9, W(44)) ? <Pill f={f} at={W(44)} text="12:30 TO 2:30 P.M. · UNM HEALTH" /> : null}
      {during(10, W(47)) ? <Pill f={f} at={W(47)} text="“TO OTHER AREA HEALTH SYSTEMS” · UNM" /> : null}
      {during(11, W(52)) ? <Pill f={f} at={W(52)} text="“FOR THE REMAINDER OF THE DAY” · UNM" /> : null}
      {during(13, W(63)) ? <Pill f={f} at={W(63)} text="“RETURNED TO NORMAL OPERATIONS” · UNM, OCT. 27" size={3.3} /> : null}
      {over(14, 15, W(66)) && f < W(70) + 22 ? <Pill f={f} at={W(66)} text="FIRST SEEN ABOUT A MONTH EARLIER · GIZMODO" /> : null}
      {during(15, W(70) + 22) ? <Pill f={f} at={W(70) + 22} text="NO ONE HAS SAID WHO IS BEHIND IT" /> : null}
      {during(16, W(71) + 2) ? <Pill f={f} at={W(71) + 2} text="ON ITS OWN LEAK SITE · BLEEPINGCOMPUTER" /> : null}
      {during(17, W(75)) ? <Stamp f={f} at={W(75)} text="UNCONFIRMED" top="9.5%" size={13} /> : null}
      {during(17, W(79)) ? <Pill f={f} at={W(79)} text="UNM: “DID NOT PENETRATE CORE SYSTEMS OR SERVERS”" top="20.5%" size={3.2} /> : null}
      {during(18, W(85) + 6) ? <Pill f={f} at={W(85) + 6} text="ITS POST OF OCT. 27 · QUOTED BY GIZMODO" /> : null}
      {over(19, 21, W(87) - 2) ? <Quote f={f} at={W(87) - 2} text={<>… we <Hot>did not know</Hot> that it was running machines related to <Hot>assisting patients in real-time</Hot> …</>} by={POST} size={4.6} /> : null}
      {during(22, W(108)) ? <Stamp f={f} at={W(108)} text="FREE KEY" tone="yellow" top="9.5%" size={13} /> : null}
      {during(22, W(106)) ? <Pill f={f} at={W(106)} text="“(ONLY FOR THE HOSPITAL SECTOR)” · ITS POST" top="20.5%" size={3.3} /> : null}
      {during(23, W(111)) ? <Pill f={f} at={W(111)} text="“PLEASE PROVIDE US PROOF” · ITS POST" /> : null}
      {/* the warning comes with the offer: the university's line is on screen before the offer has finished */}
      {over(23, 24, W(118)) ? <Pill f={f} at={W(118)} text="THE UNIVERSITY: “DO NOT RESPOND”" top="15.4%" tone="red" /> : null}
      {during(24, W(119) + 2) ? <Pill f={f} at={W(119) + 2} text="NOT KNOWN IF ANYONE HAS BEEN PAID" /> : null}
      {over(25, 26, W(123) - 2) ? <Quote f={f} at={W(123) - 2} text={<>We have <Hot>morals</Hot> and we have a <Hot>heart</Hot>, we are <Hot>not villains</Hot> …</>} by={POST} size={5} /> : null}
      {over(28, 29, W(138) - 2) ? <Quote f={f} at={W(138) - 2} text={<>… we are <Hot>still going to keep the data</Hot> …</>} by="THE SAME POST" size={5.4} /> : null}
      {over(28, 29, W(141)) ? <Pill f={f} at={W(141)} text="WHAT IT HOLDS: NOT CONFIRMED BY UNM" top="25.2%" /> : null}
      {during(30, W(148)) ? <Pill f={f} at={W(148)} text="ONE DAY AFTER THE OFFER" /> : null}
      {during(31, W(155)) ? <Stamp f={f} at={W(155)} text="DO NOT RESPOND" top="9.5%" size={11.5} /> : null}
      {during(31, W(154)) ? <Pill f={f} at={W(154)} text="UNM NOTICE · OCT. 28, 2026" top="20%" /> : null}
      {during(32, W(159)) ? <Pill f={f} at={W(159)} text="“FALSE OFFERS OF PAYMENTS” · UNM" /> : null}
      {during(33, W(165)) ? <Pill f={f} at={W(165)} text="IC3.GOV · THE FBI'S COMPLAINT CENTER" tone="yellow" /> : null}
      {during(34, W(168)) ? <Pill f={f} at={W(168)} text="ITS EMAIL TO DATABREACHES.NET, PUBLISHED NOV. 2" size={3.3} /> : null}
      {during(35) && f < W(175) - 2 ? <Stamp f={f} at={S(35)[0] + 2} text="ITS VERSION" tone="yellow" top="9.5%" size={12} /> : null}
      {over(35, 36, W(175) - 2) ? <Quote f={f} at={W(175) - 2} text={<>… UNM had a <Hot>full panic attack</Hot> and decided to blast everyone into <Hot>turning their machines off.</Hot></>} by="THE GROUP, TO DATABREACHES.NET" size={4.6} /> : null}
      {during(37, W(186) + 1) ? <Day f={f} at={W(186) + 1} day="NOV 2026"><Big>9</Big></Day> : null}
      {during(38, W(192) + 2) ? <Pill f={f} at={W(192) + 2} text="VANDERBILT HAS NOT SAID WHO DID IT" /> : null}
      {during(39, W(196)) ? <Pill f={f} at={W(196)} text="AS THE REGISTER REPORTED · NOV. 10, 2026" /> : null}
      {over(40, 41, W(199) - 2) ? <Quote f={f} at={W(199) - 2} text={<>Failure to communicate will result in <Hot>this estate being brought to the ground completely.</Hot></>} by="THE RECORDING, AS THE REGISTER REPORTS IT" size={4.6} /> : null}
      {during(42, W(214)) ? <Pill f={f} at={W(214)} text="NO ARREST REPORTED · AS OF NOV. 12, 2026" /> : null}
      {during(42, W(216)) ? <Pill f={f} at={W(216)} text="UNM: “UNDER CRIMINAL INVESTIGATION”" top="15.4%" tone="yellow" /> : null}
      {f >= closing ? (
        <>
          <div style={row('8%')}><div style={{...anton, fontSize: '8.6cqw', color: '#fff', WebkitTextStroke: `1.4cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(219), 8)})`}}>WHAT WAS THAT APOLOGY?</div></div>
          {f >= W(221) ? <Pill f={f} at={W(221)} text="“NEVER SEEN” IN 20 YEARS · DATABREACHES.NET" top="15.6%" size={3.4} /> : null}
          {f >= W(224) - 2 ? <Choice f={f} at={W(224) - 2} letter="A" text="CONSCIENCE" top="20.4%" tone="yellow" size={6.6} /> : null}
          {f >= W(226) - 2 ? <Choice f={f} at={W(226) - 2} letter="B" text="MARKETING" top="25.4%" tone="red" size={6.6} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
