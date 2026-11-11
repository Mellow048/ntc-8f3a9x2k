import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL, FPS } from "./videos/supermarket/story";

import { Koepenick } from "./videos/koepenick/Koepenick";
import { TOTAL as KOEPENICK_TOTAL } from "./videos/koepenick/story";

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
    <Composition id="Koepenick" component={Koepenick} durationInFrames={KOEPENICK_TOTAL} fps={30} width={720} height={1280}/>
    </>
  );
};
