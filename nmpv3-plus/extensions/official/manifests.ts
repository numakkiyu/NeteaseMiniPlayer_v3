import type { NMPv3PlusExtensionManifest } from "../../packages/core/src/index";

export const officialNMPv3PlusExtensionManifests: NMPv3PlusExtensionManifest[] =
  [
    {
      name: "nmpv3-plus-extension-advanced-layouts",
      displayName: "Advanced Layouts",
      version: "1.0.0",
      author: "BHCN STUDIO",
      entry: "./index.ts",
      style: "./style.css",
      type: "layout",
      description:
        "Adds opt-in card and cover layouts for NMPv3+ without changing the default NMPv3 UI.",
      configSchema: {
        layout: {
          type: "string",
          enum: ["card", "cover"],
          default: "card",
        },
      },
    },
    {
      name: "nmpv3-plus-extension-cover-color",
      displayName: "Cover Color",
      version: "1.0.0",
      entry: "./index.ts",
      type: "visual",
      description: "Extracts cover colors and exposes them as runtime tokens.",
    },
    {
      name: "nmpv3-plus-extension-cross-tab-sync",
      displayName: "Cross-tab Sync",
      version: "1.0.0",
      entry: "./index.ts",
      type: "sync",
      description: "Synchronizes selected playback events across tabs.",
    },
    {
      name: "nmpv3-plus-extension-custom-source",
      displayName: "Custom Source",
      version: "1.0.0",
      entry: "./index.ts",
      type: "source",
      description: "Registers a custom NMPv3+ music source adapter.",
    },
    {
      name: "nmpv3-plus-extension-host-sync",
      displayName: "Host Sync",
      version: "1.0.0",
      entry: "./index.ts",
      type: "host",
      description:
        "Mirrors player state into host page attributes, classes, CSS tokens, and optional page links.",
      configSchema: {
        pageLinking: {
          type: "boolean",
          default: false,
          description:
            "Update the host page URL and linked-song attributes when the current song changes.",
        },
      },
    },
    {
      name: "nmpv3-plus-extension-local-lyrics",
      displayName: "Local Lyrics",
      version: "1.0.0",
      entry: "./index.ts",
      type: "lyrics",
      description: "Registers local or static lyrics for NMPv3+.",
    },
    {
      name: "nmpv3-plus-extension-media-session",
      displayName: "Media Session",
      version: "1.0.0",
      entry: "./index.ts",
      type: "media",
      description: "Updates browser Media Session metadata and handlers.",
    },
    {
      name: "nmpv3-plus-extension-pwa-cache",
      displayName: "PWA Cache",
      version: "1.0.0",
      author: "BHCN STUDIO",
      entry: "./index.ts",
      type: "cache",
      description:
        "Optionally cache NMPv3+ runtime assets, cover images, and song URLs through the browser Cache API.",
      configSchema: {
        cacheName: {
          type: "string",
          default: "nmpv3-plus-cache-v1",
        },
      },
    },
    {
      name: "nmpv3-plus-extension-visualizer",
      displayName: "Visualizer",
      version: "1.0.0",
      entry: "./index.ts",
      style: "./style.css",
      type: "visual",
      description:
        "Adds a non-layout-shifting visualizer layer to the NMPv3 player.",
      configSchema: {
        mode: {
          type: "string",
          enum: ["bars", "wave", "ambient"],
          default: "bars",
        },
      },
    },
  ];

export function getOfficialNMPv3PlusExtensionManifest(
  name: string,
): NMPv3PlusExtensionManifest | undefined {
  return officialNMPv3PlusExtensionManifests.find(
    (manifest) => manifest.name === name,
  );
}
