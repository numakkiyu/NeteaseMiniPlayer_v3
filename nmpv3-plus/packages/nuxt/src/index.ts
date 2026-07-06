import {
  createNMPv3PlusElementPlan,
  type NMPv3PlusElementConfig,
  type NMPv3PlusElementPlan,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusNuxtClientPlan {
  pluginFilename: string;
  componentName: string;
  mode: "client";
  element: NMPv3PlusElementPlan;
}

export function createNMPv3PlusNuxtClientPlan(
  config: NMPv3PlusElementConfig,
  componentName = "NMPv3PlusPlayer",
): NMPv3PlusNuxtClientPlan {
  return {
    pluginFilename: "nmpv3-plus.client.ts",
    componentName,
    mode: "client",
    element: createNMPv3PlusElementPlan(config),
  };
}
