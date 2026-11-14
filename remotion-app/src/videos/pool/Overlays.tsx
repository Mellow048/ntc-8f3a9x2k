// Graphic layer over the picture: the place-and-date tag, the numbers, and what the law says.
// Every graphics cue is a word of the narration, so re-timing the voice moves it too.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SHOTS, shotEnd, W} from './story';

const INK = '#15121c', RED = '#e3342f', YELLOW = '#ffe14a', PAPER = '#fffdf4';
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const out3 = (t: number) => 1 - (1 - t) ** 3;
const back = (t: number) => 1 + 2.9 * (t - 1) ** 3 + 1.9 * (t - 1) ** 2;
const pop = (f: number, at: number, d = 8) => back(c01((f - at) / d));
const anton: React.CSSProperties = {fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.08, whiteSpace: 'nowrap'};
const mont = (weight: 700 | 900 = 900): React.CSSProperties => ({fontFamily: 'Montserrat, sans-serif', fontWeight: weight});
const sticker = (bg: string, color: string): React.CSSProperties => ({background: bg, color, border: `0.085em solid ${INK}`, borderRadius: '0.16em', boxShadow: `0 0.11em 0 ${INK}`});
const row = (top: string): React.CSSProperties => ({position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center'});

/** the place and the date, top left; it stays up while the shots keep the same tag */
const Tag: React.FC<{text: string; f: number; at: number}> = ({text, f, at}) => (
  <div style={{position: 'absolute', left: '4.6%', top: '3.4%', opacity: c01((f - at + 1) / 3)}}>
    <div style={{...mont(900), background: INK, color: '#ffffff', fontSize: '2.9cqw', letterSpacing: '0.09em', padding: '0.42em 0.62em', borderLeft: `0.8cqw solid ${YELLOW}`}}>{text}</div>
  </div>
);

const Stamp: React.FC<{f: number; at: number; text: string; tone?: 'red' | 'yellow' | 'white'; top?: string; size?: number}> = ({f, at, text, tone = 'red', top = '10%', size = 10.5}) => {
  const bg = tone === 'red' ? RED : tone === 'yellow' ? YELLOW : PAPER, fg = tone === 'yellow' || tone === 'white' ? INK : '#ffffff';
  const age = f - at, wobble = age < 9 ? Math.sin(age * 2.2) * (1 - age / 9) * 2.5 : 0;
  return (
    <div style={row(top)}>
      <div style={{...anton, ...sticker(bg, fg), fontSize: `${size}cqw`, padding: '0.02em 0.3em 0', transform: `rotate(${-4 + wobble}deg) scale(${2.4 - 1.4 * out3(c01(age / 5))})`, opacity: c01((age + 1) / 2)}}>{text}</div>
    </div>
  );
};

/** a line in a dark plate: a source, or a number that needs a caveat */
const Pill: React.FC<{f: number; at: number; text: string; top?: string; size?: number}> = ({f, at, text, top = '20.5%', size = 3.3}) => (
  <div style={row(top)}>
    <div style={{...mont(900), background: INK, color: '#ffffff', fontSize: `${size}cqw`, letterSpacing: '0.05em', padding: '0.5em 0.8em', transform: `scale(${pop(f, at, 7)})`, opacity: c01((f - at + 1) / 2), maxWidth: '88%', textAlign: 'center'}}>{text}</div>
  </div>
);

export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const during = (i: number, from = SHOTS[i].at) => f >= from && f < shotEnd(i);
  const shot = SHOTS.findIndex((s, i) => f >= s.at && f < shotEnd(i));
  const tag = shot >= 0 ? SHOTS[shot].tag : undefined;
  // the tag stays up from the shot that gives it until the next shot without one
  let tagFrom = shot;
  while (tagFrom > 0 && SHOTS[tagFrom - 1].tag === tag) tagFrom--;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {tag ? <Tag f={f} at={SHOTS[tagFrom].at} text={tag} /> : null}

      {/* 1: what came up */}
      {during(2, W(17)) ? <Pill f={f} at={W(17)} text="A SWIMMING POOL, IN A SUBURBAN GARDEN" size={3.0} /> : null}
      {/* 2: five bars, many coins, the estimate */}
      {during(5, W(29)) ? <Stamp f={f} at={W(29)} text="FIVE BARS" tone="yellow" top="9.5%" size={10} /> : null}
      {during(6, W(31) + 3) ? <Pill f={f} at={W(31) + 3} text="AND 41 GOLD COINS, IN PLASTIC BAGS" size={3.0} /> : null}
      {during(7, W(36)) ? <Stamp f={f} at={W(36)} text="700,000 EUROS" tone="red" top="9.5%" size={11} /> : null}
      {during(7, W(42) + 2) ? <Pill f={f} at={W(42) + 2} text="THE TOWN HALL'S ESTIMATE · RTL, 6 NOVEMBER 2025" size={2.8} /> : null}
      {/* 4: the code */}
      {during(12, W(68)) ? <Stamp f={f} at={W(68)} text="A TREASURE" tone="white" top="9.5%" size={10} /> : null}
      {during(13, W(79) + 2) ? <Pill f={f} at={W(79) + 2} text="CIVIL CODE, ARTICLE 716 · HIDDEN OR BURIED, FOUND BY CHANCE" size={2.7} /> : null}
      {during(15, W(93)) ? <Stamp f={f} at={W(93)} text="IT IS YOURS" tone="red" top="9.5%" size={10.5} /> : null}
      {/* 5: the state */}
      {during(16, W(99)) ? <Stamp f={f} at={W(99)} text="ARCHAEOLOGY?" tone="yellow" top="9.5%" size={10} /> : null}
      {during(17, W(106) + 2) ? <Pill f={f} at={W(106) + 2} text="THE REGIONAL CULTURE OFFICE CAME TO LOOK" size={2.9} /> : null}
      {/* 6: no history */}
      {during(19, W(118)) ? <Stamp f={f} at={W(118)} text="NO HISTORY IN IT" tone="red" top="9.5%" size={9.2} /> : null}
      {during(21, W(128)) ? <Stamp f={f} at={W(128)} text="MELTED 15-20 YEARS AGO" tone="white" top="9.5%" size={7.6} /> : null}
      {/* 7: the numbers */}
      {during(22, W(141) + 2) ? <Pill f={f} at={W(141) + 2} text="FIVE BARS, EACH WITH ITS OWN NUMBER" size={2.9} /> : null}
      {during(23, W(147)) ? <Stamp f={f} at={W(147)} text="NOTHING STOLEN" tone="red" top="9.5%" size={9.6} /> : null}
      {during(24, W(150) + 2) ? <Pill f={f} at={W(150) + 2} text="BOUGHT LEGALLY · NOBODY HAD REPORTED IT MISSING" size={2.8} /> : null}
      {/* 8: the man who buried it */}
      {during(25, W(165) + 2) ? <Pill f={f} at={W(165) + 2} text="THE PREVIOUS OWNER OF THE HOUSE" size={3.0} /> : null}
      {during(28, W(177)) ? <Stamp f={f} at={W(177)} text="HE WAS DEAD" tone="white" top="9.5%" size={9.5} /> : null}
      {/* 9: no heir, not heritage */}
      {during(29, W(179)) ? <Stamp f={f} at={W(179)} text="NO HEIR" tone="red" top="9.5%" size={10} /> : null}
      {during(29, W(185) + 2) ? <Pill f={f} at={W(185) + 2} text="THE RHONE PREFECTURE · NOVEMBER 2025" size={2.9} /> : null}
      {during(30, W(191)) ? <Stamp f={f} at={W(191)} text="NOT HERITAGE" tone="yellow" top="9.5%" size={9.6} /> : null}
      {during(31, W(196) + 2) ? <Pill f={f} at={W(196) + 2} text="AND THE GOLD WENT TO THE MAN WITH THE POOL" size={2.8} /> : null}
      {/* 10: the tax */}
      {during(33, W(208)) ? <Stamp f={f} at={W(208)} text="FINDING: NOT TAXED" tone="white" top="9.5%" size={8.2} /> : null}
      {during(34, W(212)) ? <Stamp f={f} at={W(212)} text="11.5 % FLAT" tone="red" top="9.5%" size={10.5} /> : null}
      {during(34, W(215) + 2) ? <Pill f={f} at={W(215) + 2} text="ON RESALE OF PRECIOUS METALS · INCLUDING 0.5 % CRDS" size={2.7} /> : null}
      {during(35, W(220)) ? <Stamp f={f} at={W(220)} text="-80,500 EUROS" tone="white" top="9.5%" size={9.4} /> : null}
      {during(36, W(226)) ? <Stamp f={f} at={W(226)} text="619,500 EUROS" tone="yellow" top="9.5%" size={10} /> : null}
      {/* 11: no interviews */}
      {during(37, W(235)) ? <Stamp f={f} at={W(235)} text="NO INTERVIEWS" tone="red" top="9.5%" size={9.4} /> : null}
      {during(39, W(241) + 2) ? <Pill f={f} at={W(241) + 2} text="THE LOCAL PAPER'S NAME FOR HIM" size={3.0} /> : null}
      {/* 12: the bags, still there */}
      {during(41, W(253) + 2) ? <Pill f={f} at={W(253) + 2} text="700,000 EUROS, PUT IN THE GROUND AND LEFT" size={2.9} /> : null}
      {/* 13: the four answers */}
      {during(43, W(280)) ? <Pill f={f} at={W(280)} text="A BANK · A DIVORCE · THE TAX OFFICE · WHOEVER CAME NEXT" size={2.7} top="20%" /> : null}
    </AbsoluteFill>
  );
};
