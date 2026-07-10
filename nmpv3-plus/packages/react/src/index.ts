import {
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
  ref?: (element: HTMLElement | null) => void;
};

export function createNMPv3PlusReactProps(
  props: NMPv3PlusReactProps,
): NMPv3PlusReactCustomElementProps {
  const ref = createEventRef(props);

  return {
    ...toNMPv3PlusElementAttrs(props),
    ...(props.id ? { id: props.id } : {}),
    ...(props.className ? { className: props.className } : {}),
    ...(props.title ? { title: props.title } : {}),
    ...(props["aria-label"] ? { "aria-label": props["aria-label"] } : {}),
    ...(ref ? { ref } : {}),
  };
}

function createEventRef(
  props: NMPv3PlusReactProps,
): ((element: HTMLElement | null) => void) | undefined {
  const handlers = [
    ["nmpv3:ready", props.onNMPv3Ready],
    ["nmpv3:play", props.onNMPv3Play],
    ["nmpv3:pause", props.onNMPv3Pause],
    ["nmpv3:songchange", props.onNMPv3SongChange],
    ["nmpv3:error", props.onNMPv3Error],
  ] as const;

  if (!handlers.some(([, handler]) => Boolean(handler))) {
    return undefined;
  }

  let cleanup: Array<() => void> = [];

  return (element) => {
    cleanup.forEach((dispose) => dispose());
    cleanup = [];

    if (!element) {
      return;
    }

    for (const [eventName, handler] of handlers) {
      if (!handler) {
        continue;
      }

      element.addEventListener(eventName, handler);
      cleanup.push(() => element.removeEventListener(eventName, handler));
    }
  };
}

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
