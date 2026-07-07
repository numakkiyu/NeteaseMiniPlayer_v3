import { describe, expect, it } from "vitest";
import { createNMPv3PlusAstroIslandPlan } from "../../astro/src/index";
import { createNMPv3PlusNextClientPlan } from "../../next/src/index";
import { createNMPv3PlusNuxtClientPlan } from "../../nuxt/src/index";
import { createNMPv3PlusReactProps } from "../../react/src/index";
import { createNMPv3PlusSvelteBinding } from "../../svelte/src/index";
import { createNMPv3PlusVueBinding } from "../../vue/src/index";
import {
  createNMPv3PlusFrameworkAdapter,
  createNMPv3PlusElementPlan,
  renderNMPv3PlusElement,
  toNMPv3PlusElementAttrs,
} from "./elementProps";

describe("NMPv3+ framework adapters", () => {
  it("maps shared camelCase config to custom-element attributes", () => {
    expect(
      toNMPv3PlusElementAttrs({
        playlistId: "14273792576",
        sourceType: "local-json",
        source: "/music/playlist.json",
        apiBaseUrl: "/api/netease",
        skin: "glass",
        skinUrl: "/skins/user/studio/skin.json",
        plusLayout: "cover",
        plusExtensions: ["advanced-layouts", "visualizer", "host-sync"],
        extensionUrl: "/extensions/user/wave/manifest.json",
        lyricsUrl: "/lyrics/song.lrc",
        translationLyricsUrl: "/lyrics/song.zh.lrc",
        hostSync: true,
        pageLinking: true,
        lyric: false,
      }),
    ).toEqual({
      "playlist-id": "14273792576",
      "source-type": "local-json",
      source: "/music/playlist.json",
      "api-base-url": "/api/netease",
      skin: "glass",
      "skin-url": "/skins/user/studio/skin.json",
      "plus-layout": "cover",
      "plus-extensions": "advanced-layouts,visualizer,host-sync",
      "extension-url": "/extensions/user/wave/manifest.json",
      "lyrics-url": "/lyrics/song.lrc",
      "translation-lyrics-url": "/lyrics/song.zh.lrc",
      "host-sync": true,
      "page-linking": true,
      lyric: false,
    });
  });

  it("creates React props without importing React as a runtime dependency", () => {
    expect(
      createNMPv3PlusReactProps({
        id: "music",
        className: "player",
        songId: "1901371647",
        skin: "vinyl",
        plusExtensions: ["visualizer"],
        pageLinking: true,
      }),
    ).toEqual({
      id: "music",
      className: "player",
      "song-id": "1901371647",
      skin: "vinyl",
      "plus-extensions": "visualizer",
      "page-linking": true,
    });
  });

  it("creates framework adapters from a shared element-plan factory", () => {
    const adapter = createNMPv3PlusFrameworkAdapter((plan) => ({
      tagName: plan.tagName,
      attrs: plan.attrs,
      html: plan.html,
    }));

    expect(
      adapter({
        playlistId: "14273792576",
        skin: "default",
      }),
    ).toEqual({
      tagName: "nmp-player",
      attrs: {
        "playlist-id": "14273792576",
        skin: "default",
      },
      html: '<nmp-player playlist-id="14273792576" skin="default"></nmp-player>',
    });
  });

  it("creates Vue attrs and documents native custom-event names", () => {
    expect(
      createNMPv3PlusVueBinding({
        playlistId: "14273792576",
        skin: "cyber",
        lyricsUrl: "/lyrics/song.lrc",
      }),
    ).toEqual({
      attrs: {
        "playlist-id": "14273792576",
        skin: "cyber",
        "lyrics-url": "/lyrics/song.lrc",
      },
      events: {
        ready: "nmpv3:ready",
        play: "nmpv3:play",
        pause: "nmpv3:pause",
        songchange: "nmpv3:songchange",
        playlistchange: "nmpv3:playlistchange",
        error: "nmpv3:error",
      },
    });
  });

  it("creates a client-only element plan with escaped HTML", () => {
    expect(
      renderNMPv3PlusElement({
        "playlist-id": "14273792576",
        source: '/music/playlist "night".json',
        skin: "glass",
      }),
    ).toBe(
      '<nmp-player playlist-id="14273792576" source="/music/playlist &quot;night&quot;.json" skin="glass"></nmp-player>',
    );

    expect(
      createNMPv3PlusElementPlan({
        playlistId: "14273792576",
        skin: "glass",
      }),
    ).toMatchObject({
      tagName: "nmp-player",
      clientOnly: true,
      requiredImports: [
        "@netease-mini-player/v3/auto",
        "@netease-mini-player/v3-plus",
      ],
      events: {
        ready: "nmpv3:ready",
        playlistchange: "nmpv3:playlistchange",
      },
    });
  });

  it("creates Next client-only plans without depending on Next at runtime", () => {
    expect(
      createNMPv3PlusNextClientPlan({
        songId: "1901371647",
        skin: "minimal",
        plusLayout: "card",
        hostSync: true,
      }),
    ).toMatchObject({
      componentName: "NMPv3PlusPlayer",
      dynamicOptions: {
        ssr: false,
      },
      element: {
        attrs: {
          "song-id": "1901371647",
          skin: "minimal",
          "plus-layout": "card",
          "host-sync": true,
        },
      },
    });
  });

  it("creates Nuxt client plugin plans without importing Nuxt", () => {
    expect(
      createNMPv3PlusNuxtClientPlan({
        playlistId: "14273792576",
        sourceType: "local-json",
        plusExtensions: "custom-source,local-lyrics",
      }),
    ).toMatchObject({
      pluginFilename: "nmpv3-plus.client.ts",
      componentName: "NMPv3PlusPlayer",
      mode: "client",
      element: {
        attrs: {
          "playlist-id": "14273792576",
          "source-type": "local-json",
          "plus-extensions": "custom-source,local-lyrics",
        },
      },
    });
  });

  it("creates Astro island plans with rendered custom-element HTML", () => {
    expect(
      createNMPv3PlusAstroIslandPlan({
        playlistId: "14273792576",
        source: "/music/playlist.json",
        skin: "anime",
        extensionUrl: "/extensions/user/wave/manifest.json",
      }),
    ).toMatchObject({
      clientDirective: "client:only",
      clientOnlyFramework: "none",
      element: {
        html: '<nmp-player playlist-id="14273792576" source="/music/playlist.json" skin="anime" extension-url="/extensions/user/wave/manifest.json"></nmp-player>',
      },
    });
  });

  it("creates Svelte bindings with native props and event names", () => {
    expect(
      createNMPv3PlusSvelteBinding({
        playlistId: "14273792576",
        skin: "cyber",
        pageLinking: true,
      }),
    ).toEqual({
      tagName: "nmp-player",
      props: {
        "playlist-id": "14273792576",
        skin: "cyber",
        "page-linking": true,
      },
      events: {
        ready: "nmpv3:ready",
        play: "nmpv3:play",
        pause: "nmpv3:pause",
        songchange: "nmpv3:songchange",
        playlistchange: "nmpv3:playlistchange",
        error: "nmpv3:error",
      },
      onMountImports: [
        "@netease-mini-player/v3/auto",
        "@netease-mini-player/v3-plus",
      ],
    });
  });
});
