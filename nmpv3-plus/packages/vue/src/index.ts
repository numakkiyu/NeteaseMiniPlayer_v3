import {
  nmpv3PlusElementEvents,
  toNMPv3PlusElementAttrs,
  type NMPv3PlusElementConfig,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusVueBinding {
  attrs: Record<string, string | boolean>;
  events: Record<string, string>;
}

export function createNMPv3PlusVueBinding(
  config: NMPv3PlusElementConfig,
): NMPv3PlusVueBinding {
  return {
    attrs: toNMPv3PlusElementAttrs(config),
    events: { ...nmpv3PlusElementEvents },
  };
}
