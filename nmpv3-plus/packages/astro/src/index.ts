import {
  createNMPv3PlusElementPlan,
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
  return {
    clientDirective: "client:only",
    clientOnlyFramework: "none",
    element: createNMPv3PlusElementPlan(config),
  };
}
