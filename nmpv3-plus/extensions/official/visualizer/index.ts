import { gsap } from "gsap";
import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";
import {
  appendPluginStyle,
  createPluginElement,
  removeElement,
} from "../utils/dom";
import { nmpv3PlusVisualizerCssText } from "./styleText";

export type NMPv3PlusVisualizerMode = "bars" | "wave" | "ambient";

export interface NMPv3PlusVisualizerOptions {
  mode?: NMPv3PlusVisualizerMode;
  bars?: number;
  className?: string;
}

export const nmpv3PlusVisualizerCss = nmpv3PlusVisualizerCssText;

export function createVisualizerPlugin(
  options: NMPv3PlusVisualizerOptions = {},
): NMPv3PlusPlugin {
  const mode = options.mode ?? "bars";
  // 柱状图数量限制 3~24，默认 12
  const barCount = Math.max(3, Math.min(24, options.bars ?? 12));

  return {
    name: "nmpv3-plus-extension-visualizer",
    version: "1.0.0",
    setup(ctx) {
      const root = ctx.root;

      if (!root) {
        ctx.logger.warn(
          "Visualizer extension requires a runtime root element.",
        );
        return undefined;
      }

      const host = ctx.getPart("player") ?? root;

      host.style.position ||= "relative";
      host.classList.add("nmpv3-plus-visualizer-host");
      appendPluginStyle(root, "visualizer", nmpv3PlusVisualizerCss);

      const visualizer = createPluginElement(
        host,
        "div",
        ["nmpv3-plus-visualizer", options.className].filter(Boolean).join(" "),
      );
      visualizer.dataset.mode = mode;
      visualizer.dataset.state = "idle";
      visualizer.setAttribute("aria-hidden", "true");

      const bars: HTMLElement[] = [];
      for (let index = 0; index < barCount; index += 1) {
        const bar = createPluginElement(
          root,
          "span",
          "nmpv3-plus-visualizer__bar",
        );
        bar.style.height = `${8 + ((index * 7) % 17)}px`;
        bar.style.transform = `scaleY(${0.34 + (index % 4) * 0.06})`;
        bars.push(bar);
        visualizer.append(bar);
      }

      host.append(visualizer);
      const motion = createGsapVisualizerMotion(host, visualizer, bars);
      const setState = (state: "idle" | "ready" | "playing") => {
        visualizer.dataset.state = state;

        if (state === "playing") {
          motion?.play();
        } else if (state === "ready") {
          motion?.ready();
        } else {
          motion?.idle();
        }
      };

      const stopPlay = ctx.on("play", () => {
        setState("playing");
      });
      const stopPause = ctx.on("pause", () => {
        setState("idle");
      });
      const stopSongChange = ctx.on("songchange", () => {
        setState("ready");
      });

      return () => {
        stopPlay();
        stopPause();
        stopSongChange();
        motion?.destroy();
        host.classList.remove("nmpv3-plus-visualizer-host");
        removeElement(visualizer);
      };
    },
  };
}

interface GsapVisualizerMotion {
  play(): void;
  ready(): void;
  idle(): void;
  destroy(): void;
}

function createGsapVisualizerMotion(
  host: HTMLElement,
  visualizer: HTMLElement,
  bars: HTMLElement[],
): GsapVisualizerMotion | null {
  const win = host.ownerDocument.defaultView;

  if (
    !win?.HTMLElement ||
    !(host instanceof win.HTMLElement) ||
    !(visualizer instanceof win.HTMLElement)
  ) {
    return null;
  }

  const coverButton = host.querySelector<HTMLElement>(".nmpv3-cover-button");
  const targets = coverButton
    ? [visualizer, coverButton, ...bars]
    : [visualizer, ...bars];
  const matchMedia = gsap.matchMedia();
  let barsTimeline: gsap.core.Timeline | null = null;
  let coverTimeline: gsap.core.Timeline | null = null;

  matchMedia.add(
    {
      canAnimate: "(prefers-reduced-motion: no-preference)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const canAnimate = context.conditions?.canAnimate === true;

      if (!canAnimate) {
        gsap.set(visualizer, { autoAlpha: 0.62, y: 0 });
        gsap.set(bars, { scaleY: 0.62, opacity: 0.78 });
        return undefined;
      }

      gsap.set(visualizer, { autoAlpha: 0, y: 3 });
      gsap.set(bars, {
        scaleY: (index) => 0.32 + (index % 4) * 0.05,
        opacity: 0.72,
        transformOrigin: "50% 100%",
      });

      barsTimeline = gsap.timeline({
        paused: true,
        repeat: -1,
        yoyo: true,
        defaults: { duration: 0.52, ease: "sine.inOut" },
      });
      barsTimeline
        .to(
          bars,
          {
            scaleY: (index) => 0.48 + ((index * 5) % 9) / 10,
            opacity: (index) => 0.68 + ((index * 3) % 5) / 20,
            stagger: { each: 0.032, from: "center" },
          },
          0,
        )
        .to(
          bars,
          {
            scaleY: (index) => 0.38 + ((index * 7) % 8) / 11,
            stagger: { each: 0.026, from: "edges" },
          },
          ">-0.08",
        );

      if (coverButton) {
        gsap.set(coverButton, { transformOrigin: "50% 50%" });
        coverTimeline = gsap.timeline({
          paused: true,
          repeat: -1,
          yoyo: true,
          defaults: { duration: 1.6, ease: "sine.inOut" },
        });
        coverTimeline.to(coverButton, { scale: 1.012 }, 0);
      }

      return () => {
        barsTimeline?.kill();
        coverTimeline?.kill();
        barsTimeline = null;
        coverTimeline = null;
      };
    },
    host,
  );

  return {
    play() {
      gsap.to(visualizer, {
        autoAlpha: 0.82,
        y: 0,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
      barsTimeline?.restart();
      coverTimeline?.restart();
    },
    ready() {
      barsTimeline?.pause(0);
      coverTimeline?.pause(0);
      gsap.to(visualizer, {
        autoAlpha: 0.5,
        y: 0,
        duration: 0.18,
        ease: "power1.out",
        overwrite: "auto",
      });
      gsap.to(bars, {
        scaleY: 0.54,
        opacity: 0.7,
        duration: 0.2,
        ease: "power1.out",
        overwrite: "auto",
      });
      if (coverButton) {
        gsap.to(coverButton, {
          scale: 1,
          duration: 0.2,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
    },
    idle() {
      barsTimeline?.pause(0);
      coverTimeline?.pause(0);
      gsap.to(visualizer, {
        autoAlpha: 0.24,
        y: 3,
        duration: 0.2,
        ease: "power1.out",
        overwrite: "auto",
      });
      gsap.to(bars, {
        scaleY: 0.38,
        opacity: 0.6,
        duration: 0.18,
        ease: "power1.out",
        overwrite: "auto",
      });
      if (coverButton) {
        gsap.to(coverButton, {
          scale: 1,
          duration: 0.18,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
    },
    destroy() {
      matchMedia.revert();
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "all" });
    },
  };
}
