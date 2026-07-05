import "@netease-mini-player/v3/auto";
import { createElement } from "react";

export function NMPv3Player() {
  return createElement("nmp-player", {
    "playlist-id": "14273792576",
    "api-base-url": "/api/netease",
    theme: "auto",
    layout: "compact",
  });
}
