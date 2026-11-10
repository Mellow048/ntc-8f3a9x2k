import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { CastSheet } from "./videos/nvidia/CastSheet";
import { NvidiaShort } from "./videos/nvidia/Nvidia";
import { TOTAL as NVIDIA_TOTAL, FPS as NVIDIA_FPS } from "./videos/nvidia/story";

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
      <Composition id="NvidiaShort" component={NvidiaShort} durationInFrames={NVIDIA_TOTAL} fps={NVIDIA_FPS} width={1080} height={1920} />
      <Composition id="NvidiaCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    </>
  );
};
