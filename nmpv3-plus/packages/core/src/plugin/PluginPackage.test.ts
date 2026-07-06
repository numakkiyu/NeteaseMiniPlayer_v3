import { describe, expect, it, vi } from "vitest";
import type { NMPv3PlusPluginContext } from "../types";
import {
  createNMPv3PlusPluginPackage,
  loadNMPv3PlusPluginPackage,
} from "./PluginPackage";

describe("NMPv3+ plugin packages", () => {
  it("binds a user extension manifest to a real module export and scoped CSS", async () => {
    const ctx = createPluginContextStub();
    const packageResult = createNMPv3PlusPluginPackage({
      manifest: userExtensionManifest(),
      module: {
        default: (config?: Record<string, unknown>) => ({
          name: "nmpv3-plus-extension-user-wave",
          setup(pluginCtx: NMPv3PlusPluginContext) {
            pluginCtx.setToken("--nmpv3-user-wave", String(config?.level ?? 1));
            return () => pluginCtx.setToken("--nmpv3-user-wave", "0");
          },
        }),
      },
      cssText: ".nmpv3-player{outline:1px solid var(--nmpv3-accent)}",
      config: { level: 3 },
    });

    const cleanup = await packageResult.plugin.setup(ctx);

    expect(packageResult.manifest).toMatchObject({
      name: "nmpv3-plus-extension-user-wave",
      type: "visual",
    });
    expect(ctx.root.classList.add).toHaveBeenCalledWith(
      "nmpv3-plus-extension-nmpv3-plus-extension-user-wave",
    );
    expect(ctx.root.ownerDocument.head.appended[0].textContent).toBe(
      ".nmpv3-plus-extension-nmpv3-plus-extension-user-wave .nmpv3-player{outline:1px solid var(--nmpv3-accent)}",
    );
    expect(ctx.tokens.get("--nmpv3-user-wave")).toBe("3");

    cleanup?.();

    expect(ctx.tokens.get("--nmpv3-user-wave")).toBe("0");
    expect(ctx.root.classList.remove).toHaveBeenCalledWith(
      "nmpv3-plus-extension-nmpv3-plus-extension-user-wave",
    );
    expect(ctx.root.ownerDocument.head.appended[0].remove).toHaveBeenCalled();
  });

  it("loads manifest, module, and style.css from a user extension folder", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url === "/extensions/user/wave/manifest.json") {
        return {
          ok: true,
          json: async () => userExtensionManifest(),
        };
      }

      expect(url).toBe("/extensions/user/wave/style.css");
      return {
        ok: true,
        text: async () => ":host .nmpv3-player{filter:saturate(1.1)}",
      };
    });
    const importer = vi.fn(async (url: string) => {
      expect(url).toBe("/extensions/user/wave/index.js");
      return {
        plugin: {
          name: "nmpv3-plus-extension-user-wave",
          setup(ctx: NMPv3PlusPluginContext) {
            ctx.emit("user-wave:ready", { ok: true });
          },
        },
      };
    });

    const packageResult = await loadNMPv3PlusPluginPackage({
      manifestUrl: "/extensions/user/wave/manifest.json",
      fetcher: fetcher as unknown as typeof fetch,
      importer,
      exportName: "plugin",
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(packageResult.plugin.version).toBe("1.0.0");
    expect(packageResult.plugin.manifest?.style).toBe("./style.css");
  });
});

function userExtensionManifest() {
  return {
    name: "nmpv3-plus-extension-user-wave",
    displayName: "User Wave",
    version: "1.0.0",
    author: "User",
    entry: "./index.js",
    style: "./style.css",
    type: "visual",
    description: "Adds a user-controlled visual layer.",
  };
}

function createPluginContextStub(): NMPv3PlusPluginContext & {
  root: HTMLElement & {
    ownerDocument: Document & {
      head: HTMLElement & {
        appended: Array<{ textContent?: string; remove: () => void }>;
      };
    };
  };
  tokens: Map<string, string>;
} {
  const tokens = new Map<string, string>();
  const appended: Array<{ textContent?: string; remove: () => void }> = [];
  const root = {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    ownerDocument: {
      head: {
        appended,
        append(element: { textContent?: string; remove: () => void }) {
          appended.push(element);
        },
      },
      createElement(tagName: string) {
        expect(tagName).toBe("style");
        return {
          dataset: {},
          textContent: "",
          remove: vi.fn(),
        };
      },
    },
  } as unknown as HTMLElement & {
    ownerDocument: Document & {
      head: HTMLElement & {
        appended: Array<{ textContent?: string; remove: () => void }>;
      };
    };
  };

  return {
    root,
    tokens,
    player: null,
    audio: null,
    store: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
    },
    api: null,
    source: {
      loadSong: vi.fn(),
      loadPlaylist: vi.fn(),
      register: vi.fn(),
    },
    lyrics: {
      getLyrics: vi.fn(),
      register: vi.fn(),
    },
    on: vi.fn(),
    emit: vi.fn(),
    getPart: vi.fn(),
    setToken(name: string, value: string) {
      tokens.set(name, value);
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
}
