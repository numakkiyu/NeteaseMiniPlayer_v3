import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";
import { appendPluginStyle } from "../utils/dom";
import { nmpv3PlusAdvancedLayoutCssText } from "./styleText";

export type NMPv3PlusAdvancedLayout = "card" | "cover";

export interface NMPv3PlusAdvancedLayoutOptions {
  layout: NMPv3PlusAdvancedLayout;
}

export const nmpv3PlusAdvancedLayoutCss = nmpv3PlusAdvancedLayoutCssText;

export function createAdvancedLayoutPlugin(
  options: NMPv3PlusAdvancedLayoutOptions,
): NMPv3PlusPlugin {
  return {
    name: "nmpv3-plus-extension-advanced-layouts",
    version: "1.0.0",
    setup(ctx) {
      const root = ctx.root;

      if (!root) {
        ctx.logger.warn("Advanced layout extension requires a runtime root.");
        return undefined;
      }

      const target = ctx.getPart("player") ?? root;
      const className = `nmpv3-plus-layout-${options.layout}`;
      appendPluginStyle(root, "advanced-layouts", nmpv3PlusAdvancedLayoutCss);
      target.classList.add(className);
      target.dataset.nmpv3PlusLayout = options.layout;
      ctx.emit("layout:applied", { layout: options.layout, target });

      return () => {
        target.classList.remove(className);
        delete target.dataset.nmpv3PlusLayout;
      };
    },
  };
}
