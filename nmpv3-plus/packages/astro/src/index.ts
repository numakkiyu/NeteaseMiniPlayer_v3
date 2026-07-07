import {
  createNMPv3PlusFrameworkAdapter,
  type NMPv3PlusElementConfig,
  type NMPv3PlusElementPlan,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusAstroIslandPlan {
  clientDirective: "client:only";
  clientOnlyFramework: "none";
  element: NMPv3PlusElementPlan;
}

export function createNMPv3PlusAstroIslandPlan(
  config: NMPv3PlusElementConfig,
): NMPv3PlusAstroIslandPlan {
  return createNMPv3PlusFrameworkAdapter(
    (element): NMPv3PlusAstroIslandPlan => ({
      clientDirective: "client:only",
      clientOnlyFramework: "none",
      element,
    }),
  )(config);
}
