import { Composition } from "remotion";
import { SupermarketShort } from "./videos/supermarket/Supermarket";
import { TOTAL as SUPERMARKET_TOTAL, FPS as SUPERMARKET_FPS } from "./videos/supermarket/story";
import { PendulumShort } from "./videos/pendulum/Pendulum";
import { TOTAL as PENDULUM_TOTAL, FPS as PENDULUM_FPS } from "./videos/pendulum/story";
import { EngineeringShort, stories, type Slug } from "./videos/engineering-series/Series";

const series: [string, Slug][] = [
  ["BreathingBridgeShort", "breathing-bridge"],
  ["SpringBuildingShort", "spring-building"],
  ["OceanAirportShort", "ocean-airport"],
  ["ChannelTunnelShort", "channel-tunnel"],
  ["SkyPlazaShort", "sky-plaza"],
];

export const Root: React.FC = () => {
  return (
    <>
      {series.map(([id, slug]) => <Composition
        key={id}
        id={id}
        component={EngineeringShort}
        defaultProps={{slug}}
        durationInFrames={stories[slug].frames}
        fps={30}
        width={1080}
        height={1920}
      />)}
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
