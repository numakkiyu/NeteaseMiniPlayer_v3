import { DEFAULT_API_BASE_URL } from "./constants";
import type { NMPv3Config } from "../types";

export const defaultConfig: NMPv3Config = {
  theme: "auto",
  layout: "compact",
  embed: false,
  embedMode: "page",
  position: "static",
  volume: 0.8,
  autoplay: false,
  showLyrics: true,
  showPlaylist: true,
  defaultMinimized: false,
  autoPauseOnHidden: true,
  remember: true,
  draggable: true,
  hotkeys: true,
  idleOpacity: 0.72,
  apiBaseUrl: DEFAULT_API_BASE_URL,
};
