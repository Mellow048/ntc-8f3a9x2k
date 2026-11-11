import React from "react";
import { Composition, Freeze, getInputProps, useCurrentFrame } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { FridgeHackShort } from "./videos/fridge/Fridge";
import { CastSheet as FridgeCastSheet } from "./videos/fridge/CastSheet";
import { TOTAL as FRIDGE_TOTAL, FPS as FRIDGE_FPS } from "./videos/fridge/story";
import { BinanceHeistShort } from "./videos/binance/Binance";
import { CastSheet as BinanceCastSheet } from "./videos/binance/CastSheet";
import { TOTAL as BINANCE_TOTAL, FPS as BINANCE_FPS } from "./videos/binance/story";

/** Review stills in one browser page: output frame i shows film frame `frames[i]` (see scripts/pick.sh).
 *  The composition keeps the film's length because Remotion clamps a frozen frame to the composition's duration. */
const pick = () => ((getInputProps() as { frames?: number[] }).frames ?? [0]) as number[];
const FridgeReview: React.FC = () => {
  const i = useCurrentFrame(), list = pick();
  return <Freeze frame={list[Math.min(list.length - 1, i)]}><FridgeHackShort /></Freeze>;
};

const BinanceReview: React.FC = () => {
  const i = useCurrentFrame(), list = pick();
  return <Freeze frame={list[Math.min(list.length - 1, i)]}><BinanceHeistShort /></Freeze>;
};

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
      <Composition id="FridgeHackShort" component={FridgeHackShort} durationInFrames={FRIDGE_TOTAL} fps={FRIDGE_FPS} width={1080} height={1920} />
      <Composition id="FridgeReview" component={FridgeReview} durationInFrames={FRIDGE_TOTAL} fps={FRIDGE_FPS} width={1080} height={1920} />
      <Composition id="FridgeCastSheet" component={FridgeCastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="BinanceHeistShort" component={BinanceHeistShort} durationInFrames={BINANCE_TOTAL} fps={BINANCE_FPS} width={1080} height={1920} />
      <Composition id="BinanceReview" component={BinanceReview} durationInFrames={BINANCE_TOTAL} fps={BINANCE_FPS} width={1080} height={1920} />
      <Composition id="BinanceCastSheet" component={BinanceCastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    </>
  );
};
