"use client";

import "@netease-mini-player/v3/auto";
import { createNMPv3PlusNextClientPlan } from "@netease-mini-player/v3-plus/next";

const plan = createNMPv3PlusNextClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "glass",
  plusLayout: "cover",
  plusExtensions: ["advanced-layouts", "custom-source", "local-lyrics"],
  lyricsUrl: "/lyrics/song.lrc",
  translationLyricsUrl: "/lyrics/song.zh.lrc",
  lyric: true,
});

export function NMPv3PlusPlayer() {
  return <nmp-player {...plan.element.attrs} />;
}
