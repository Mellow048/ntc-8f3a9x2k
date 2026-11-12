// Graphic layer over the 3D picture: stamps, name tags, quote cards, dates, a counter, the frame of a video call.
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

/** a sum of money rolling up to its total, to one decimal */
const Count: React.FC<{f: number; from: number; to: number; total: number; prefix?: string; suffix?: string; label: string; color?: string}> = ({f, from, to, total, prefix = '', suffix = '', label, color = YELLOW}) => {
  const t = out3(c01((f - from) / (to - from))), done = f >= to, value = done ? total : Math.floor(total * t * 10) / 10;
  const shakeX = done && f < to + 8 ? Math.sin((f - to) * 2.4) * (1 - (f - to) / 8) * 1.2 : 0;
  return (
    <div style={{...row('9.5%'), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, fontSize: '11.5cqw', color, WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, fontVariantNumeric: 'tabular-nums',
        transform: `translateX(${shakeX}cqw) scale(${pop(f, from, 6) * (done ? 1 + 0.1 * Math.max(0, 1 - (f - to) / 5) : 1)})`}}>{prefix}{value.toFixed(1)}{suffix}</div>
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

/**
 * The frame of a call: we are looking at the screen the engineer saw. Round one was "a live video interview"; round two was
 * "conducted in a popular social chat app", which is all the report says, so that frame claims a chat and nothing more.
 */
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
  const closing = S(43)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* the frame of the call first, so every stamp lands on top of it. It opens up as the camera backs out of the second call. */}
      {during(2) ? <Call f={f} from={S(2)[0]} /> : null}
      {during(16) || during(17) ? <Call f={f} from={S(16)[0]} /> : null}
      {during(19) || (during(20) && f < S(20)[0] + 7) ? <Call f={f} from={S(19)[0]} kind="chat" leave={S(20)[0]} /> : null}
      {/* lines 3-9 are Binance's own account of its own breach: say so for as long as it runs */}
      {f >= W(34) && f < S(29)[0] && !during(7) ? <Tab f={f} at={W(34)} text="ACCORDING TO BINANCE" /> : null}{/* not over the search ad: that detail is Reuters', and says so */}

      {during(0, W(2) - 2) ? <Count f={f} from={W(2) - 2} to={W(5) + 5} total={6.3} prefix="$" suffix=" BILLION" label="STOLEN · BINANCE'S COUNT: $6.34 BN" /> : null}
      {during(1, W(8)) ? <Pill f={f} at={W(8)} text="OCTOBER 29, 2026" /> : null}
      {during(2, W(17)) ? <Stamp f={f} at={W(17)} text="A FAKE JOB INTERVIEW" top="9.5%" size={9.4} /> : null}
      {during(3, W(23)) ? <Stamp f={f} at={W(23)} text="RECORD CRYPTO HEIST" tone="yellow" top="9.5%" size={9.8} /> : null}{/* 3-4 are one take: the stamp stays until the next one replaces it */}
      {during(4) && f < W(29) ? <Stamp f={f} at={W(23)} text="RECORD CRYPTO HEIST" tone="yellow" top="9.5%" size={9.8} /> : null}
      {during(4, W(29)) ? <Stamp f={f} at={W(29)} text="OVER 4X THE LAST ONE" top="9.5%" size={9.4} /> : null}
      {during(4, W(31)) ? <Pill f={f} at={W(31)} text="THE LAST ONE: BYBIT, 2025 · BBC" top="19.5%" /> : null}
      {during(5, W(38) - 2) || during(6) ? <Day f={f} at={W(38) - 2} day="JUNE"><Big size={8.4}>2026</Big></Day> : null}
      {during(7, W(46)) ? <Pill f={f} at={W(46)} text="REPORTEDLY A SEARCH AD · REUTERS" /> : null}
      {during(8, W(54)) ? <Stamp f={f} at={W(54)} text="CAUGHT" tone="green" top="9.5%" size={14} /> : null}
      {during(8, W(55)) ? <Pill f={f} at={W(55)} text="“REPLACED THE DEVICE” · BINANCE" top="20.5%" /> : null}
      {during(9, W(60)) || during(10) ? <Pill f={f} at={W(60)} text="“EXPOSED TO THE HACKER” · BINANCE" /> : null}
      {during(11, W(67)) ? <NameTag f={f} at={W(67)} name="HOT WALLETS" role="CRYPTO KEPT ONLINE, READY TO MOVE" /> : null}
      {during(12, W(72) - 2) ? <Day f={f} at={W(72) - 2} day="SEPTEMBER" size={4.9}><Big size={8.4}>2026</Big></Day> : null}
      {during(13, W(79)) ? <Pill f={f} at={W(79)} text="ON A REAL JOB SITE · BINANCE" /> : null}
      {during(14, W(86)) ? <NameTag f={f} at={W(86)} name="“PROJECT DIRECTOR”" role="POSING AS ONE, BINANCE SAYS" size={9} /> : null}
      {during(15, W(88)) ? <Stamp f={f} at={W(88)} text="INTERVIEW 1" tone="yellow" top="9.5%" size={13} /> : null}
      {during(15, W(90)) ? <Pill f={f} at={W(90)} text="LIVE, ON VIDEO" top="20%" /> : null}
      {during(16, W(93)) || (during(17) && f < W(100)) ? <NameTag f={f} at={W(93)} name="“H.R. REP”" role="POSING AS H.R., BINANCE SAYS" /> : null}{/* 16-17 are one take */}
      {during(17, W(100)) ? <Pill f={f} at={W(100)} text="“TO BUILD TRUST” · BINANCE'S REPORT" /> : null}
      {during(18, W(103)) ? <Stamp f={f} at={W(103)} text="INTERVIEW 2" tone="yellow" top="9.5%" size={13} /> : null}
      {during(19, W(106)) || (during(20) && f < W(109)) ? <NameTag f={f} at={W(106)} name="“THE CEO”" role="ON A CHAT APP, BINANCE SAYS" /> : null}{/* 19-20 are one take */}
      {during(20, W(109)) ? <Pill f={f} at={W(109)} text="“A FICTITIOUS COMPANY” · BINANCE" top="20%" /> : null}
      {during(20, W(112)) ? <Stamp f={f} at={W(112)} text="COMPANY: NOT FOUND" top="9.5%" size={10} /> : null}{/* lands with the painted office: W(110) + 13 is the same frame */}
      {during(21, W(117)) ? <Pill f={f} at={W(117)} text="“INSTRUCTED TO DOWNLOAD” · BINANCE" size={3.5} /> : null}
      {during(22, W(123)) ? <Pill f={f} at={W(123)} text="“ONTO HIS WORK COMPUTER” · BINANCE" size={3.5} /> : null}
      {during(23, W(128)) ? <Stamp f={f} at={W(128)} text="MALWARE" top="9.5%" size={14} /> : null}
      {during(23, W(128) + 6) ? <Pill f={f} at={W(128) + 6} text="“NOT DETECTED” · BINANCE'S REPORT" top="20.5%" /> : null}
      {during(24, W(132)) ? <Stamp f={f} at={W(132)} text="JOB: NOT FOUND" top="9.5%" size={12} /> : null}
      {during(25, W(134)) ? <Day f={f} at={W(134)} day="OCTOBER"><Big>20</Big></Day> : null}
      {during(26, W(139)) ? <Pill f={f} at={W(139)} text="HOW IT WAS USED: NOT PUBLISHED" /> : null}
      {during(28, W(147)) ? <Stamp f={f} at={W(147)} text="TAKEN OVER" top="9.5%" size={13} /> : null}
      {during(28, W(148) + 2) ? <Pill f={f} at={W(148) + 2} text="ENGINEERS “A” AND “C” · BINANCE" top="20%" /> : null}
      {during(29, W(150)) ? <Day f={f} at={W(150)} day="OCTOBER"><Big>29</Big></Day> : null}
      {during(30, W(159)) ? <Stamp f={f} at={W(159)} text="ABOUT 20 MINUTES" tone="yellow" top="9.5%" size={11} /> : null}
      {during(30, W(161)) ? <Pill f={f} at={W(161)} text="MOST OF IT · TRM LABS" top="19.5%" /> : null}
      {during(31, W(164)) ? <Stamp f={f} at={W(164)} text="23:56 UTC" tone="white" top="9.5%" size={13} /> : null}
      {during(31, W(165) + 3) ? <Pill f={f} at={W(165) + 3} text="LAST TRANSFER · BINANCE'S REPORT" top="20%" /> : null}
      {during(32, W(169)) ? <NameTag f={f} at={W(169)} name="FBI" role="PUBLIC ALERT · OCT 31" size={12} /> : null}
      {during(33, W(171)) ? <Stamp f={f} at={W(171)} text="“NORTH KOREA RESPONSIBLE”" tone="yellow" top="9.5%" size={7.6} rot={-2} /> : null}
      {during(33, W(173)) ? <Pill f={f} at={W(173)} text="FROM THE TITLE OF THE FBI'S ALERT" top="16.8%" /> : null}
      {during(34, W(175) + 2) && f < W(179) ? <NameTag f={f} at={W(175) + 2} name="KCNA" role="NORTH KOREA'S STATE NEWS AGENCY" size={12} /> : null}
      {during(34, W(179)) || during(35) ? <Quote f={f} at={W(179)} text={<>But the US assertion is <Hot>an absurd rhetoric</Hot> and nothing new.</>} by="KIM YO JONG'S STATEMENT · KCNA, NOV 3" size={5} /> : null}
      {during(36, W(184)) ? <NameTag f={f} at={W(184)} name="PRESIDENT TRUMP" role="MAR-A-LAGO · OCT 31" /> : null}
      {during(37) ? <NameTag f={f} at={S(37)[0]} name="PRESIDENT TRUMP" role="AT MAR-A-LAGO" top="60.5%" size={8} /> : null}
      {during(37, W(186)) ? <Quote f={f} at={W(186)} text={<>We're learning about it. <Hot>We don't know if it's North Korea</Hot> — but if it is, we'll talk to North Korea about it.</>} by="TO REPORTERS, OCT 31 · VIA BBC" size={4.6} /> : null}
      {during(38, W(196)) ? <Stamp f={f} at={W(196)} text="CHARGED: NOBODY" tone="white" top="9.5%" size={11.5} /> : null}
      {during(38, W(197)) ? <Pill f={f} at={W(197)} text="NO ARRESTS EITHER · AS OF NOV 11" top="19.5%" /> : null}
      {during(39, W(201)) ? <Stamp f={f} at={W(201)} text="$2.85 BN OF $6.34 BN" tone="yellow" top="9.5%" size={9.4} /> : null}
      {during(39, W(203)) ? <Pill f={f} at={W(203)} text="“FROZEN OR INTERCEPTED”" top="18.6%" /> : null}
      {during(39, W(204)) ? <Pill f={f} at={W(204)} text="BINANCE'S REPORT, NOV 3" top="23.6%" tone="yellow" size={3.2} /> : null}
      {during(40, W(209)) ? <Stamp f={f} at={W(209)} text="“COVERING EVERY LOSS”" tone="green" top="9.5%" size={8.4} rot={-2} /> : null}
      {during(40, W(210) + 3) ? <Pill f={f} at={W(210) + 3} text="RICHARD TENG, CO-CEO · OCT 30" top="17.6%" /> : null}
      {during(41, W(213)) || during(42) ? <Quote f={f} at={W(213)} text={<>This wasn't one mistake or one breach - <Hot>it was a months-long campaign.</Hot></>} by="RICHARD TENG, BINANCE CO-CEO · NOV 3" size={5} /> : null}
      {f >= closing ? (
        <>
          <div style={row('8%')}><div style={{...anton, fontSize: '10cqw', color: '#fff', WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(223), 8)})`}}>WHOSE JOB WAS IT?</div></div>
          {f >= W(231) ? <Choice f={f} at={W(231)} letter="A" text="THE ENGINEER'S" top="20.8%" tone="red" size={7} /> : null}
          {f >= W(234) ? <Choice f={f} at={W(234)} letter="B" text="THE COMPANY'S" top="25.8%" tone="yellow" size={7} /> : null}
          {f >= W(226) ? <Pill f={f} at={W(226)} text="BINANCE, OCT 30: NO INDIVIDUAL BLAMED" top="16.2%" size={3.5} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
