import {
  createNMPv3PlusBlockMetadata,
  createNMPv3PlusWordPressEnqueuePlan,
} from "netease-mini-player-v3-plus/wordpress";

export const nmpv3PlusWordPressSettings = {
  defaultSkin: "glass",
  enabledSkins: ["default", "glass", "vinyl"],
  enabledExtensions: ["visualizer", "host-sync", "media-session"],
  localMusicJsonUrl: "/music/playlist.json",
  customLyricsUrl: "/lyrics/song.lrc",
  hostSyncEnabled: true,
  pageLinkingEnabled: true,
};

export const nmpv3PlusBlockMetadata = createNMPv3PlusBlockMetadata(
  nmpv3PlusWordPressSettings,
);

export const nmpv3PlusEnqueuePlan = createNMPv3PlusWordPressEnqueuePlan(
  nmpv3PlusWordPressSettings,
);
