import { Composition, Folder } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { PigWarShort } from "./videos/pig-war/PigWar";
import { TOTAL as PW_TOTAL, FPS as PW_FPS } from "./videos/pig-war/story";

export const Root: React.FC = () => {
  return (
    <>
      <Folder name="PigWar">
        <Composition
          id="PigWarShort"
          component={PigWarShort}
          durationInFrames={PW_TOTAL}
          fps={PW_FPS}
          width={1080}
          height={1920}
        />
      </Folder>
      <Composition
        id="SupermarketShort"
        component={SupermarketShort}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
