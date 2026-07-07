import "./global-components";

import {
  createNMPv3PlusFrameworkAdapter,
  nmpv3PlusElementEvents,
  type NMPv3PlusNativeElementProps,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusVueBinding {
  attrs: Record<string, string | boolean>;
  events: Record<string, string>;
}

export type NMPv3PlusVuePlayerProps = NMPv3PlusNativeElementProps;

export const createNMPv3PlusVueBinding = createNMPv3PlusFrameworkAdapter(
  (plan): NMPv3PlusVueBinding => ({
    attrs: plan.attrs,
    events: { ...nmpv3PlusElementEvents },
  }),
);
