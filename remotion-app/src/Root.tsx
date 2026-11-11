import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { FridgeHackShort } from "./videos/fridge/Fridge";
import { CastSheet as FridgeCastSheet } from "./videos/fridge/CastSheet";
import { TOTAL as FRIDGE_TOTAL, FPS as FRIDGE_FPS } from "./videos/fridge/story";

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
      <Composition id="FridgeCastSheet" component={FridgeCastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    </>
  );
};
