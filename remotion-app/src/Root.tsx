import React from "react";
import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
// news:imports — one line per news film in this checkout (references/news/restore.py adds it)
import { NvExitCompositions } from "./videos/nvexit/register";

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
      <NvExitCompositions />
    </>
  );
};
