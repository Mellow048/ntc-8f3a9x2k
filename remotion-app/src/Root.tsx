import React from "react";
import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
// news:imports — one line per news film in this checkout (references/news/restore.py adds it)
import { BtcFlexCompositions } from "./videos/btcflex/register";
import { NvExitCompositions } from "./videos/nvexit/register";
// regular shorts made with the same machinery
import { MonaCompositions } from "./videos/mona/register";
import { SanJoseCompositions } from "./videos/sanjose/register";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="SupermarketShort"
        component={SupermarketShort}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
      />
      {/* news:compositions — one line per news film in this checkout (references/news/restore.py adds it) */}
      <BtcFlexCompositions />
      <NvExitCompositions />
      <MonaCompositions />
      <SanJoseCompositions />
    </>
  );
};
