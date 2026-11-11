// Graphic layer over the 3D picture: stamps, name tags, quote cards, the email, the counter.
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
const NameTag: React.FC<{f: number; at: number; name: string; role: string; top?: string}> = ({f, at, name, role, top = '9.5%'}) => {
  const k = pop(f, at, 7), slide = (1 - out3(c01((f - at - 2) / 6))) * -40;
  return (
    <div style={{...row(top), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, ...sticker(PAPER, INK), fontSize: '10cqw', padding: '0.02em 0.3em 0', transform: `scale(${k}) rotate(-2deg)`, zIndex: 1}}>{name}</div>
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
const Envelope = () => (
  <svg viewBox="0 0 100 70" style={{width: '17cqw'}}><rect x="5" y="5" width="90" height="60" rx="6" fill={YELLOW} stroke={INK} strokeWidth="6" /><path d="M5 9 L50 42 L95 9" fill="none" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <circle cx="88" cy="12" r="13" fill={RED} stroke={INK} strokeWidth="5" /></svg>
);
const DownArrow = () => <svg viewBox="0 0 100 80" style={{width: '15cqw'}}><path d="M36 4 H64 V40 H88 L50 76 L12 40 H36 Z" fill={RED} stroke={INK} strokeWidth="6" strokeLinejoin="round" /></svg>;

/** the company-wide email, typed out on the narration */
const Email: React.FC<{f: number}> = ({f}) => {
  const at = SHOTS[19].at, words = ['I', 'was', 'unfaithful', 'to', 'my', 'wife.'], shown = words.filter((_, i) => f >= W(97 + i) - 1), caret = Math.floor(f / 8) % 2 === 0;
  const line = (k: string, v: string) => <div style={{display: 'flex', gap: '2cqw', padding: '1.4cqw 0', borderBottom: '0.3cqw solid #d9d5c8', fontSize: '3.5cqw'}}><span style={{...mont(700), color: '#8a8698', width: '15cqw'}}>{k}</span><span style={{...mont(900), color: INK}}>{v}</span></div>;
  return (
    <div style={row('9%')}>
      <div style={{width: '86%', transform: `scale(${pop(f, at, 9)})`, transformOrigin: '50% 30%'}}>
        <div style={{background: PAPER, border: `0.8cqw solid ${INK}`, borderRadius: '3cqw', boxShadow: `0 1.1cqw 0 ${INK}`, overflow: 'hidden'}}>
          <div style={{background: '#2b3040', display: 'flex', alignItems: 'center', gap: '1.4cqw', padding: '2cqw 3cqw', borderBottom: `0.8cqw solid ${INK}`}}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: '2.6cqw', height: '2.6cqw', borderRadius: '50%', background: c, border: `0.35cqw solid ${INK}`}} />)}
            <div style={{...mont(900), color: '#fff', fontSize: '3.3cqw', marginLeft: '2cqw', letterSpacing: '0.04em'}}>ALL-COMPANY EMAIL</div>
          </div>
          <div style={{padding: '1.2cqw 4cqw 0'}}>
            {line('From', 'Jensen Huang')}
            {line('To', 'All employees')}
            {line('Subject', 'A message to our company')}
          </div>
          <div style={{...mont(900), padding: '3.6cqw 4cqw 5cqw', fontSize: '8.4cqw', lineHeight: 1.12, color: INK, letterSpacing: '-0.02em', minHeight: '30cqw'}}>
            {shown.length ? '“' : ''}{shown.join(' ')}{shown.length === words.length ? '”' : ''}
            <span style={{display: 'inline-block', width: '0.7cqw', height: '8cqw', marginLeft: '0.8cqw', background: caret && shown.length < words.length ? INK : 'transparent', verticalAlign: '-0.9cqw'}} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** market value rolling away */
const Counter: React.FC<{f: number}> = ({f}) => {
  const a = W(108) - 2, b = W(110) + 12, t = out3(c01((f - a) / (b - a))), done = f >= b;
  const value = done ? 190e9 : Math.floor(190e9 * t / 1e7) * 1e7 + (f * 7919 % 9973) * 1000;
  const shakeX = done && f < b + 8 ? Math.sin((f - b) * 2.4) * (1 - (f - b) / 8) * 1.2 : 0;
  return (
    <div style={{...row('9.5%'), flexDirection: 'column', alignItems: 'center'}}>
      <div style={{...anton, fontSize: '10.4cqw', color: '#ff4a44', WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, fontVariantNumeric: 'tabular-nums',
        transform: `translateX(${shakeX}cqw) scale(${pop(f, a, 6) * (done ? 1 + 0.1 * Math.max(0, 1 - (f - b) / 5) : 1)})`}}>−${Math.round(value).toLocaleString('en-US')}</div>
      <div style={{...mont(900), ...sticker(INK, '#ffffff'), boxShadow: 'none', fontSize: '3.6cqw', padding: '0.5em 1em', letterSpacing: '0.08em', marginTop: '-0.6cqw', opacity: c01((f - a - 4) / 4)}}>OF MARKET VALUE</div>
    </div>
  );
};

/** long-lens surveillance viewfinder */
const Viewfinder: React.FC<{f: number}> = ({f}) => {
  const corner = (h: 'left' | 'right', v: 'top' | 'bottom'): React.CSSProperties => ({position: 'absolute', [h]: '7%', [v]: v === 'top' ? '9%' : '32%', width: '11cqw', height: '11cqw',
    [`border${h === 'left' ? 'Left' : 'Right'}`]: '1cqw solid #fff', [`border${v === 'top' ? 'Top' : 'Bottom'}`]: '1cqw solid #fff', filter: `drop-shadow(0 0 0.6cqw ${INK})`} as React.CSSProperties);
  const zoom = 8 + Math.min(4, (f - SHOTS[13].at) / 8);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 34%, rgba(4,10,6,.72) 78%)'}} />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 0.35cqw, rgba(0,0,0,0) 0.35cqw 0.9cqw)', mixBlendMode: 'multiply'}} />
      <div style={corner('left', 'top')} /><div style={corner('right', 'top')} /><div style={corner('left', 'bottom')} /><div style={corner('right', 'bottom')} />
      <div style={{position: 'absolute', left: '50%', top: '41%', width: '30cqw', height: '30cqw', margin: '-15cqw 0 0 -15cqw', border: '0.6cqw solid rgba(255,255,255,.9)', borderRadius: '50%', filter: `drop-shadow(0 0 0.5cqw ${INK})`}}>
        <div style={{position: 'absolute', left: '50%', top: '-12%', bottom: '-12%', width: '0.5cqw', marginLeft: '-0.25cqw', background: 'rgba(255,255,255,.9)'}} />
        <div style={{position: 'absolute', top: '50%', left: '-12%', right: '-12%', height: '0.5cqw', marginTop: '-0.25cqw', background: 'rgba(255,255,255,.9)'}} />
      </div>
      <div style={{...mont(900), position: 'absolute', left: '11%', top: '11.2%', fontSize: '4.2cqw', color: '#fff', display: 'flex', alignItems: 'center', gap: '1.6cqw', textShadow: `0 0.4cqw 0 ${INK}`, letterSpacing: '0.06em'}}>
        <span style={{width: '3.6cqw', height: '3.6cqw', borderRadius: '50%', background: Math.floor(f / 9) % 2 ? '#ff3b30' : '#6d1612', border: `0.4cqw solid ${INK}`}} />REC
      </div>
      <div style={{...mont(900), position: 'absolute', right: '11%', top: '11.2%', fontSize: '4.2cqw', color: '#fff', textShadow: `0 0.4cqw 0 ${INK}`, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums'}}>{zoom.toFixed(1)}x</div>
    </AbsoluteFill>
  );
};

/** the definition, for anyone who has not seen the movies */
const Definition: React.FC<{f: number; at: number}> = ({f, at}) => (
  <div style={row('8.5%')}>
    <div style={{width: '84%', ...sticker(PAPER, INK), borderRadius: '2.2cqw', border: `0.8cqw solid ${INK}`, boxShadow: `0 1cqw 0 ${INK}`, padding: '2.4cqw 4cqw 3cqw', transform: `scale(${pop(f, at, 8)}) rotate(-1.5deg)`}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: '2.4cqw'}}><span style={{...anton, fontSize: '9.4cqw', color: '#b8650c'}}>honeypot</span><span style={{...mont(700), fontSize: '3.4cqw', color: '#8a8698', fontStyle: 'italic'}}>noun, spy slang</span></div>
      <div style={{...mont(900), fontSize: '4.3cqw', lineHeight: 1.2, color: INK}}>Romance used as a trap to get someone's secrets.</div>
    </div>
  </div>
);

/** speech bubble with a tail toward the face below */
const Bubble: React.FC<{f: number; at: number; text: string}> = ({f, at, text}) => (
  <div style={row('9%')}>
    <div style={{position: 'relative', transform: `scale(${pop(f, at, 8)}) rotate(-2deg)`, transformOrigin: '45% 100%'}}>
      <div style={{...anton, ...sticker('#ffffff', INK), borderRadius: '5cqw', border: `0.9cqw solid ${INK}`, boxShadow: `0 1cqw 0 ${INK}`, fontSize: '9.6cqw', padding: '1.6cqw 5cqw 1cqw'}}>“{text}”</div>
      <svg viewBox="0 0 60 50" style={{position: 'absolute', left: '38%', bottom: '-6.3cqw', width: '9cqw', overflow: 'visible'}}><path d="M4 0 L18 46 L52 0" fill="#ffffff" stroke={INK} strokeWidth="6.5" strokeLinejoin="round" /><rect x="6" y="-8" width="44" height="11" fill="#ffffff" /></svg>
    </div>
  </div>
);

/** the streaming menu nobody can decide on */
const Menu: React.FC<{f: number}> = ({f}) => {
  const [at, end] = S(25), t = c01((f - at) / (end - at - 8)), secs = Math.round(300 * t), over = secs >= 300;
  const tiles: [string, string, string][] = [['SPY 7', '#c1272d', '#5a0f18'], ['HEIST', '#1c7396', '#0b2c40'], ['LOVE?', '#d9508a', '#6e1f44'], ['SPACE', '#5530a8', '#1f1050'], ['COPS', '#2f8f5a', '#0f3a26'], ['DOG 2', '#d9861f', '#6e3d0a']];
  const order = [0, 4, 2, 5, 1, 3, 0, 2, 4, 1, 5, 3], pick = order[Math.floor((f - at) / 3) % order.length];
  return (
    <div style={row('8.5%')}>
      <div style={{width: '86%', background: '#11141f', border: `0.8cqw solid ${INK}`, borderRadius: '3cqw', boxShadow: `0 1.1cqw 0 ${INK}, 0 0 6cqw rgba(140,200,255,.35)`, padding: '2.6cqw 3cqw 3cqw', transform: `scale(${pop(f, at, 8)})`, transformOrigin: '50% 0%'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.2cqw'}}>
          <div style={{...mont(900), color: '#fff', fontSize: '4cqw', letterSpacing: '0.03em'}}>WHAT TO WATCH?</div>
          <div style={{...anton, ...sticker(over ? RED : '#232838', '#fff'), boxShadow: 'none', border: `0.5cqw solid ${over ? '#fff' : '#3a4158'}`, fontSize: '5.4cqw', padding: '0.2cqw 1.8cqw 0', fontVariantNumeric: 'tabular-nums',
            transform: `scale(${over ? 1.12 + 0.06 * Math.sin(f * 0.9) : 1})`}}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.8cqw'}}>
          {tiles.map(([name, c1, c2], i) => (
            <div key={name} style={{height: '17cqw', borderRadius: '1.4cqw', background: `linear-gradient(160deg, ${c1}, ${c2})`, border: `0.7cqw solid ${i === pick ? YELLOW : '#000'}`, boxShadow: i === pick ? `0 0 3cqw ${YELLOW}` : 'none',
              transform: `scale(${i === pick ? 1.07 : 1})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: '50%', top: '16%', width: '7cqw', height: '7cqw', marginLeft: '-3.5cqw', borderRadius: '50%', background: 'rgba(0,0,0,.28)'}} />
              <div style={{position: 'absolute', left: '50%', top: '42%', width: '11cqw', height: '9cqw', marginLeft: '-5.5cqw', borderRadius: '5cqw 5cqw 0 0', background: 'rgba(0,0,0,.28)'}} />
              <div style={{...anton, color: '#fff', fontSize: '4.6cqw', textShadow: `0 0.4cqw 0 rgba(0,0,0,.6)`, paddingBottom: '0.6cqw', position: 'relative'}}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const closing = S(38)[0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {during(0, W(6)) ? <Stamp f={f} at={W(6)} text="SCANDAL!" top="10%" size={13} /> : null}
      {during(2, W(15)) ? <Stamp f={f} at={W(15)} text="CHINESE SPY?" tone="yellow" top="9.5%" size={11.5} /> : null}
      {during(3, W(19)) ? <NameTag f={f} at={W(19)} name="JENSEN HUANG" role="CEO OF NVIDIA" /> : null}
      {during(6, W(36)) ? <NameTag f={f} at={W(36)} name="ALICE HUANG" role="FORMER MEGASPEED EXECUTIVE" /> : null}
      {during(9, W(48)) ? <Stamp f={f} at={W(48)} text="UNDER INVESTIGATION" top="10%" size={8.6} /> : null}
      {during(10, W(52)) ? <Stamp f={f} at={W(52)} text="ALLEGEDLY" tone="yellow" top="9.5%" size={12} rot={-6} /> : null}
      {during(11, W(58)) ? <Pill f={f} at={W(58)} text="REPORTED BY THE NEW YORK TIMES" top="10%" /> : null}
      {during(13) ? <Viewfinder f={f} /> : null}
      {during(14) ? <Definition f={f} at={S(14)[0]} /> : null}
      {during(16, W(81)) ? <Pill f={f} at={W(81)} text="OCT 29 · BLOOMBERG INTERVIEW" top="10%" /> : null}
      {during(17, W(87)) ? <Bubble f={f} at={W(87)} text="COMPLETELY NORMAL" /> : null}
      {during(18, W(90)) ? <Day f={f} at={W(90)} day="SUNDAY"><Envelope /></Day> : null}
      {during(19) ? <Email f={f} /> : null}
      {during(20, W(103)) ? <Day f={f} at={W(103)} day="MONDAY"><DownArrow /></Day> : null}
      {during(21, W(108) - 2) ? <Counter f={f} /> : null}
      {during(23, W(118)) ? <Stamp f={f} at={W(118)} text="CLASS ACTION FILED" top="21%" size={8.8} /> : null}
      {during(25) ? <Menu f={f} /> : null}
      {during(28, W(144)) ? <NameTag f={f} at={W(144)} name="PRESIDENT TRUMP" role="WHITE HOUSE" top="60%" /> : null}
      {during(30) ? <NameTag f={f} at={S(30)[0] - 20} name="PRESIDENT TRUMP" role="WHITE HOUSE" top="60%" /> : null}
      {during(31, W(159)) ? <Quote f={f} at={W(159)} text={<>He said he had <Hot>absolutely no idea</Hot> that the person in question was a spy.</>} by="PRESIDENT TRUMP" size={4.9} /> : null}
      {during(32, W(169)) ? <Quote f={f} at={W(169)} text={<>It is <Hot>nothing but smears</Hot> against China.</>} by="GUO JIAKUN, CHINA'S FOREIGN MINISTRY" size={5.6} /> : null}
      {during(33, W(174)) ? <Stamp f={f} at={W(174)} text="NOT CHARGED" tone="green" top="10%" size={12} /> : null}
      {during(34, W(180)) ? <Quote f={f} at={W(180)} text={<><Hot>No reason to believe</Hot> that either national security or NVIDIA secrets were compromised.</>} by="NVIDIA'S BOARD" size={4.7} /> : null}
      {during(36, W(193)) ? <Choice f={f} at={W(193)} letter="A" text="TARGETED BY SPIES?" top="10%" tone="red" /> : null}
      {during(37, W(199)) ? <Choice f={f} at={W(199)} letter="B" text="EXPENSIVE DATE?" top="10%" tone="yellow" /> : null}
      {f >= closing ? (
        <>
          <div style={row('8.5%')}><div style={{...anton, fontSize: '10cqw', color: '#fff', WebkitTextStroke: `1.5cqw ${INK}`, paintOrder: 'stroke fill', textShadow: `0 0.9cqw 0 ${INK}`, transform: `scale(${pop(f, closing + 1, 8)})`}}>WHAT DO YOU THINK?</div></div>
          <Choice f={f} at={closing + 9} letter="A" text="TARGETED BY SPIES" top="16.5%" tone="red" />
          <Choice f={f} at={closing + 15} letter="B" text="EXPENSIVE DATE" top="23.5%" tone="yellow" />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
