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
      appendPluginStyle(root, "visualizer", nmpv3PlusVisualizerCss);

      const visualizer = createPluginElement(
        host,
        "div",
        ["nmpv3-plus-visualizer", options.className].filter(Boolean).join(" "),
      );
      visualizer.dataset.mode = mode;
      visualizer.dataset.state = "idle";
      visualizer.setAttribute("aria-hidden", "true");

      for (let index = 0; index < barCount; index += 1) {
        const bar = createPluginElement(
          root,
          "span",
          "nmpv3-plus-visualizer__bar",
        );
        bar.style.height = `${8 + ((index * 7) % 17)}px`;
        bar.style.animationDelay = `${index * 54}ms`;
        visualizer.append(bar);
      }

      host.append(visualizer);
      const stopPlay = ctx.on("play", () => {
        visualizer.dataset.state = "playing";
      });
      const stopPause = ctx.on("pause", () => {
        visualizer.dataset.state = "idle";
      });
      const stopSongChange = ctx.on("songchange", () => {
        visualizer.dataset.state = "ready";
      });

      return () => {
        stopPlay();
        stopPause();
        stopSongChange();
        removeElement(visualizer);
      };
    },
  };
}
