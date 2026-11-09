import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL as SUPERMARKET_TOTAL, FPS as SUPERMARKET_FPS } from "./videos/supermarket/story";
import { PendulumShort } from "./videos/pendulum/Pendulum";
import { TOTAL as PENDULUM_TOTAL, FPS as PENDULUM_FPS } from "./videos/pendulum/story";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PendulumShort"
        component={PendulumShort}
        durationInFrames={PENDULUM_TOTAL}
        fps={PENDULUM_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="SupermarketShort"
        component={SupermarketShort}
        durationInFrames={SUPERMARKET_TOTAL}
        fps={SUPERMARKET_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
