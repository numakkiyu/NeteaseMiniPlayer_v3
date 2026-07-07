import {
  createNMPv3PlusFrameworkAdapter,
  toNMPv3PlusElementAttrs,
  type NMPv3PlusElementConfig,
  type NMPv3PlusNativeElementProps,
} from "../../adapters/src/elementProps";

export interface NMPv3PlusReactProps extends NMPv3PlusElementConfig {
  className?: string;
  id?: string;
  title?: string;
  "aria-label"?: string;
  onNMPv3Ready?: (event: Event) => void;
  onNMPv3Play?: (event: Event) => void;
  onNMPv3Pause?: (event: Event) => void;
  onNMPv3SongChange?: (event: Event) => void;
  onNMPv3Error?: (event: Event) => void;
}

export type NMPv3PlusReactCustomElementProps = NMPv3PlusNativeElementProps & {
  className?: string;
  id?: string;
  title?: string;
  "aria-label"?: string;
};

export const createNMPv3PlusReactProps = createNMPv3PlusFrameworkAdapter(
  (_plan, props: NMPv3PlusReactProps) => ({
    ...toNMPv3PlusElementAttrs(props),
    ...(props.id ? { id: props.id } : {}),
    ...(props.className ? { className: props.className } : {}),
    ...(props.title ? { title: props.title } : {}),
    ...(props["aria-label"] ? { "aria-label": props["aria-label"] } : {}),
  }),
);

declare global {
  // JSX intrinsic element augmentation requires the JSX namespace shape.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "nmp-player": NMPv3PlusReactCustomElementProps;
      NMPv3PlusPlayer: NMPv3PlusReactCustomElementProps;
    }
  }
}
