// Graphic layer over the picture: the place-and-date tag, the numbers, and who says what.
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

      {/* 1: what went down with her */}
      {during(3, W(15)) ? <Stamp f={f} at={W(15)} text="11 MILLION COINS" tone="yellow" top="9.5%" size={10} /> : null}
      {during(3, W(16) + 4) ? <Pill f={f} at={W(16) + 4} text="BELIEVED TO BE ABOARD · AP" size={3.1} /> : null}
      {/* 2: the estimates */}
      {during(5, W(36)) ? <Pill f={f} at={W(36)} text="NO COMPLETE MANIFEST EXISTS · ESTIMATES VARY" size={3.1} /> : null}
      {/* 3: the depth, and the secret */}
      {during(8, W(47)) ? <Stamp f={f} at={W(47)} text="2,000 FEET DOWN" tone="white" top="9.5%" size={9} /> : null}
      {during(9, W(52)) ? <Stamp f={f} at={W(52)} text="STATE SECRET" tone="red" top="9.5%" size={11} /> : null}
      {during(9, W(55)) ? <Pill f={f} at={W(55)} text="HER COORDINATES HAVE NOT BEEN PUBLISHED" size={3.1} /> : null}
      {/* 4: what came up */}
      {during(10, W(57)) ? <Pill f={f} at={W(57)} text="19 NOVEMBER 2025 · COLOMBIA'S MINISTRY OF CULTURES" size={3} /> : null}
      {during(12, W(66)) ? <Pill f={f} at={W(66)} text="A BRONZE CANNON, IN A REFRIGERATED CONTAINER · ICANH" size={2.9} /> : null}
      {during(14, W(68)) ? <Pill f={f} at={W(68)} text="THREE COINS, KEPT IN SALT WATER · ICANH" size={3} /> : null}
      {during(15, W(71)) ? <Pill f={f} at={W(71)} text="THE INVENTORY SAYS TWO COMPLETE CUPS · LIVE SCIENCE" size={2.8} /> : null}
      {/* 6: the claims */}
      {during(18, W(99)) ? <Stamp f={f} at={W(99)} text="A WAR GRAVE" tone="red" top="9.5%" size={10} /> : null}
      {during(19, W(101) + 4) ? <Pill f={f} at={W(101) + 4} text="SPAIN: A SPANISH NAVY SHIP, AND 600 OF HER CREW" size={2.9} /> : null}
      {during(21, W(108)) ? <Pill f={f} at={W(108)} text="THE QHARA QHARA CLAIMED IN 2018 · CERRO RICO, POTOSÍ" size={2.8} /> : null}
      {/* 7: the salvor */}
      {during(22, W(121)) ? <Pill f={f} at={W(121)} text="SEA SEARCH ARMADA, FORMERLY GLOCCA MORA · AP" size={2.9} /> : null}
      {during(23, W(128)) ? <Stamp f={f} at={W(128)} text="$10 BILLION" tone="yellow" top="9.5%" size={11} /> : null}
      {/* 8: ten kilometres, and the decree */}
      {during(25, W(139)) ? <Stamp f={f} at={W(139)} text="10 KM OFF" tone="white" top="9.5%" size={10} /> : null}
      {during(25, W(141) + 3) ? <Pill f={f} at={W(141) + 3} text="COLOMBIA: THE COORDINATES THEY GAVE IN 1982 WERE WRONG" size={2.7} /> : null}
      {during(26, W(142)) ? <Pill f={f} at={W(142)} text="A PRESIDENTIAL DECREE OF 1984" size={3} /> : null}
      {during(27, W(149)) ? <Stamp f={f} at={W(149)} text="50% TO 5%" tone="red" top="9.5%" size={10.5} /> : null}
      {/* 9: the watchdog, and the denial */}
      {during(28, W(156)) ? <Pill f={f} at={W(156)} text="A COLOMBIAN HERITAGE GROUP'S OPEN LETTER · DAILY GALAXY" size={2.7} /> : null}
      {during(29, W(165)) ? <Stamp f={f} at={W(165)} text="2016 · 2022" tone="white" top="9.5%" size={9.5} /> : null}
      {during(30, W(174)) ? <Stamp f={f} at={W(174)} text="LEAKED?" tone="red" top="9.5%" size={9.5} /> : null}
      {during(31, W(178)) ? <Pill f={f} at={W(178)} text="ICANH: NO LOOTING, THE CHARGE IS DENIED" size={2.9} /> : null}
      {/* 10: the government's line */}
      {during(32, W(186)) ? <Stamp f={f} at={W(186)} text="SCIENCE, NOT TREASURE" tone="yellow" top="9.5%" size={8.6} /> : null}
      {during(33, W(191)) ? <Pill f={f} at={W(191)} text="PETRO'S TERM ENDS IN 2026 · THE WRECK IS NOT RAISED" size={2.7} /> : null}
      {/* 11: what is all there is, so far */}
      {during(36, W(200)) ? <Stamp f={f} at={W(200)} text="SO FAR" tone="white" top="9.5%" size={9} /> : null}
      {/* 13: the four claims */}
      {during(38, W(233)) ? <Pill f={f} at={W(233)} text="COLOMBIA · SPAIN · THE QHARA QHARA · SEA SEARCH ARMADA" size={2.7} top="20%" /> : null}
      {during(39, W(250)) ? <Pill f={f} at={W(250)} text="AT THE PERMANENT COURT OF ARBITRATION, THE HAGUE" size={2.8} top="20%" /> : null}
    </AbsoluteFill>
  );
};
