import { LazyVideo } from "./LazyVideo";

export function HeroVideo() {
  return (
    <LazyVideo
      sources={[{ src: "/hero-redtours.mp4", type: "video/mp4" }]}
    />
  );
}
