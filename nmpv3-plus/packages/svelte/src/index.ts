import {
  nmpv3PlusElementEvents,
  toNMPv3PlusElementAttrs,
  type NMPv3PlusElementAttrs,
  type NMPv3PlusElementConfig,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusSvelteBinding {
  tagName: "nmp-player";
  props: NMPv3PlusElementAttrs;
  events: Record<string, string>;
  onMountImports: string[];
}

export function createNMPv3PlusSvelteBinding(
  config: NMPv3PlusElementConfig,
): NMPv3PlusSvelteBinding {
  return {
    tagName: "nmp-player",
    props: toNMPv3PlusElementAttrs(config),
    events: { ...nmpv3PlusElementEvents },
    onMountImports: [
      "@netease-mini-player/v3/auto",
      "@netease-mini-player/v3-plus",
    ],
  };
}
