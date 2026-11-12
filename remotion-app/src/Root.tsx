import React from "react";
import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { EmuWarShort } from "./videos/emu-war/EmuWar";
import { TOTAL as EMU_TOTAL, FPS as EMU_FPS } from "./videos/emu-war/story";
// news:imports — one line per news film in this checkout (references/news/restore.py adds it)

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
      <Composition
        id="EmuWarShort"
        component={EmuWarShort}
        durationInFrames={EMU_TOTAL}
        fps={EMU_FPS}
        width={1080}
        height={1920}
      />
      {/* news:compositions — one line per news film in this checkout (references/news/restore.py adds it) */}
    </>
  );
};
