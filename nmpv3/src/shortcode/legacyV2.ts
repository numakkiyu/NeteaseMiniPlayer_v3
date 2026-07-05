import type { NMPv3Config } from "../types";

export function readLegacyV2Config(element: HTMLElement): Partial<NMPv3Config> {
  const legacyEmbed = element.dataset.embed === "true";
  const autoPauseAttr = element.dataset.autoPause;

  return {
    songId: element.dataset.songId,
    playlistId: element.dataset.playlistId,
    theme: element.dataset.theme as Partial<NMPv3Config>["theme"],
    embed: legacyEmbed,
    embedMode: legacyEmbed ? "article" : "page",
    layout: (element.dataset.layout ??
      (legacyEmbed ? "mini" : undefined)) as Partial<NMPv3Config>["layout"],
    position: element.dataset.position as Partial<NMPv3Config>["position"],
    autoplay: element.dataset.autoplay === "true",
    showLyrics: element.dataset.lyric !== "false",
    showPlaylist: element.dataset.playlist !== "false",
    defaultMinimized: element.dataset.defaultMinimized === "true",
    autoPauseOnHidden: autoPauseAttr === "true" ? false : undefined,
    remember: element.dataset.remember !== "false",
    storageKey: element.dataset.storageKey,
    draggable: element.dataset.draggable !== "false",
    hotkeys: element.dataset.hotkeys !== "false",
    apiBaseUrl: element.dataset.apiBaseUrl,
  };
}
