import {
  createNMPv3PlusFrameworkAdapter,
  type NMPv3PlusElementConfig,
  type NMPv3PlusElementPlan,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusNextClientPlan {
  componentName: string;
  dynamicOptions: {
    ssr: false;
  };
  element: NMPv3PlusElementPlan;
}

export function createNMPv3PlusNextClientPlan(
  config: NMPv3PlusElementConfig,
  componentName = "NMPv3PlusPlayer",
): NMPv3PlusNextClientPlan {
  return createNMPv3PlusFrameworkAdapter(
    (element): NMPv3PlusNextClientPlan => ({
      componentName,
      dynamicOptions: {
        ssr: false,
      },
      element,
    }),
  )(config);
}
