import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { CyberleekShort } from "./videos/gta6/Gta6";
import { CastSheet as CyberleekCastSheet } from "./videos/gta6/CastSheet";
import { TOTAL as LEEK_TOTAL, FPS as LEEK_FPS } from "./videos/gta6/story";

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
      <Composition id="CyberleekShort" component={CyberleekShort} durationInFrames={LEEK_TOTAL} fps={LEEK_FPS} width={1080} height={1920} />
      <Composition id="CyberleekCastSheet" component={CyberleekCastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    </>
  );
};
