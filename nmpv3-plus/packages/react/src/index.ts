import {
  toNMPv3PlusElementAttrs,
  type NMPv3PlusElementConfig,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusReactProps extends NMPv3PlusElementConfig {
  className?: string;
  id?: string;
}

export function createNMPv3PlusReactProps(
  props: NMPv3PlusReactProps,
): Record<string, string | boolean | undefined> {
  return {
    ...toNMPv3PlusElementAttrs(props),
    id: props.id,
    className: props.className,
  };
}
