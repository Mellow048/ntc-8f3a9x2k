import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";
import { Petit } from "./videos/petit/Petit";
import { TOTAL as PETIT_TOTAL, FPS as PETIT_FPS } from "./videos/petit/story";

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
        id="Petit"
        component={Petit}
        durationInFrames={PETIT_TOTAL}
        fps={PETIT_FPS}
        width={720}
        height={1280}
      />
    </>
  );
};
