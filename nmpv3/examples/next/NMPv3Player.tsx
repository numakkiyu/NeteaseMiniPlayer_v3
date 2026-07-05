"use client";

import { createElement, useEffect } from "react";

export function NMPv3Player() {
  useEffect(() => {
    void import("@netease-mini-player/v3/auto");
  }, []);

  return createElement("nmp-player", {
    "playlist-id": "14273792576",
    "api-base-url": "/api/netease",
    theme: "auto",
    layout: "compact",
  });
}
