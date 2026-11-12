// Bundled fonts (public/fonts): captions, cards and the signs painted into the 3D sets all use them, so the
// film looks the same on a laptop and on a CI runner. Nothing is drawn until they are loaded.
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

let ready: Promise<void> | null = null;
export const loadFonts = () => (ready ??= (async () => {
  const faces = [
    new FontFace('Anton', `url(${staticFile('fonts/anton-latin-400-normal.woff2')}) format('woff2')`, {weight: '400'}),
    new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-700-normal.woff2')}) format('woff2')`, {weight: '700'}),
    new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-900-normal.woff2')}) format('woff2')`, {weight: '900'}),
  ];
  await Promise.all(faces.map(async (f) => { await f.load(); document.fonts.add(f); }));
})());

export function useFonts() {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => { loadFonts().then(() => { setOk(true); continueRender(handle); }).catch((e) => cancelRender(e)); }, [handle]);
  return ok;
}
