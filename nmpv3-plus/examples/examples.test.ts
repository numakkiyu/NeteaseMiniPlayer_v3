import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createNMPv3PlusAstroIslandPlan } from "../packages/astro/src/index";
import { createNMPv3PlusNextClientPlan } from "../packages/next/src/index";
import { createNMPv3PlusReactProps } from "../packages/react/src/index";
import { createNMPv3PlusSvelteBinding } from "../packages/svelte/src/index";
import { createNMPv3PlusVueBinding } from "../packages/vue/src/index";

const examplesRoot = dirname(fileURLToPath(import.meta.url));

describe("NMPv3+ framework examples", () => {
  it("keeps React, Vue, Next, Nuxt, Astro, and Svelte examples wired to real adapter entry points", () => {
    expect(example("react/NMPv3PlusPlayer.tsx")).toContain(
      "@netease-mini-player/v3-plus/react",
    );
    expect(example("vue3/NMPv3PlusPlayer.vue")).toContain(
      "@netease-mini-player/v3-plus/vue",
    );
    expect(example("next/NMPv3PlusPlayer.tsx")).toContain(
      "@netease-mini-player/v3-plus/next",
    );
    expect(example("nuxt/NMPv3PlusPlayer.client.vue")).toContain(
      "@netease-mini-player/v3-plus/nuxt",
    );
    expect(example("astro/NMPv3PlusPlayer.astro")).toContain(
      "@netease-mini-player/v3-plus/astro",
    );
    expect(example("svelte/NMPv3PlusPlayer.svelte")).toContain(
      "@netease-mini-player/v3-plus/svelte",
    );
  });

  it("documents Plus-specific attributes in real framework examples", () => {
    for (const path of [
      "react/NMPv3PlusPlayer.tsx",
      "next/NMPv3PlusPlayer.tsx",
      "vue3/NMPv3PlusPlayer.vue",
      "nuxt/NMPv3PlusPlayer.client.vue",
      "astro/NMPv3PlusPlayer.astro",
      "svelte/NMPv3PlusPlayer.svelte",
    ]) {
      const source = example(path);

      expect(source).toMatch(
        /plusExtensions|plusLayout|hostSync|pageLinking|extensionUrl|skinUrl|lyricsUrl/,
      );
    }
  });

  it("adapter outputs used by examples include deployable Plus attributes", () => {
    expect(
      createNMPv3PlusReactProps({
        playlistId: "14273792576",
        plusExtensions: ["advanced-layouts", "visualizer"],
        plusLayout: "cover",
        hostSync: true,
      }),
    ).toMatchObject({
      "playlist-id": "14273792576",
      "plus-extensions": "advanced-layouts,visualizer",
      "plus-layout": "cover",
      "host-sync": true,
    });

    expect(
      createNMPv3PlusVueBinding({
        playlistId: "14273792576",
        pageLinking: true,
      }).attrs,
    ).toMatchObject({
      "playlist-id": "14273792576",
      "page-linking": true,
    });

    expect(
      createNMPv3PlusNextClientPlan({
        sourceType: "local-json",
        source: "/music/playlist.json",
        lyricsUrl: "/lyrics/song.lrc",
        translationLyricsUrl: "/lyrics/song.zh.lrc",
      }).element.attrs,
    ).toMatchObject({
      "source-type": "local-json",
      source: "/music/playlist.json",
      "lyrics-url": "/lyrics/song.lrc",
      "translation-lyrics-url": "/lyrics/song.zh.lrc",
    });

    expect(
      createNMPv3PlusAstroIslandPlan({
        skin: "studio-deep",
        skinUrl: "/skins/user/studio-deep/skin.json",
      }).element.html,
    ).toBe(
      '<nmp-player skin="studio-deep" skin-url="/skins/user/studio-deep/skin.json"></nmp-player>',
    );

    expect(
      createNMPv3PlusSvelteBinding({
        extensionUrl: "/extensions/user/wave/manifest.json",
      }).props,
    ).toMatchObject({
      "extension-url": "/extensions/user/wave/manifest.json",
    });
  });
});

function example(path: string): string {
  return readFileSync(join(examplesRoot, path), "utf8");
}
