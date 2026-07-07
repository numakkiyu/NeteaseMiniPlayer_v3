import { describe, expect, it, vi } from "vitest";
import { createStaticLyricsAdapter } from "../lyric/LyricsAdapterManager";
import { createStaticPlaylistSourceAdapter } from "../source/MusicSourceManager";
import { createNMPv3PlusApp } from "./NMPv3PlusApp";

describe("NMPv3PlusApp", () => {
  it("mounts a Vue-like composition API into a runtime", async () => {
    const root = createElementStub();
    const installed = vi.fn();
    const cleanup = vi.fn();
    const app = createNMPv3PlusApp()
      .source(
        createStaticPlaylistSourceAdapter({
          id: "app-list",
          songs: [{ id: "song-a", name: "App source song" }],
        }),
      )
      .lyrics(
        createStaticLyricsAdapter({
          "song-a": "[00:03.00]App lyric",
        }),
      )
      .skin({
        name: "studio",
        className: "nmpv3-plus-skin-studio",
        tokens: {
          "--nmpv3-accent": "#ff6b35",
        },
      })
      .skin("studio")
      .use({
        name: "app-plugin",
        setup(ctx) {
          installed(ctx.root);
          ctx.store.set("app-plugin", true);
          return cleanup;
        },
      });

    const runtime = await app.mount({
      root: root as unknown as HTMLElement,
    });

    expect(app.getRuntime()).toBe(runtime);
    expect(installed).toHaveBeenCalledWith(root);
    expect(runtime.plugins.get("app-plugin")).toMatchObject({
      status: "ready",
    });
    expect(runtime.store.get("app-plugin", false)).toBe(true);
    expect(root.classList.add).toHaveBeenCalledWith("nmpv3-plus-skin-studio");
    expect(root.style.values.get("--nmpv3-accent")).toBe("#ff6b35");
    await expect(
      runtime.loadPlaylist({ source: "static-playlist" }),
    ).resolves.toMatchObject({
      id: "app-list",
      songs: [{ id: "song-a", name: "App source song" }],
    });
    await expect(
      runtime.getLyrics({ songId: "song-a", source: "static-lyrics" }),
    ).resolves.toMatchObject({
      lines: [{ time: 3, text: "App lyric" }],
    });

    await app.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(app.getRuntime()).toBeNull();
    expect(root.classList.remove).toHaveBeenCalledWith(
      "nmpv3-plus-skin-studio",
    );
  });

  it("does not allow mounting the same app twice", async () => {
    const root = createElementStub();
    const app = createNMPv3PlusApp();

    await app.mount({
      root: root as unknown as HTMLElement,
      autoStart: false,
    });

    await expect(
      app.mount({ root: root as unknown as HTMLElement }),
    ).rejects.toThrow("NMPv3+ app is already mounted.");

    await app.unmount();
  });
});

interface ElementStub {
  dataset: Record<string, string>;
  ownerDocument: {
    head: {
      append: ReturnType<typeof vi.fn>;
    };
  };
  style: {
    values: Map<string, string>;
    setProperty(name: string, value: string): void;
    getPropertyValue(name: string): string;
    removeProperty(name: string): string;
  };
  classList: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  querySelector: ReturnType<typeof vi.fn>;
}

function createElementStub(): ElementStub {
  const styleValues = new Map<string, string>();

  return {
    dataset: {},
    ownerDocument: {
      head: {
        append: vi.fn(),
      },
    },
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    querySelector: vi.fn(() => null),
    style: {
      values: styleValues,
      setProperty(name, value) {
        styleValues.set(name, value);
      },
      getPropertyValue(name) {
        return styleValues.get(name) ?? "";
      },
      removeProperty(name) {
        styleValues.delete(name);
        return "";
      },
    },
  };
}
