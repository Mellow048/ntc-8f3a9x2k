import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { DarkDayShort } from "./videos/darkday/DarkDay";
import { CuyahogaShort } from "./videos/cuyahoga/Cuyahoga";
import { OymyakonShort } from "./videos/oymyakon/Oymyakon";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { TOTAL as DD_T, FPS as DD_FPS } from "./videos/darkday/story";
import { TOTAL as CU_T, FPS as CU_FPS } from "./videos/cuyahoga/story";
import { TOTAL as OY_T, FPS as OY_FPS } from "./videos/oymyakon/story";

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="SupermarketShort" component={SupermarketShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
      <Composition id="DarkDayShort" component={DarkDayShort} durationInFrames={DD_T} fps={DD_FPS} width={1080} height={1920} />
      <Composition id="CuyahogaShort" component={CuyahogaShort} durationInFrames={CU_T} fps={CU_FPS} width={1080} height={1920} />
      <Composition id="OymyakonShort" component={OymyakonShort} durationInFrames={OY_T} fps={OY_FPS} width={1080} height={1920} />
    </>
  );
};
