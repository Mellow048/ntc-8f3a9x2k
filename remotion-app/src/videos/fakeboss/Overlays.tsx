// Graphic layer over the 3D picture: stamps, name tags, quote cards, sources, a counter, the frame of a video call.
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

/** The frame of a video call: we are looking at the screen the employee saw. */
const Call: React.FC<{f: number; from: number; kind?: 'video' | 'chat'; /** frame on which the camera backs out of the screen */ leave?: number}> = ({f, from, kind = 'video', leave = 1e9}) => {
  const gone = c01((f - leave) / 6), k = c01((f - from + 1) / 4) * (1 - gone), dot = Math.floor((f - from) / 15) % 2 === 0;
  const key = (bg: string, child: React.ReactNode) => <div style={{width: '7cqw', height: '7cqw', borderRadius: '50%', background: bg, border: `0.7cqw solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0.6cqw 0 ${INK}`}}>{child}</div>;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: k, transform: `scale(${1 + 0.35 * gone * gone})`}}>
      <div style={{position: 'absolute', inset: '1.6cqw', border: `1.5cqw solid ${INK}`, borderRadius: '5cqw', boxShadow: `0 0 0 3cqw ${INK}`}} />
      <div style={{position: 'absolute', right: '5.4cqw', top: '31.2%', ...mont(900), ...sticker(kind === 'video' ? RED : '#2fbf71', '#ffffff'), fontSize: '3cqw', padding: '0.5em 0.9em', letterSpacing: '0.07em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5em'}}>
        {kind === 'video' ? <span style={{width: '0.8em', height: '0.8em', borderRadius: '50%', background: '#ffffff', opacity: dot ? 1 : 0.25}} /> : null}{kind === 'video' ? 'VIDEO CALL' : 'CHAT APP'}
      </div>
      {kind === 'video' ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: '67.4%', display: 'flex', justifyContent: 'center', gap: '3cqw'}}>
          {key('#3a4254', <div style={{width: '1.6cqw', height: '3cqw', borderRadius: '1cqw', background: '#ffffff'}} />)}
          {key('#3a4254', <div style={{width: '3.3cqw', height: '2.4cqw', borderRadius: '0.6cqw', background: '#ffffff'}} />)}
          {key(RED, <div style={{width: '3.7cqw', height: '1.3cqw', borderRadius: '0.8cqw', background: '#ffffff', transform: 'rotate(135deg)'}} />)}
        </div>
      ) : (
        <div style={{position: 'absolute', left: '14%', right: '14%', top: '67.4%', display: 'flex', alignItems: 'center', gap: '2cqw'}}>
          <div style={{flex: 1, ...mont(700), background: '#ffffff', color: '#8a94a3', border: `0.7cqw solid ${INK}`, borderRadius: '5cqw', fontSize: '3.1cqw', padding: '0.55em 1.2em', boxShadow: `0 0.6cqw 0 ${INK}`}}>Message…</div>
          <div style={{width: '7cqw', height: '7cqw', borderRadius: '50%', background: '#2fbf71', border: `0.7cqw solid ${INK}`, boxShadow: `0 0.6cqw 0 ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{width: 0, height: 0, borderLeft: '2.7cqw solid #ffffff', borderTop: '1.7cqw solid transparent', borderBottom: '1.7cqw solid transparent', marginLeft: '0.7cqw'}} />
          </div>
        </div>
      )}
    </div>
  );
};

export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const during = (i: number, from = S(i)[0]) => f >= from && f < S(i)[1];
  const closing = S(44)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* the frame of the call first, so every stamp lands on top of it. It falls away when the picture breaks up. */}
      {during(1) || during(2) ? <Call f={f} from={S(1)[0]} /> : null}
      {during(3) || during(4) ? <Call f={f} from={S(3)[0]} leave={W(19)} /> : null}
      {during(18) ? <Call f={f} from={S(18)[0]} /> : null}
      {/* lines 2-12 are one side's account, from an indictment that no court has tested: say so for as long as it runs.
          Shot 5 is the prosecutor himself, with his office on the tag: the tab comes in with what he says. */}
      {f >= S(6)[0] && f < S(41)[0] ? <Tab f={f} at={S(6)[0]} text="PROSECUTORS' ACCOUNT" /> : null}

      {during(2, W(12)) ? <Pill f={f} at={W(12)} text="“KEEP THE TRANSACTION SECRET” · INDICTMENT" size={3.3} /> : null}
      {during(4, W(20) - 1) ? <Stamp f={f} at={W(20) - 1} text="MADE WITH A.I." top="9.5%" size={12.5} /> : null}
      {during(4, W(20) + 5) ? <Pill f={f} at={W(20) + 5} text="A U.S. INDICTMENT SAYS SO · NOV 5, 2026" top="20.5%" /> : null}
      {during(5, W(21) + 2) ? <NameTag f={f} at={W(21) + 2} name="U.S. ATTORNEY'S OFFICE" role="NEW YORK · NOVEMBER 5, 2026" size={8.2} /> : null}
      {during(6, W(26)) ? <Stamp f={f} at={W(26)} text="3 MEN CHARGED" tone="white" top="9.5%" size={12.5} /> : null}
      {during(6, W(28)) ? <Pill f={f} at={W(28)} text="AND OTHERS “KNOWN AND UNKNOWN” · INDICTMENT" top="20.5%" size={3.3} /> : null}
      {during(7, W(34)) ? <Stamp f={f} at={W(34)} text="TARGETED" tone="yellow" top="9.5%" size={14} /> : null}
      {during(7, W(35) + 3) ? <Pill f={f} at={W(35) + 3} text="JULY 2024 TO FEBRUARY 2026 · INDICTMENT" top="20.5%" /> : null}
      {during(8, W(37)) ? <Pill f={f} at={W(37)} text="“VOICES AND/OR IMAGES” · INDICTMENT" /> : null}
      {during(9, W(41) - 2) ? <Count f={f} from={W(41) - 2} to={W(46) + 5} total={129} digits={0} prefix="$" suffix=" MILLION" label="“AT LEAST APPROXIMATELY” · INDICTMENT" /> : null}
      {during(10, W(49)) ? <Pill f={f} at={W(49)} text="UNSEALED NOV 5, 2026 · NOT TESTED IN COURT" /> : null}
      {during(11, W(55) + 4) ? <Pill f={f} at={W(55) + 4} text="TO STAFF WHO COULD APPROVE A WIRE · INDICTMENT" size={3.2} /> : null}
      {during(12, W(61)) ? <Pill f={f} at={W(61)} text="ONE EMAIL, OCT 8, 2024 · INDICTMENT" /> : null}
      {during(13, W(63) - 2) ? <Quote f={f} at={W(63) - 2} text={<>We need to <Hot>loop you into a deal</Hot> we’ve been working on.</>} by="EMAIL QUOTED IN THE INDICTMENT" size={5} /> : null}
      {during(14, W(76)) ? <Pill f={f} at={W(76)} text="“A PHONE OR VIDEO CALL” · INDICTMENT" /> : null}
      {during(15, W(80)) || (during(16) && f < W(82)) ? <Pill f={f} at={W(80)} text="“MIMIC THE VOICE” · INDICTMENT" /> : null}{/* 15-16 are one take: it stays until the next line takes its place */}
      {during(16, W(82)) ? <Pill f={f} at={W(82)} text="“AND AT TIMES THE IMAGE” · INDICTMENT" /> : null}
      {during(17, W(85) + 3) ? <Pill f={f} at={W(85) + 3} text="“TO CONVINCE THE VICTIM EMPLOYEE” · INDICTMENT" size={3.2} /> : null}
      {during(18, W(91)) ? <NameTag f={f} at={W(91)} name="THE LAWYER" role="“OUR LEGAL REPRESENTATIVE” · THE EMAIL" /> : null}
      {during(19, W(92)) ? <Pill f={f} at={W(92)} text="“IMPERSONATED ATTORNEYS” · INDICTMENT" /> : null}
      {during(20, W(96)) ? <Pill f={f} at={W(96)} text="OFTEN FROM A TOP-50 LAW FIRM · INDICTMENT" /> : null}
      {during(21, W(101)) ? <Pill f={f} at={W(101)} text="U.S. ATTORNEY'S OFFICE, NOV 5" /> : null}
      {during(22, W(105)) || (during(23) && f < W(109)) ? <Pill f={f} at={W(105)} text="“A HANDWRITTEN SCRIPT” · INDICTMENT" /> : null}{/* 22-23 are one take */}
      {during(23, W(109)) ? <Pill f={f} at={W(109)} text="THE TITLE IS FROM THE INDICTMENT" /> : null}
      {during(23, W(110) + 2) ? <Pill f={f} at={W(110) + 2} text="THE REST OF THIS PAGE IS OUR SCRIBBLE" top="15.6%" tone="yellow" size={3.2} /> : null}
      {during(24, W(115)) ? <Pill f={f} at={W(115)} text="“OFTEN … MILLIONS OF DOLLARS” · INDICTMENT" size={3.3} /> : null}
      {during(25, W(119)) || (during(26) && f < W(122)) ? <Pill f={f} at={W(119)} text="NOVEMBER 2024 · INDICTMENT" /> : null}{/* 25-26 are one take */}
      {during(26, W(122)) ? <Stamp f={f} at={W(122)} text="$4,829,580" tone="yellow" top="9.5%" size={14} /> : null}
      {during(26, W(125)) ? <Pill f={f} at={W(125)} text="NOVEMBER 2024 · INDICTMENT" top="21%" /> : null}
      {during(27, W(129)) ? <Pill f={f} at={W(129)} text="JUNE 2025 · INDICTMENT" /> : null}
      {during(28, W(132)) ? <Stamp f={f} at={W(132)} text="$5,242,747" tone="yellow" top="9.5%" size={14} /> : null}
      {during(28, W(134)) ? <Pill f={f} at={W(134)} text="JUNE 2025 · INDICTMENT" top="21%" /> : null}
      {during(29, W(140)) ? <Pill f={f} at={W(140)} text="ACCOUNTS NAMED IN THE INDICTMENT" /> : null}
      {during(30, W(147)) ? <Pill f={f} at={W(147)} text="“TO CONCEAL THE SOURCE” · INDICTMENT" /> : null}
      {during(31, W(152)) ? <Stamp f={f} at={W(152)} text="ALSO KNOWN AS…" tone="white" top="9.5%" size={11.5} /> : null}
      {during(31, W(153) + 2) ? <Pill f={f} at={W(153) + 2} text="FROM THE CASE'S TITLE PAGE" top="20%" /> : null}
      {during(32, W(156) + 3) ? <Pill f={f} at={W(156) + 3} text="DEFENDANT 1 OF 3 · INDICTMENT" /> : null}
      {during(33, W(158) + 3) && f < W(160) ? <Pill f={f} at={W(158) + 3} text="DEFENDANT 2 OF 3 · INDICTMENT" /> : null}
      {during(33, W(160)) ? <Pill f={f} at={W(160)} text="SAME MAN, ANOTHER ALIAS · INDICTMENT" /> : null}
      {during(34, W(163)) ? <Pill f={f} at={W(163)} text="AN ALLEGED BOAST · INDICTMENT" /> : null}
      {during(35, W(167)) ? <Pill f={f} at={W(167)} text="“LAUNDERED FUNDS” · INDICTMENT" /> : null}
      {during(36, W(172) - 2) ? <Quote f={f} at={W(172) - 2} text={<>… among professional money launderers, he was <Hot>“number one all over the world.”</Hot></>} by="THE INDICTMENT, ON AN ALLEGED BOAST" size={4.7} /> : null}
      {during(37, W(180)) || (during(38) && f < W(185)) ? <Pill f={f} at={W(180)} text="OCTOBER 2024 · INDICTMENT" /> : null}{/* 37-38 are one take */}
      {during(38, W(185)) ? <Pill f={f} at={W(185)} text="“A MAJOR INVESTMENT BANK” · INDICTMENT" /> : null}
      {during(39, W(191)) ? <Stamp f={f} at={W(191)} text="APPROVED" tone="green" top="9.5%" size={14} /> : null}
      {during(39, W(192) + 2) ? <Pill f={f} at={W(192) + 2} text="THE EMPLOYEE WAS DECEIVED · INDICTMENT" top="21%" /> : null}
      {during(40, W(197)) ? <Stamp f={f} at={W(197)} text="STOPPED" top="9.5%" size={14} /> : null}
      {during(40, W(198)) ? <Pill f={f} at={W(198)} text="$2,849,000 NEVER LEFT · INDICTMENT" top="21%" /> : null}
      {during(41, W(202) + 4) ? <Pill f={f} at={W(202) + 4} text="EXTRADITION REQUESTS PENDING · DOJ, NOV 5" /> : null}
      {during(42, W(207)) ? <Pill f={f} at={W(207)} text="“MERELY ACCUSATIONS” · JUSTICE DEPT, NOV 5" /> : null}
      {during(43, W(210)) ? <Stamp f={f} at={W(210)} text="PRESUMED INNOCENT" tone="white" top="9.5%" size={10.5} /> : null}
      {during(43, W(211) + 4) ? <Pill f={f} at={W(211) + 4} text="DEFENCE: NO COMMENT REPORTED · AP, NOV 6" top="19.5%" /> : null}
      {f >= closing ? (
        <>
          <div style={row('8%')}><div style={{...anton, fontSize: '8.6cqw', color: '#fff', WebkitTextStroke: `1.4cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(213), 8)})`}}>WHAT STOPS A FAKE BOSS?</div></div>
          {f >= W(218) ? <Choice f={f} at={W(218)} letter="A" text="SHARPER EMPLOYEES" top="20.4%" tone="red" size={6.6} /> : null}
          {f >= W(222) ? <Choice f={f} at={W(222)} letter="B" text="TWO-PERSON RULE" top="25.4%" tone="yellow" size={6.6} /> : null}
          {f >= W(216) ? <Pill f={f} at={W(216)} text="A BACK OFFICE STOPPED ONE · INDICTMENT" top="15.6%" size={3.4} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
