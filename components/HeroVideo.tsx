import { LazyVideo } from "./LazyVideo";

export function HeroVideo() {
  return (
    <LazyVideo
      poster="/images/hero/hero1.jpg"
      sources={[{ src: "/hero-redtours.mp4", type: "video/mp4" }]}
    />
  );
}
