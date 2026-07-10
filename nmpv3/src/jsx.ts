/* eslint-disable @typescript-eslint/no-namespace */
import type {
  NMPv3EmbedMode,
  NMPv3Layout,
  NMPv3PlayerElement,
  NMPv3Position,
  NMPv3Theme,
} from "./types";

type BooleanAttribute = boolean | "true" | "false";
type NumberAttribute = number | string;

export interface NMPv3ElementAttributes {
  id?: string;
  class?: string;
  className?: string;
  style?:
    string | Partial<CSSStyleDeclaration> | Record<string, string | number>;
  title?: string;
  role?: string;
  "aria-label"?: string;
  "song-id"?: string;
  "playlist-id"?: string;
  theme?: NMPv3Theme;
  layout?: NMPv3Layout;
  embed?: BooleanAttribute;
  "embed-mode"?: NMPv3EmbedMode;
  position?: NMPv3Position;
  volume?: NumberAttribute;
  "api-base-url"?: string;
  autoplay?: BooleanAttribute;
  lyric?: BooleanAttribute;
  playlist?: BooleanAttribute;
  "default-minimized"?: BooleanAttribute;
  "auto-pause-on-hidden"?: BooleanAttribute;
  "auto-pause"?: BooleanAttribute;
  remember?: BooleanAttribute;
  "storage-key"?: string;
  draggable?: BooleanAttribute;
  hotkeys?: BooleanAttribute;
  "idle-opacity"?: NumberAttribute;
  [attribute: `data-${string}`]: string | undefined;
  [attribute: `aria-${string}`]: string | undefined;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "nmp-player": NMPv3ElementAttributes;
    }
  }

  interface HTMLElementTagNameMap {
    "nmp-player": NMPv3PlayerElement;
  }
}
