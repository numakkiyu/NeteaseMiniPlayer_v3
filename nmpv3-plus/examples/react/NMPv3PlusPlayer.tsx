import "netease-mini-player-v3/auto";
import { createNMPv3PlusReactProps } from "netease-mini-player-v3-plus/react";

export function NMPv3PlusPlayer() {
  return (
    <nmp-player
      {...createNMPv3PlusReactProps({
        playlistId: "14273792576",
        skin: "glass",
        layout: "compact",
        plusLayout: "cover",
        plusExtensions: ["advanced-layouts", "visualizer", "host-sync"],
        lyricsUrl: "/lyrics/song.lrc",
        translationLyricsUrl: "/lyrics/song.zh.lrc",
        hostSync: true,
      })}
    />
  );
}
