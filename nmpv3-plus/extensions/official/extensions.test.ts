/// <reference types="vite/client" />

import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createNMPv3PlusRuntime } from "../../packages/core/src/index";
import {
  createAdvancedLayoutPlugin,
  createCoverColorPlugin,
  createCrossTabSyncPlugin,
  createCustomSourcePlugin,
  createHostSyncPlugin,
  createLocalLyricsPlugin,
  createMediaSessionPlugin,
  createPwaCachePlugin,
  createVisualizerPlugin,
  getOfficialNMPv3PlusExtensionManifest,
  officialNMPv3PlusExtensionManifests,
  dominantHexFromRgba,
} from "./index";
import { defineNMPv3PlusPluginPackage } from "../../packages/core/src/index";
import { nmpv3PlusAdvancedLayoutCssText } from "./advanced-layouts/styleText";
import { nmpv3PlusVisualizerCssText } from "./visualizer/styleText";

const officialExtensionsDir = dirname(fileURLToPath(import.meta.url));
const extensionNamePrefix = "nmpv3-plus-extension-";

describe("official NMPv3+ extensions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("injects a visualizer layer without occupying layout space", async () => {
    const root = createElementStub();
    const runtime = createNMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
    });

    await runtime.installPlugin(createVisualizerPlugin({ bars: 4 }));
    runtime.emit("play");

    const visualizer = root.children.find((child) =>
      child.className.includes("nmpv3-plus-visualizer"),
    );

    expect(root.style.position).toBe("relative");
    expect(visualizer).toBeDefined();
    expect(visualizer?.dataset.state).toBe("playing");
    expect(visualizer?.attributes["aria-hidden"]).toBe("true");
    expect(visualizer?.children).toHaveLength(4);

    await runtime.destroy();

    expect(root.children.some((child) => child === visualizer)).toBe(false);
  });

  it("publishes validated manifests for official plugin factories", () => {
    const pluginPackages = [
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-advanced-layouts",
        ),
        plugin: createAdvancedLayoutPlugin({ layout: "cover" }),
      },
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-cover-color",
        ),
        plugin: createCoverColorPlugin(),
      },
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-cross-tab-sync",
        ),
        plugin: createCrossTabSyncPlugin(),
      },
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-host-sync",
        ),
        plugin: createHostSyncPlugin(),
      },
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-media-session",
        ),
        plugin: createMediaSessionPlugin(),
      },
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-pwa-cache",
        ),
        plugin: createPwaCachePlugin(),
      },
      {
        manifest: getOfficialNMPv3PlusExtensionManifest(
          "nmpv3-plus-extension-visualizer",
        ),
        plugin: createVisualizerPlugin(),
      },
    ];

    expect(officialNMPv3PlusExtensionManifests).toHaveLength(9);

    for (const item of pluginPackages) {
      expect(item.manifest).toBeDefined();
      expect(
        defineNMPv3PlusPluginPackage({
          manifest: item.manifest,
          plugin: item.plugin,
        }).plugin.manifest,
      ).toMatchObject({
        name: item.plugin.name,
        version: "1.0.0",
      });
    }

    expect(
      getOfficialNMPv3PlusExtensionManifest(
        "nmpv3-plus-extension-advanced-layouts",
      ),
    ).toMatchObject({ style: "./style.css" });
    expect(
      getOfficialNMPv3PlusExtensionManifest("nmpv3-plus-extension-visualizer"),
    ).toMatchObject({ style: "./style.css" });
    expect(nmpv3PlusAdvancedLayoutCssText).toContain(
      ".nmpv3-plus-layout-cover",
    );
    expect(nmpv3PlusVisualizerCssText).toContain(".nmpv3-plus-visualizer");
  });

  it("keeps every official extension folder, manifest, entry, and optional style in sync", () => {
    const expectedDirs = officialNMPv3PlusExtensionManifests
      .map((manifest) => manifest.name.replace(extensionNamePrefix, ""))
      .sort();
    const actualDirs = readdirSync(officialExtensionsDir, {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory() && entry.name !== "utils")
      .map((entry) => entry.name)
      .sort();

    expect(actualDirs).toEqual(expectedDirs);

    for (const dirName of actualDirs) {
      const dir = join(officialExtensionsDir, dirName);
      const manifestPath = join(dir, "manifest.json");
      const indexPath = join(dir, "index.ts");
      const stylePath = join(dir, "style.css");
      const manifest = JSON.parse(
        readFileSync(manifestPath, "utf8"),
      ) as (typeof officialNMPv3PlusExtensionManifests)[number];
      const runtimeManifest = getOfficialNMPv3PlusExtensionManifest(
        manifest.name,
      );

      expect(runtimeManifest).toEqual(manifest);
      expect(manifest.entry).toBe("./index.ts");
      expect(existsSync(indexPath)).toBe(true);

      if (manifest.style) {
        expect(manifest.style).toBe("./style.css");
        expect(readFileSync(stylePath, "utf8").trim()).not.toBe("");
      } else {
        expect(existsSync(stylePath)).toBe(false);
      }
    }
  });

  it("syncs player state into the host page", async () => {
    const target = createElementStub();
    const root = createElementStub();
    root.ownerDocument.documentElement = target;
    const replaceState = vi.fn();
    const runtime = createNMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
    });

    await runtime.installPlugin(
      createHostSyncPlugin({
        pageLinking: true,
        history: { replaceState },
        location: {
          href: "https://example.test/article?existing=1#player",
          pathname: "/article",
          search: "?existing=1",
          hash: "#player",
        },
      }),
    );
    runtime.emit("songchange", {
      id: "host-song-1",
      name: "Host Synced Song",
      picUrl: "https://example.test/cover.jpg",
    });
    runtime.emit("play");
    runtime.emit("pause");
    runtime.emit("cover-color", "#336699");

    expect(target.attributes["data-nmpv3-plus-song"]).toBe("Host Synced Song");
    expect(target.attributes["data-nmpv3-plus-linked-song"]).toBe(
      "host-song-1",
    );
    expect(target.attributes["data-nmpv3-plus-linked-title"]).toBe(
      "Host Synced Song",
    );
    expect(target.style.values.get("--nmpv3-plus-linked-cover-url")).toBe(
      "https://example.test/cover.jpg",
    );
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/article?existing=1&nmp_song=host-song-1#player",
    );
    expect(target.classList.toggle).toHaveBeenCalledWith(
      "nmpv3-plus-is-playing",
      true,
    );
    expect(target.classList.toggle).toHaveBeenCalledWith(
      "nmpv3-plus-is-playing",
      false,
    );
    expect(target.style.values.get("--nmpv3-plus-cover-color")).toBe("#336699");
  });

  it("extracts cover colors and exposes them as runtime tokens", async () => {
    expect(dominantHexFromRgba([255, 0, 0, 255, 0, 0, 255, 255])).toBe(
      "#800080",
    );

    const root = createElementStub();
    const runtime = createNMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
    });
    const coverColor = vi.fn();
    runtime.on("cover-color", coverColor);

    await runtime.installPlugin(
      createCoverColorPlugin({
        sampleColor: async () => "#123456",
      }),
    );
    runtime.emit("songchange", { picUrl: "https://example.test/cover.jpg" });
    await Promise.resolve();

    expect(root.style.values.get("--nmpv3-plus-cover-color")).toBe("#123456");
    expect(coverColor).toHaveBeenCalledWith("#123456");
  });

  it("synchronizes selected events through BroadcastChannel", async () => {
    const player = {
      play: vi.fn(async () => undefined),
      pause: vi.fn(),
    };
    const runtime = createNMPv3PlusRuntime({ player });
    const remotePause = vi.fn();
    runtime.on("remote:pause", remotePause);
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

    await runtime.installPlugin(
      createCrossTabSyncPlugin({
        channelName: "nmp-test",
        instanceId: "local",
      }),
    );
    runtime.emit("play", { id: "song-a" });

    expect(FakeBroadcastChannel.instances[0]?.messages[0]).toMatchObject({
      event: "play",
      payload: { id: "song-a" },
      source: "local",
    });

    FakeBroadcastChannel.instances[0]?.onmessage?.({
      data: { event: "pause", source: "remote" },
    } as MessageEvent);

    expect(remotePause).toHaveBeenCalledTimes(1);
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it("updates Media Session metadata and handlers when supported", async () => {
    const player = {
      play: vi.fn(async () => undefined),
      pause: vi.fn(),
    };
    const mediaSession = {
      metadata: null as unknown,
      setActionHandler: vi.fn(),
    };
    class FakeMediaMetadata {
      constructor(readonly init: MediaMetadataInit) {}
    }

    vi.stubGlobal("navigator", { mediaSession });
    vi.stubGlobal("MediaMetadata", FakeMediaMetadata);

    const runtime = createNMPv3PlusRuntime({ player });
    await runtime.installPlugin(createMediaSessionPlugin());
    runtime.emit("songchange", {
      name: "Media Session Song",
      artists: "Artist",
      album: "Album",
      picUrl: "https://example.test/cover.jpg",
    });

    expect(mediaSession.metadata).toMatchObject({
      init: {
        title: "Media Session Song",
        artist: "Artist",
        album: "Album",
      },
    });
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "play",
      expect.any(Function),
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "pause",
      expect.any(Function),
    );
  });

  it("registers custom source and local lyrics extensions", async () => {
    const runtime = createNMPv3PlusRuntime();

    await runtime.installPlugin(
      createCustomSourcePlugin({
        name: "unit-source",
        canHandle: (input) => input.source === "unit-source",
        async getSong(input) {
          return {
            id: String(input.id),
            name: "Unit Source Song",
            source: "unit-source",
          };
        },
      }),
    );
    await runtime.installPlugin(
      createLocalLyricsPlugin({
        "unit-song": "[00:02.00]Unit lyric",
      }),
    );

    await expect(
      runtime.loadSong({ source: "unit-source", id: "unit-song" }),
    ).resolves.toMatchObject({
      id: "unit-song",
      name: "Unit Source Song",
      source: "unit-source",
    });
    await expect(
      runtime.getLyrics({ songId: "unit-song", source: "static-lyrics" }),
    ).resolves.toMatchObject({
      lines: [{ time: 2, text: "Unit lyric" }],
    });
  });
});

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: ((message: MessageEvent) => void) | null = null;
  messages: unknown[] = [];

  constructor(readonly name: string) {
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  close(): void {}
}

interface ElementStub {
  attributes: Record<string, string>;
  children: ElementStub[];
  className: string;
  dataset: Record<string, string>;
  nodeName?: string;
  parentElement: ElementStub | null;
  style: {
    values: Map<string, string>;
    position: string;
    setProperty(name: string, value: string): void;
    getPropertyValue(name: string): string;
    removeProperty(name: string): string;
  };
  classList: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
  };
  ownerDocument: {
    documentElement: ElementStub;
    head: {
      querySelector: ReturnType<typeof vi.fn>;
      append: ReturnType<typeof vi.fn>;
    };
    createElement(tagName: string): ElementStub;
  };
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  append(child: ElementStub): void;
  removeChild(child: ElementStub): void;
}

function createElementStub(): ElementStub {
  const element: ElementStub = {
    attributes: {},
    children: [],
    className: "",
    dataset: {},
    parentElement: null,
    ownerDocument: undefined as unknown as ElementStub["ownerDocument"],
    style: createStyleStub(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
    },
    setAttribute(name: string, value: string) {
      this.attributes[name] = value;
    },
    removeAttribute(name: string) {
      delete this.attributes[name];
    },
    append(child: ElementStub) {
      child.parentElement = this;
      this.children.push(child);
    },
    removeChild(child: ElementStub) {
      this.children = this.children.filter((candidate) => candidate !== child);
      child.parentElement = null;
    },
  };
  element.ownerDocument = createDocumentStub(element);
  return element;
}

function createDocumentStub(root: ElementStub): ElementStub["ownerDocument"] {
  const head = {
    querySelector: vi.fn(() => null),
    append: vi.fn(),
  };

  return {
    documentElement: root,
    head,
    createElement(tagName: string) {
      const element = createElementStub();
      element.nodeName = tagName.toUpperCase();
      element.ownerDocument = this;
      return element;
    },
  };
}

function createStyleStub(): ElementStub["style"] {
  const values = new Map<string, string>();

  return {
    values,
    position: "",
    setProperty(name: string, value: string) {
      values.set(name, value);
    },
    getPropertyValue(name: string) {
      return values.get(name) ?? "";
    },
    removeProperty(name: string) {
      values.delete(name);
      return "";
    },
  };
}
