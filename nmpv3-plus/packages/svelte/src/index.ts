import {
  createNMPv3PlusFrameworkAdapter,
  nmpv3PlusElementEvents,
  type NMPv3PlusElementAttrs,
  type NMPv3PlusNativeElementProps,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusSvelteBinding {
  tagName: "nmp-player";
  props: NMPv3PlusElementAttrs;
  events: Record<string, string>;
  onMountImports: string[];
}

export type NMPv3PlusSvelteComponentProps = NMPv3PlusNativeElementProps;

export const createNMPv3PlusSvelteBinding = createNMPv3PlusFrameworkAdapter(
  (plan): NMPv3PlusSvelteBinding => ({
    tagName: "nmp-player",
    props: plan.attrs,
    events: { ...nmpv3PlusElementEvents },
    onMountImports: plan.requiredImports,
  }),
);
