import { describe, expect, it } from "vitest";
import {
  createNMPv3PlusPhpAttributes,
  renderNMPv3PlusPhpPlayer,
  renderNMPv3PlusShortcode,
  serializeNMPv3PlusPhpRuntimeConfig,
} from "./index";

describe("NMPv3+ PHP helper", () => {
  it("maps advanced player config to nmp-player attributes", () => {
    expect(
      createNMPv3PlusPhpAttributes({
        source: "local-json",
        localMusicJson: "/music/playlist.json",
        lyrics: "/lyrics/song.lrc",
        translationLyrics: "/lyrics/song.zh.lrc",
        skin: "glass",
        extensions: ["visualizer", "host-sync"],
        hostSync: true,
        pageLinking: false,
      }),
    ).toEqual({
      "source-type": "local-json",
      source: "/music/playlist.json",
      "lyrics-url": "/lyrics/song.lrc",
      "translation-lyrics-url": "/lyrics/song.zh.lrc",
      skin: "glass",
      "plus-extensions": "visualizer,host-sync",
      "host-sync": "true",
      "page-linking": "false",
    });
  });

  it("renders escaped player HTML for PHP theme helpers", () => {
    expect(
      renderNMPv3PlusPhpPlayer({
        playlist: "14273792576",
        skin: 'glass" onclick="bad',
        apiBaseUrl: "/api/netease?x=1&y=2",
      }),
    ).toBe(
      '<nmp-player playlist-id="14273792576" skin="glass&quot; onclick=&quot;bad" api-base-url="/api/netease?x=1&amp;y=2"></nmp-player>',
    );
  });

  it("renders shortcode syntax for NMPv3+ advanced WordPress usage", () => {
    expect(
      renderNMPv3PlusShortcode({
        source: "local-json",
        localMusicJson: "/music/playlist.json",
        skin: "vinyl",
      }),
    ).toBe(
      '[nmpv3plus source_type="local-json" source="/music/playlist.json" skin="vinyl"]',
    );
  });

  it("serializes runtime config for wp_add_inline_script or PHP templates", () => {
    expect(
      JSON.parse(
        serializeNMPv3PlusPhpRuntimeConfig({
          apiBaseUrl: "/api/netease",
          enabledExtensions: ["visualizer"],
          enabledSkins: ["glass"],
          defaultSkin: "glass",
          localMusicJsonUrl: "/music/playlist.json",
          customLyricsUrl: "/lyrics/song.lrc",
          customTranslationLyricsUrl: "/lyrics/song.zh.lrc",
          hostSyncEnabled: true,
        }),
      ),
    ).toEqual({
      apiBaseUrl: "/api/netease",
      enabledExtensions: ["visualizer"],
      enabledSkins: ["glass"],
      defaultSkin: "glass",
      localMusicJsonUrl: "/music/playlist.json",
      customLyricsUrl: "/lyrics/song.lrc",
      customTranslationLyricsUrl: "/lyrics/song.zh.lrc",
      hostSyncEnabled: true,
      pageLinkingEnabled: false,
    });
  });
});
