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
  /** from a frame in shot a to the end of shot b: something that stays up over a cut or a join */
  const over = (a: number, b: number, from = S(a)[0]) => f >= from && f < S(b)[1];
  const closing = S(43)[0], swap = S(14)[0], gone = S(17)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* The call is the prosecutors' account, and what the shared screen showed is the investigator's, by way of Wired:
          a tab says whose account is running for as long as it runs. */}
      {over(11, 15) ? <Tab f={f} at={S(11)[0]} text="AS PROSECUTORS TELL IT" /> : null}
      {over(30, 31) ? <Tab f={f} at={S(30)[0]} text="AS ZACHXBT TOLD WIRED" /> : null}

      {during(0, W(5)) ? <Stamp f={f} at={W(5)} text="OVER $230 MILLION" tone="yellow" top="9.5%" size={11.5} /> : null}
      {during(0, W(10)) ? <Pill f={f} at={W(10)} text="IN BITCOIN, AT THE TIME · U.S. ATTORNEY'S OFFICE, D.C." top="20.5%" size={3.2} /> : null}
      {during(1, W(13)) ? <Pill f={f} at={W(13)} text="THE MAN WHO WAS ROBBED IS NOT DRAWN" /> : null}
      {during(2, W(17)) ? <Pill f={f} at={W(17)} text="“NOTORIOUS” IN L.A. AND MIAMI CLUBS, A COURT HEARD · BBC" size={3.2} /> : null}
      {during(3, W(20) + 3) ? <Pill f={f} at={W(20) + 3} text="31 CARS, BY HIS OWN ACCOUNT · COURT FILING" /> : null}
      {during(4, W(21) + 3) ? <Pill f={f} at={W(21) + 3} text="RENTED: LOS ANGELES, THE HAMPTONS, MIAMI" /> : null}
      {during(5, W(22) + 3) ? <Pill f={f} at={W(22) + 3} text="“UP TO $500,000 PER EVENING” · U.S. ATTORNEY'S OFFICE" size={3.2} /> : null}
      {during(6, W(25)) ? <Stamp f={f} at={W(25)} text="31 DAYS" top="8%" size={12} /> : null}
      {during(7, W(27) + 1) ? <Day f={f} at={W(27) + 1} day="AUG 2024"><Big>18</Big></Day> : null}
      {during(8, W(30)) ? <NameTag f={f} at={W(30)} name="MALONE LAM" role="20 THEN · PLEADED GUILTY IN SEPT. 2026" /> : null}
      {during(8, W(32) + 4) ? <Pill f={f} at={W(32) + 4} text="A STOCK CARTOON FIGURE, NOT A LIKENESS" top="22.5%" tone="yellow" size={3.2} /> : null}
      {during(9, W(35)) ? <Pill f={f} at={W(35)} text="LEFT SCHOOL AT 14, HE TOLD INVESTIGATORS · BBC" size={3.3} /> : null}
      {during(9, W(38) + 8) ? <Pill f={f} at={W(38) + 8} text="STAYED AFTER HIS VISA EXPIRED · BBC" top="15.4%" tone="yellow" /> : null}
      {during(10, W(40)) ? <Pill f={f} at={W(40)} text="“RINGLEADER” · U.S. ATTORNEY'S OFFICE, D.C." /> : null}
      {during(10, W(43)) ? <Pill f={f} at={W(43)} text="“CONNECTIONS MADE ON ONLINE GAMING PLATFORMS”" top="15.4%" tone="yellow" size={3.3} /> : null}
      {during(10, W(45) + 4) ? <Pill f={f} at={W(45) + 4} text="18 CHARGED · HIS WAS THE 11TH GUILTY PLEA · AP" top="20.8%" /> : null}
      {during(11, W(49)) ? <Pill f={f} at={W(49)} text="THE CREW HAS NO FACES HERE: NOT ALL HAVE BEEN TRIED" size={3.2} /> : null}
      {during(12, W(52)) ? <Pill f={f} at={W(52)} text="WASHINGTON, D.C. · AUG. 18, 2024" /> : null}
      {over(13, 14, W(56)) && f < swap ? <Pill f={f} at={W(56)} text="“CLAIMING THEY WERE FROM GOOGLE'S SECURITY TEAM”" size={3.2} /> : null}
      {over(13, 14, swap + 2) ? <Pill f={f} at={swap + 2} text="THEN AS THE “SUPPORT TEAM” OF HIS EXCHANGE" /> : null}
      {over(13, 14, W(58)) ? <Pill f={f} at={W(58)} text="COURT FILING, AS REPORTED BY CNBC" top="15.4%" tone="yellow" /> : null}
      {during(15, W(65)) ? <Pill f={f} at={W(65)} text="“DUPED INTO DOWNLOADING A PROGRAM” · USA TODAY" size={3.3} /> : null}
      {over(16, 17, W(72)) && f < gone ? <Stamp f={f} at={W(72)} text="4,100+ BITCOIN" tone="yellow" top="9.5%" size={12} /> : null}
      {over(16, 17, W(75)) && f < gone ? <Pill f={f} at={W(75)} text="“OVER 4,100 BITCOIN” · U.S. ATTORNEY'S OFFICE" top="20.5%" /> : null}
      {over(16, 17, gone) ? <Count f={f} from={gone} to={W(81)} total={230} prefix="$" suffix=" MILLION+" label="“WORTH OVER $230 MILLION AT THE TIME”" digits={0} /> : null}
      {during(18, W(84)) ? <Pill f={f} at={W(84)} text="“A WILD SPENDING SPREE” · ASSOCIATED PRESS" /> : null}
      {during(19, W(87) + 2) ? <Pill f={f} at={W(87) + 2} text="RENTED · ONE AT $68,000 A MONTH · COURT FILING" size={3.3} /> : null}
      {during(20, W(89) + 2) ? <Pill f={f} at={W(89) + 2} text="“PRIVATE JET RENTALS” · U.S. ATTORNEY'S OFFICE" size={3.3} /> : null}
      {during(21, W(93)) ? <Stamp f={f} at={W(93)} text="UP TO $500,000 A NIGHT" tone="yellow" top="9.5%" size={8.9} /> : null}
      {during(21, W(95) + 3) ? <Pill f={f} at={W(95) + 3} text="“UP TO $500,000 PER EVENING” · U.S. ATTORNEY'S OFFICE" top="20.5%" size={3.2} /> : null}
      {during(22, W(97) + 2) ? <Pill f={f} at={W(97) + 2} text="ONE RECEIPT, A LOS ANGELES CLUB · COURT FILING" size={3.3} /> : null}
      {during(23) ? <Count f={f} from={S(23)[0] + 2} to={W(105)} total={31} suffix=" CARS" label="“31 LUXURY AUTOMOBILES” · COURT FILING, 2024" digits={0} /> : null}
      {during(24, W(107)) ? <Pill f={f} at={W(107)} text="A PAGANI HUAYRA · “PURCHASED FOR $3,800,000”" size={3.3} /> : null}
      {during(24, W(111)) ? <Pill f={f} at={W(111)} text="COURT FILING, OCT. 2024: IT HAD NOT BEEN FOUND" top="15.4%" tone="yellow" size={3.3} /> : null}
      {during(25, W(115)) ? <Pill f={f} at={W(115)} text="“POSTING AND APPEARING IN PHOTOS” · WIRED" /> : null}
      {during(26, W(120)) ? <Pill f={f} at={W(120)} text="AUG. 19, 2024: THE DAY AFTER · WIRED" /> : null}
      {during(27, W(126)) ? <NameTag f={f} at={W(126)} name="ZACHXBT" role="A PSEUDONYM · REAL NAME NOT PUBLIC · WIRED" /> : null}
      {during(28, W(129)) ? <Pill f={f} at={W(129)} text="“THREE MAIN THREADS” · WIRED" /> : null}
      {during(29, W(132)) ? <Pill f={f} at={W(132)} text="“ON INSTAGRAM AND TIKTOK” · WIRED" /> : null}
      {during(29, W(133) + 2) ? <Pill f={f} at={W(133) + 2} text="HE “APPEARED TO BE IN MIAMI”" top="15.4%" tone="yellow" /> : null}
      {during(30, W(138)) ? <Pill f={f} at={W(138)} text="ONE OF THEM “RE-SHARED HIS SCREEN”" top="8%" /> : null}
      {during(30, W(141) + 2) ? <Pill f={f} at={W(141) + 2} text="WITH “ANOTHER GROUP OF FRIENDS”" top="13.7%" tone="yellow" /> : null}
      {during(31, W(147)) ? <Pill f={f} at={W(147)} text="A 90-MINUTE VIDEO · FIRST NAMES ARE SPOKEN IN IT" top="15.4%" size={3.3} /> : null}
      {during(32, W(151)) ? <Pill f={f} at={W(151)} text="HE SHARED HIS FINDINGS WITH LAW ENFORCEMENT · WIRED" top="8%" size={3.2} /> : null}
      {during(33, W(157)) ? <Stamp f={f} at={W(157)} text="ARRESTED" top="9.5%" size={13} /> : null}
      {during(33, W(159)) ? <Pill f={f} at={W(159)} text="SEPT. 18, 2024 · AT HIS RENTAL HOME IN MIAMI" top="20.5%" size={3.3} /> : null}
      {during(34, W(162)) ? <Pill f={f} at={W(162)} text="“OFF A DOCK ... INTO BISCAYNE BAY” · USA TODAY" size={3.3} /> : null}
      {during(34, W(164) + 2) ? <Pill f={f} at={W(164) + 2} text="TIPPED OFF BY AN OFF-DUTY OFFICER, IT SAYS · AP" top="15.4%" tone="yellow" size={3.3} /> : null}
      {during(35, W(169)) ? <Pill f={f} at={W(169)} text="THE INDICTMENT, AS REPORTED BY USA TODAY" /> : null}
      {during(36, W(172) + 1) ? <Day f={f} at={W(172) + 1} day="SEPT 2026"><Big>8</Big></Day> : null}
      {during(36, W(176)) ? <Pill f={f} at={W(176)} text="ONE COUNT OF RICO CONSPIRACY" dx={17} size={2.7} /> : null}
      {during(36, W(178) + 2) ? <Pill f={f} at={W(178) + 2} text="U.S. DISTRICT COURT, WASHINGTON" top="15.4%" tone="yellow" dx={17} size={2.6} /> : null}
      {during(37, W(184) - 1) ? <Stamp f={f} at={W(184) - 1} text="UP TO 20 YEARS" top="9.5%" size={12} /> : null}
      {during(37, W(185) + 3) ? <Pill f={f} at={W(185) + 3} text="NOT SENTENCED YET · NEXT HEARING DEC. 8, 2026" top="20.5%" size={3.3} /> : null}
      {during(38, W(187)) ? <Pill f={f} at={W(187)} text="AT THE PLEA HEARING · ASSOCIATED PRESS" /> : null}
      {during(38, W(190)) ? <Pill f={f} at={W(190)} text="HE HAD BOUGHT MOST OF THEM, NOT ALL, HE INDICATED" top="15.4%" tone="yellow" size={3.2} /> : null}
      {during(39, W(195) - 2) ? <Quote f={f} at={W(195) - 2} text={<>“I would need <Hot>some time</Hot>.”</>} by="MALONE LAM TO THE JUDGE · AP" size={6.2} /> : null}
      {during(40, W(202)) ? <Quote f={f} at={W(202)} text={<>“If you build a <Hot>cybercrime empire</Hot>, we will find you ...”</>} by="THE U.S. ATTORNEY FOR D.C. · SEPT. 8, 2026" /> : null}
      {during(41, W(208)) ? <Quote f={f} at={W(208)} text={<>“It’s a <Hot>very sad case</Hot> of a bunch of kids ...”</>} by="HIS LAWYER, TO USA TODAY" /> : null}
      {during(42, W(214) + 2) ? <Pill f={f} at={W(214) + 2} text="“ONLINE GAMES ... THROUGH WHICH THEY MET”" /> : null}
      {during(42, W(216)) ? <Pill f={f} at={W(216)} text="THE SAME STATEMENT, TO USA TODAY" top="15.4%" tone="yellow" /> : null}
      {f >= closing ? (
        <>
          <div style={row('8%')}><div style={{...anton, fontSize: '9.2cqw', color: '#fff', WebkitTextStroke: `1.4cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(219), 8)})`}}>WHO GETS SENTENCED?</div></div>
          {f >= W(221) + 2 ? <Pill f={f} at={W(221) + 2} text="NO DATE YET · HE FACES UP TO 20 YEARS" top="15.6%" size={3.4} /> : null}
          {f >= W(223) - 2 ? <Choice f={f} at={W(223) - 2} letter="A" text="A CRIME BOSS" top="20.4%" tone="yellow" size={6.6} /> : null}
          {f >= W(227) - 2 ? <Choice f={f} at={W(227) - 2} letter="B" text="A KID IN OVER HIS HEAD" top="25.4%" tone="white" size={6.6} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
