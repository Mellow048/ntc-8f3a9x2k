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
  const closing = S(44)[0];
  const YEARS: [number, string][] = [[S(19)[0] + 1, '2022'], [W(96) + 2, '2023'], [W(97) + 3, '2024'], [W(98) + 3, '2025']];
  const year = YEARS.filter(([at]) => f >= at).pop();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* What cracked the case is one newspaper's account, from people it does not name: say whose it is for as long as it runs.
          The newspaper's own page (shot 22) carries its name itself. */}
      {over(23, 27) ? <Tab f={f} at={S(23)[0]} text="AS THE L.A. TIMES REPORTS" /> : null}

      {during(0, W(3)) ? <Stamp f={f} at={W(3)} text="$100 MILLION" tone="yellow" top="9.5%" size={12.5} /> : null}
      {during(0, W(6)) ? <Pill f={f} at={W(6)} text="“APPROXIMATELY $100 MILLION” · U.S. ATTORNEY'S OFFICE" top="20.5%" size={3.2} /> : null}
      {during(1, W(13)) ? <Stamp f={f} at={W(13)} text="27 MINUTES" top="9.5%" size={13} /> : null}
      {during(1, W(10)) ? <Pill f={f} at={W(10)} text="“THE LARGEST JEWELRY HEIST IN U.S. HISTORY”" top="20.5%" size={3.2} /> : null}
      {during(1, W(11) + 3) ? <Pill f={f} at={W(11) + 3} text="U.S. ATTORNEY'S OFFICE, LOS ANGELES" top="25%" tone="yellow" size={3.0} /> : null}
      {during(2, W(16)) ? <Pill f={f} at={W(16)} text="ONE WENT IN “TO GET A MEAL” · L.A. TIMES" /> : null}
      {during(3, W(20)) ? <Pill f={f} at={W(20)} text="THE OTHER WAS ASLEEP IN THE CAB · L.A. TIMES" /> : null}
      {during(4, W(24)) ? <Pill f={f} at={W(24)} text="SEVEN MEN WERE CHARGED IN JUNE 2025" /> : null}
      {during(5, W(30)) ? <Stamp f={f} at={W(30)} text="PLEA DEAL" tone="yellow" top="9.5%" size={13} /> : null}
      {during(5, W(31) + 5) ? <Pill f={f} at={W(31) + 5} text="NOT ENTERED YET · PLEA HEARING NOV. 19, 2026" top="20.5%" size={3.3} /> : null}
      {during(6, W(32) + 1) ? <Day f={f} at={W(32) + 1} day="JULY 2022"><Big>10</Big></Day> : null}
      {during(7, W(36)) ? <NameTag f={f} at={W(36)} name="A BRINK'S BIG RIG" role="LEFT ABOUT 8:25 P.M. · L.A. TIMES" size={9.4} /> : null}
      {during(8, W(44)) ? <Pill f={f} at={W(44)} text="SAN MATEO, CALIFORNIA · JULY 10, 2022" /> : null}
      {during(9, W(47)) ? <Stamp f={f} at={W(47)} text="73 BAGS" tone="yellow" top="9.5%" size={13} /> : null}
      {during(9, W(48)) ? <Pill f={f} at={W(48)} text="THE INDICTMENT" top="20.5%" /> : null}
      {during(10, W(50)) ? <Pill f={f} at={W(50)} text="ALLEGED IN THE INDICTMENT · JUNE 2025" /> : null}
      {during(11, W(57)) ? <Stamp f={f} at={W(57)} text="ABOUT 300 MILES" tone="yellow" top="9.5%" size={11} /> : null}
      {during(11, W(59)) ? <Pill f={f} at={W(59)} text="“APPROXIMATELY 300 MILES” · U.S. ATTORNEY'S OFFICE" top="20.5%" size={3.2} /> : null}
      {during(12, W(62)) ? <Pill f={f} at={W(62)} text="2:05 A.M., JULY 11, 2022 · L.A. TIMES" /> : null}
      {during(13, W(66)) ? <Pill f={f} at={W(66)} text="LEBEC · 70 MILES NORTH OF LOS ANGELES" /> : null}
      {during(14, W(71)) ? <Pill f={f} at={W(71)} text="BOTH DRIVERS ARE DRAWN AS NOBODY IN PARTICULAR" size={3.2} /> : null}
      {during(15, W(77)) ? <Pill f={f} at={W(77)} text="THE INDICTMENT MENTIONS NO WEAPON HERE · L.A. TIMES" size={3.2} /> : null}
      {during(16, W(83) + 2) ? <Stamp f={f} at={W(83) + 2} text="27 MINUTES" top="9.5%" size={13} /> : null}
      {during(16, W(84) + 4) ? <Pill f={f} at={W(84) + 4} text="2:05 TO 2:32 A.M. · L.A. TIMES" top="20.5%" /> : null}
      {during(17, W(87)) ? <Pill f={f} at={W(87)} text="“ITS REAR LOCK HAD BEEN CUT AWAY” · L.A. TIMES" size={3.3} /> : null}
      {during(18, W(91)) ? <Stamp f={f} at={W(91)} text="24 OF 73 BAGS" top="9.5%" size={11.5} /> : null}
      {during(18, W(93)) ? <Pill f={f} at={W(93)} text="THE INDICTMENT AND THE PLEA AGREEMENT" top="20.5%" /> : null}
      {during(19) && year ? <Day f={f} at={year[0]} day="YEAR" size={6}><Big size={8.4}>{year[1]}</Big></Day> : null}
      {during(20, W(99) + 2) ? <Stamp f={f} at={W(99) + 2} text="NOBODY CHARGED" top="9.5%" size={11.5} /> : null}
      {during(20, W(100) + 4) ? <Pill f={f} at={W(100) + 4} text="JULY 2022 TO JUNE 2025" top="20.5%" /> : null}
      {during(21, W(103)) ? <Pill f={f} at={W(103)} text="A BREAK IN THE CASE" /> : null}
      {during(22, W(106)) ? <Pill f={f} at={W(106)} text="“ACCORDING TO TWO PEOPLE INVOLVED WITH THE CASE”" size={3.2} /> : null}
      {during(23, W(109)) ? <Pill f={f} at={W(109)} text="PHONES CONNECTING TO TOWERS" /> : null}
      {during(24, W(113)) ? <Pill f={f} at={W(113)} text="ALONG THE TRUCK'S ROUTE, SAN MATEO TO LEBEC" size={3.3} /> : null}
      {during(25, W(122)) ? <Pill f={f} at={W(122)} text="“THE NUMBER OF HIS BURNER PHONE”" /> : null}
      {during(26, W(128)) ? <Pill f={f} at={W(128)} text="THE NIGHT BEFORE THE HEIST" /> : null}
      {during(27, W(131)) ? <Pill f={f} at={W(131)} text="“HE WITNESSED A TRAFFIC COLLISION”" /> : null}
      {during(27, W(133)) ? <Pill f={f} at={W(133)} text="THE TIMES DOES NOT SAY WHICH OF THEM" top="15.4%" tone="yellow" /> : null}
      {during(28, W(136) + 2) ? <Stamp f={f} at={W(136) + 2} text="7 CHARGED" top="9.5%" size={13} /> : null}
      {during(28, W(138)) ? <Pill f={f} at={W(138)} text="INDICTMENT UNSEALED JUNE 17, 2025" top="20.5%" /> : null}
      {during(28, W(139)) ? <Pill f={f} at={W(139)} text="“PRESUMED TO BE INNOCENT” UNTIL PROVEN GUILTY" top="25%" tone="yellow" size={3.2} /> : null}
      {during(29, W(143)) ? <Pill f={f} at={W(143)} text="PANAMA CITY · JULY 1, 2025" /> : null}
      {during(29, W(145)) ? <Pill f={f} at={W(145)} text="ON A LAYOVER TO ECUADOR · THE PLEA AGREEMENT" top="15.4%" tone="yellow" size={3.3} /> : null}
      {during(30, W(148) + 1) ? <Day f={f} at={W(148) + 1} day="NOV 2026"><Big>9</Big></Day> : null}
      {during(30, W(150)) ? <Pill f={f} at={W(150)} text="CARLOS VICTOR MESTANZA CERCADO, 32" dx={17} size={2.25} /> : null}
      {during(30, W(152)) ? <Pill f={f} at={W(152)} text="HIS LAWYER DECLINED TO COMMENT · L.A. TIMES" top="15.4%" tone="yellow" dx={17} size={2.0} /> : null}
      {during(31, W(158)) ? <Stamp f={f} at={W(158)} text="A DIFFERENT TRUCK" tone="yellow" top="9.5%" size={10.5} /> : null}
      {during(31, W(159) + 2) ? <Pill f={f} at={W(159) + 2} text="FONTANA, CALIF. · MARCH 11, 2022" top="20.5%" /> : null}
      {during(32, W(162) - 2) ? <Stamp f={f} at={W(162) - 2} text="$57,377 OF AIRTAGS" tone="yellow" top="9.5%" size={10} /> : null}
      {during(32, W(162) + 8) ? <Pill f={f} at={W(162) + 8} text="TAKEN “BY FORCE AND THREAT OF FORCE”" top="20.5%" /> : null}
      {during(32, W(162) + 16) ? <Pill f={f} at={W(162) + 16} text="ONE COUNT OF ROBBERY · UP TO 20 YEARS" top="25%" tone="red" size={3.3} /> : null}
      {during(33, W(164)) ? <Pill f={f} at={W(164)} text="THE SAME AGREEMENT" /> : null}
      {during(34, W(170)) ? <Stamp f={f} at={W(170)} text="ADMITS THE HEIST" tone="yellow" top="9.5%" size={11} /> : null}
      {during(34, W(171) + 3) ? <Pill f={f} at={W(171) + 3} text="THE OTHER COUNTS ARE TO BE DROPPED · CNS" top="20.5%" size={3.3} /> : null}
      {over(35, 37, W(173)) && f < W(179) ? <Pill f={f} at={W(173)} text="THEIR TRIAL IS SET FOR MARCH 2027" /> : null}
      {over(35, 37, W(179)) && f < W(183) ? <Pill f={f} at={W(179)} text="AS OF NOV. 2026 · L.A. TIMES" /> : null}
      {over(35, 37, W(183)) ? <Pill f={f} at={W(183)} text="TO ECUADOR, LATE DEC. 2025 · L.A. TIMES" /> : null}
      {during(38, W(188)) ? <Pill f={f} at={W(188)} text="A PROSECUTOR'S FILING: “GENUINE SURPRISE”" /> : null}
      {during(38, W(190)) ? <Pill f={f} at={W(190)} text="THEY STILL HOPE TO TRY HIM · L.A. TIMES" top="15.4%" tone="yellow" /> : null}
      {during(39, W(193)) ? <Pill f={f} at={W(193)} text="“STILL UNRECOVERED” · L.A. TIMES, JAN. 2026" /> : null}
      {during(39, W(196)) ? <Pill f={f} at={W(196)} text="14 JEWELERS · SOME HAVE LEFT THE TRADE" top="15.4%" tone="yellow" /> : null}
      {during(40, W(200)) ? <Pill f={f} at={W(200)} text="THE JEWELERS' LAWSUIT AGAINST BRINK'S" /> : null}
      {during(41, W(206)) ? <Pill f={f} at={W(206)} text="PROSECUTORS: “AT LEAST $100,312,031.54” · CNS" size={3.3} /> : null}
      {during(42, W(208)) ? <NameTag f={f} at={W(208)} name="BRINK'S" role="ITS OWN LAWSUIT, FILED IN 2022 · L.A. TIMES" /> : null}
      {during(43, W(213)) ? <Pill f={f} at={W(213)} text="“DECLARED TOTAL VALUE OF $8.7 MILLION” · L.A. TIMES" size={3.2} /> : null}
      {during(43, W(215)) ? <Pill f={f} at={W(215)} text="THE MAN WITH THE DEAL: UNDER $10 MILLION · CNS" top="15.4%" tone="yellow" size={3.2} /> : null}
      {f >= closing ? (
        <>
          <div style={row('8%')}><div style={{...anton, fontSize: '8.8cqw', color: '#fff', WebkitTextStroke: `1.4cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, W(217), 8)})`}}>WHICH NUMBER COUNTS?</div></div>
          {f >= W(219) + 4 ? <Pill f={f} at={W(219) + 4} text="A LEGAL BATTLE SINCE 2022 · L.A. TIMES" top="15.6%" size={3.4} /> : null}
          {f >= W(222) - 2 ? <Choice f={f} at={W(222) - 2} letter="A" text="WHAT THEY LOST" top="20.4%" tone="yellow" size={6.6} /> : null}
          {f >= W(227) - 2 ? <Choice f={f} at={W(227) - 2} letter="B" text="WHAT THEY DECLARED" top="25.4%" tone="white" size={6.6} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
