// Graphic layer over the 3D picture: stamps, name tags, sources, dates, whose account this is.
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

/** 250000 -> 250,000 */
const sep = (s: string) => { const [a, b] = s.split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); };
/** a number rolling up to its total */
const Count: React.FC<{f: number; from: number; to: number; total: number; prefix?: string; suffix?: string; label: string; color?: string; digits?: number}> = ({f, from, to, total, prefix = '', suffix = '', label, color = YELLOW, digits = 1}) => {
  const t = out3(c01((f - from) / (to - from))), done = f >= to, p10 = 10 ** digits, value = done ? total : Math.floor(total * t * p10) / p10;
  const shakeX = done && f < to + 8 ? Math.sin((f - to) * 2.4) * (1 - (f - to) / 8) * 1.2 : 0;
  return (
    <div style={{...row('9.5%'), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, fontSize: '11.5cqw', color, WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, fontVariantNumeric: 'tabular-nums',
        transform: `translateX(${shakeX}cqw) scale(${pop(f, from, 6) * (done ? 1 + 0.1 * Math.max(0, 1 - (f - to) / 5) : 1)})`}}>{prefix}{sep(value.toFixed(digits))}{suffix}</div>
      <div style={{...mont(900), ...sticker(INK, '#ffffff'), boxShadow: 'none', fontSize: `${Math.min(3.5, 84 / (0.76 * label.length + 1.8))}cqw`, padding: '0.5em 1em', letterSpacing: '0.06em', marginTop: '-0.6cqw', opacity: c01((f - from - 4) / 4), whiteSpace: 'nowrap'}}>{label}</div>
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
  /** from a frame in shot a to the end of shot b: something that stays up over a cut or a join */
  const over = (a: number, b: number, from = S(a)[0]) => f >= from && f < S(b)[1];
  const closing = S(41)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* Three passages are his own telling (two from Nvidia's blog, one from a podcast): a tab says so for as long as each runs. */}
      {over(6, 8, W(35)) ? <Tab f={f} at={W(35)} text="HIS WORDS · NVIDIA'S BLOG, 2023" /> : null}
      {over(12, 13, W(64)) ? <Tab f={f} at={W(64)} text="HIS WORDS · NVIDIA'S BLOG, 2023" /> : null}
      {over(15, 16) ? <Tab f={f} at={S(15)[0]} text="AS HE TELLS IT · SEQUOIA'S PODCAST" /> : null}

      {during(0, W(0) + 2) ? <NameTag f={f} at={W(0) + 2} name="JENSEN HUANG" role="NVIDIA'S CEO FOR 33 YEARS · A CARICATURE" /> : null}
      {during(1, W(8)) ? <Pill f={f} at={W(8)} text="1993 · EAST SAN JOSE, CALIFORNIA" /> : null}
      {during(2, W(16)) ? <Stamp f={f} at={W(16)} text="$5 TRILLION" tone="yellow" top="9.5%" size={12} /> : null}
      {during(2, W(17)) ? <Pill f={f} at={W(17)} text="A FIRST FOR ANY COMPANY · OCTOBER 2025" top="20.5%" /> : null}
      {during(3, W(19)) ? <Pill f={f} at={W(19)} text="THURSDAY, NOV. 12, 2026" top="9%" /> : null}
      {during(3, W(21)) ? <Stamp f={f} at={W(21)} text="RESIGNED" top="14.5%" size={13} /> : null}
      {during(4, W(24)) ? <Pill f={f} at={W(24)} text="BORN FEB. 17, 1963" /> : null}
      {during(5, W(28)) ? <Pill f={f} at={W(28)} text="PORTLAND, OREGON · AROUND 1978" /> : null}
      {during(9, W(48)) ? <Stamp f={f} at={W(48)} text="1993" tone="yellow" top="8.5%" size={12} /> : null}
      {during(9, W(52)) ? <Pill f={f} at={W(52)} text="CHRIS MALACHOWSKY AND CURTIS PRIEM" top="19.2%" /> : null}
      {during(9, W(53) + 5) ? <Pill f={f} at={W(53) + 5} text="STOCK CARTOON FIGURES, NOT LIKENESSES" top="24.4%" tone="yellow" size={3.2} /> : null}
      {during(10, W(56)) ? <Pill f={f} at={W(56)} text="THE IDEA: 3D GRAPHICS FOR THE PC" /> : null}
      {during(10, W(58)) ? <Pill f={f} at={W(58)} text="AS NVIDIA'S BLOG TELLS IT" top="15.4%" tone="yellow" /> : null}
      {during(14, W(82)) ? <Pill f={f} at={W(82)} text="THE NV1, THEIR FIRST PRODUCT" /> : null}
      {during(15, W(86)) ? <Count f={f} from={W(86)} to={W(89) + 6} total={250000} suffix=" OUT" label="“250,000 UNITS WENT OUT.” · JENSEN HUANG" digits={0} /> : null}
      {during(16, W(93)) ? <Count f={f} from={W(93)} to={W(96) + 6} total={249000} suffix=" BACK" label="“... PRACTICALLY PUT US OUT OF BUSINESS.”" color="#ff8a7a" digits={0} /> : null}
      {during(17, S(17)[0] + 2) ? <Pill f={f} at={S(17)[0] + 2} text="1997 · “WE SAVED THE COMPANY”" /> : null}
      {during(18, W(102)) ? <Pill f={f} at={W(102)} text="GRAPHICS CHIPS, MADE FOR VIDEO GAMES" /> : null}
      {over(19, 20, W(105)) ? <Pill f={f} at={W(105)} text="ITS CHIPS TRAIN AND RUN A.I. SYSTEMS" /> : null}
      {over(19, 20, W(109)) ? <Pill f={f} at={W(109)} text="WORTH $1 TRILLION BY MAY 2023" top="15.4%" tone="yellow" /> : null}
      {over(21, 22, W(113)) ? <Pill f={f} at={W(113)} text="THE NEW YORK TIMES · OCT. 29, 2026" /> : null}
      {over(21, 22, W(120)) ? <Pill f={f} at={W(120)} text="NO PUBLIC WORD FROM HER · AS OF NOV. 13" top="15.4%" tone="yellow" /> : null}
      {during(23, W(124)) ? <Stamp f={f} at={W(124)} text="SUSPECTED" tone="yellow" top="9.5%" size={11.5} /> : null}
      {during(23, W(126)) ? <Pill f={f} at={W(126)} text="NOT ESTABLISHED · AS OF NOV. 13, 2026" top="19.3%" /> : null}
      {during(24, W(129)) ? <Day f={f} at={W(129)} day="NOV 2026"><Big>8</Big></Day> : null}
      {during(24, W(131)) ? <Pill f={f} at={W(131)} text="A MEMO TO EMPLOYEES" dx={17} size={3} /> : null}
      {during(25, W(136)) ? <Quote f={f} at={W(136)} text={<>“I was <Hot>unfaithful</Hot> to my wife. ... There is no excuse for what I did. I am deeply sorry.”</>} by="JENSEN HUANG TO EMPLOYEES, NOV. 8 · NBC NEWS" size={4.7} /> : null}
      {during(26, W(143)) ? <Pill f={f} at={W(143)} text="AND OPENED AN INVESTIGATION · NOV. 8" /> : null}
      {during(27, W(146)) ? <Day f={f} at={W(146)} day="NOV 2026"><Big>11</Big></Day> : null}
      {during(27, W(149)) ? <Pill f={f} at={W(149)} text="THE NEW YORK TIMES, CITING" dx={17} size={2.6} /> : null}
      {during(27, W(150)) ? <Pill f={f} at={W(150)} text="FIVE PEOPLE WHO WORKED THERE" top="15.4%" tone="yellow" dx={17} size={2.5} /> : null}
      {during(28, W(155)) ? <Pill f={f} at={W(155)} text="THE EXECUTIVE IS NOT NAMED OR DRAWN" /> : null}
      {during(28, W(157)) ? <Pill f={f} at={W(157)} text="NO REPLY FROM NVIDIA OR THE EXECUTIVE · NBC" top="15.4%" tone="yellow" /> : null}
      {during(29, W(162)) ? <Stamp f={f} at={W(162)} text="33 YEARS" tone="yellow" top="9.5%" size={12.5} /> : null}
      {during(29, W(164)) ? <Pill f={f} at={W(164)} text="PRESIDENT, CEO AND BOARD MEMBER" top="20.5%" /> : null}
      {during(30, W(168)) ? <Stamp f={f} at={W(168)} text="NO REASON GIVEN" top="8.5%" size={9.6} /> : null}
      {during(30, W(170)) ? <Pill f={f} at={W(170)} text="THE INVESTIGATION IS NOT MENTIONED" top="17.6%" /> : null}
      {during(31, W(174)) ? <Quote f={f} at={W(174)} text={<>“... it is nothing but <Hot>smears</Hot> against China.”</>} by="CHINA'S FOREIGN MINISTRY, NOV. 9 · REUTERS" size={5.6} /> : null}
      {during(32, W(179)) ? <Pill f={f} at={W(179)} text="THE U.S. ATTORNEY GENERAL · NOV. 12, 2026" /> : null}
      {during(32, W(184)) ? <Pill f={f} at={W(184)} text="THE F.B.I. IS INVESTIGATING, HE SAID" top="15.4%" tone="yellow" /> : null}
      {during(33, W(189)) ? <Pill f={f} at={W(189)} text="“HAS DENIED ANY KNOWLEDGE” · THE GUARDIAN" /> : null}
      {during(33, W(191)) ? <Pill f={f} at={W(191)} text="HE HAS AGREED TO TESTIFY BEFORE CONGRESS" top="15.4%" tone="yellow" /> : null}
      {during(34, W(197)) ? <Pill f={f} at={W(197)} text="UNVEILED WITH HIM IN SEPTEMBER 2023" /> : null}
      {during(35, W(200)) ? <Pill f={f} at={W(200)} text="NBC NEWS · THURSDAY, NOV. 12, 2026" /> : null}
      {during(36, S(36)[0] + 3) ? <Pill f={f} at={S(36)[0] + 3} text="NBC DOES NOT SAY WHO REMOVED IT, OR WHY" /> : null}
      {over(37, 38, W(208)) && f < W(214) ? <Pill f={f} at={W(208)} text="DAN IVES, A U.S. TECH ANALYST" /> : null}
      {over(37, 38, W(214)) ? <Quote f={f} at={W(214)} text={<>“... <Hot>rip off the Band-Aid</Hot> and take Nvidia into its next chapter without him.”</>} by="DAN IVES, TECH ANALYST · THE GUARDIAN, NOV. 12" size={4.8} /> : null}
      {over(39, 40, W(219) + 2) && f < W(224) ? <Pill f={f} at={W(219) + 2} text="NEIL WILSON, AN ANALYST AT SAXO UK" /> : null}
      {over(39, 40, W(224)) ? <Quote f={f} at={W(224)} text={<>“His technical knowledge ... is basically unique and <Hot>impossible to replicate</Hot>.”</>} by="NEIL WILSON, SAXO UK · THE GUARDIAN, NOV. 12" size={4.8} /> : null}
      {f >= closing ? (
        <>
          <div style={row('8%')}><div style={{...anton, fontSize: '8.4cqw', color: '#fff', WebkitTextStroke: `1.4cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(229), 8)})`}}>CAN NVIDIA REPLACE HIM?</div></div>
          {f >= W(230) + 4 ? <Pill f={f} at={W(230) + 4} text="FOR NOW: COLETTE KRESS, THE FINANCE CHIEF" top="15.6%" size={3.3} /> : null}
          {f >= W(231) + 4 ? <Choice f={f} at={W(231) + 4} letter="A" text="YES, IT'S THE CHIPS" top="20.4%" tone="yellow" size={6.6} /> : null}
          {f >= W(232) + 8 ? <Choice f={f} at={W(232) + 8} letter="B" text="NO, IT WAS HIM" top="25.4%" tone="white" size={6.6} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
