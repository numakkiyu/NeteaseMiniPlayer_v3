import { afterEach, describe, expect, it, vi } from "vitest";

describe("NMPv3+ browser API bridge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("syncs frontend Plus API config into the compiled NMPv3 runtime", async () => {
    const apiBaseUrl = "https://backup.example.test/NeteaseMiniPlayer/nmp.php";
    const setApiBaseUrl = vi.fn();
    const root = stubBrowser({
      NMPv3PlusConfig: { apiBaseUrl },
      NMPv3: { setApiBaseUrl },
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(window.NMPv3Config).toMatchObject({ apiBaseUrl });
    expect(setApiBaseUrl).toHaveBeenCalledWith(apiBaseUrl);
  });

  it("falls back to the hardcoded v2.5-compatible API by default", async () => {
    const setApiBaseUrl = vi.fn();
    const root = stubBrowser({
      NMPv3: { setApiBaseUrl },
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(window.NMPv3Config).toBeUndefined();
    expect(setApiBaseUrl).not.toHaveBeenCalled();
  });

  it("keeps per-player frontend api-base-url from being overwritten by the Plus default", async () => {
    const setApiBaseUrl = vi.fn();
    const player = createBasePlayerStub();
    const playerElement = createElementStub({
      "api-base-url": "https://player-api.example.test/music",
      "source-type": "custom-api",
      "playlist-id": "front-end-list",
    });
    playerElement.getPlayer = () => player;
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;

    stubBrowser({
      NMPv3: { setApiBaseUrl },
    });
    vi.stubGlobal("fetch", async (url: string) => {
      expect(url).toBe(
        "https://player-api.example.test/music/playlist/front-end-list",
      );

      return {
        ok: true,
        json: async () => ({
          id: "front-end-list",
          songs: [
            {
              id: "song-from-front-end-api",
              name: "Frontend API Song",
              url: "/media/frontend-api-song.mp3",
            },
          ],
        }),
      };
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(setApiBaseUrl).not.toHaveBeenCalled();
    expect(player).toMatchObject({
      currentSong: {
        id: "song-from-front-end-api",
        name: "Frontend API Song",
      },
    });
    expect(player.audio.setSrc).toHaveBeenCalledWith(
      "/media/frontend-api-song.mp3",
    );
  });

  it("keeps a backend-injected base API when Plus config omits apiBaseUrl", async () => {
    const apiBaseUrl = "https://server-rendered.example.test/nmp.php";
    const setApiBaseUrl = vi.fn();
    const root = stubBrowser({
      NMPv3ApiBaseUrl: apiBaseUrl,
      NMPv3: { setApiBaseUrl },
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(window.NMPv3Config).toMatchObject({ apiBaseUrl });
    expect(window.NMPv3ApiBaseUrl).toBe(apiBaseUrl);
    expect(setApiBaseUrl).toHaveBeenCalledWith(apiBaseUrl);
  });

  it("keeps a legacy backend-injected base API when Plus config omits apiBaseUrl", async () => {
    const apiBaseUrl = "https://legacy-server-rendered.example.test/nmp.php";
    const setApiBaseUrl = vi.fn();
    const root = stubBrowser({
      NeteaseMiniPlayerApiBaseUrl: apiBaseUrl,
      NMPv3: { setApiBaseUrl },
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(window.NMPv3Config).toMatchObject({ apiBaseUrl });
    expect(window.NMPv3ApiBaseUrl).toBe(apiBaseUrl);
    expect(window.NeteaseMiniPlayerApiBaseUrl).toBe(apiBaseUrl);
    expect(setApiBaseUrl).toHaveBeenCalledWith(apiBaseUrl);
  });

  it("keeps the base player global API when only NMPv3 runtime exposes it", async () => {
    const apiBaseUrl = "https://runtime-global.example.test/nmp.php";
    const setApiBaseUrl = vi.fn();
    const root = stubBrowser({
      NMPv3: {
        getGlobalConfig: () => ({ apiBaseUrl }),
        setApiBaseUrl,
      },
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(window.NMPv3Config).toMatchObject({ apiBaseUrl });
    expect(window.NMPv3ApiBaseUrl).toBe(apiBaseUrl);
    expect(setApiBaseUrl).toHaveBeenCalledWith(apiBaseUrl);
  });

  it("loads declared local-json source and lyrics into the real base player bridge", async () => {
    const player = createBasePlayerStub();
    const playerElement = createElementStub({
      "source-type": "local-json",
      source: "/music/playlist.json",
      "lyrics-url": "/lyrics/local.lrc",
      "plus-extensions": "custom-source,local-lyrics",
    });
    playerElement.getPlayer = () => player;
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;

    stubBrowser({
      NMPv3: { setApiBaseUrl: vi.fn() },
    });
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/music/playlist.json") {
        return {
          ok: true,
          json: async () => ({
            id: "local-list",
            songs: [
              {
                id: "local-song",
                name: "Local JSON Song",
                artists: "Local Artist",
                url: "/media/local-song.mp3",
              },
            ],
          }),
        };
      }

      return {
        ok: true,
        text: async () => "[00:00.00]Local lyric",
      };
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(player).toMatchObject({
      currentSong: {
        id: "local-song",
        name: "Local JSON Song",
      },
      lyricStatus: "ready",
      currentLyric: {
        time: 0,
        text: "Local lyric",
      },
      status: "ready",
    });
    expect(player.audio.setSrc).toHaveBeenCalledWith("/media/local-song.mp3");
    expect(playerElement.nmpv3PlusRuntime).toBeDefined();
  });

  it("loads explicit NetEase sources and lyrics through Plus adapters", async () => {
    const player = createBasePlayerStub();
    const playerElement = createElementStub({
      "source-type": "netease",
      "song-id": "1901371647",
      "api-base-url": "https://api.example.test/NeteaseMiniPlayer/nmp.php",
    });
    playerElement.getPlayer = () => player;
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;

    stubBrowser({
      NMPv3: { setApiBaseUrl: vi.fn() },
    });
    vi.stubGlobal("fetch", async (url: string) => {
      const parsed = new URL(url);

      if (parsed.pathname.endsWith("/song/detail")) {
        expect(parsed.searchParams.get("ids")).toBe("1901371647");
        return {
          ok: true,
          json: async () => ({
            songs: [
              {
                id: 1901371647,
                name: "NetEase Plus Song",
                ar: [{ name: "NetEase Artist" }],
              },
            ],
          }),
        };
      }

      if (parsed.pathname.endsWith("/song/url/v1")) {
        expect(parsed.searchParams.get("id")).toBe("1901371647");
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 1901371647,
                url: "http://music.example.test/1901371647.mp3",
              },
            ],
          }),
        };
      }

      expect(parsed.pathname.endsWith("/lyric")).toBe(true);
      expect(parsed.searchParams.get("id")).toBe("1901371647");
      return {
        ok: true,
        json: async () => ({
          lrc: { lyric: "[00:01.00]Original line" },
          tlyric: { lyric: "[00:01.00]Translated line" },
        }),
      };
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(player).toMatchObject({
      currentSong: {
        id: "1901371647",
        name: "NetEase Plus Song",
        artists: "NetEase Artist",
        source: "netease",
      },
      lyricStatus: "ready",
      lyrics: [
        {
          time: 1,
          text: "Original line",
          translation: "Translated line",
        },
      ],
    });
    expect(player.audio.setSrc).toHaveBeenCalledWith(
      "https://music.example.test/1901371647.mp3",
    );
    expect(playerElement.nmpv3PlusRuntime).toBeDefined();
  });

  it("loads per-song lyric URLs from local-json playlists", async () => {
    const player = createBasePlayerStub();
    const playerElement = createElementStub({
      "source-type": "local-json",
      source: "/music/playlist-with-lyrics.json",
    });
    playerElement.getPlayer = () => player;
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;

    stubBrowser({
      NMPv3: { setApiBaseUrl: vi.fn() },
    });
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/music/playlist-with-lyrics.json") {
        return {
          ok: true,
          json: async () => ({
            id: "local-list",
            songs: [
              {
                id: "local-song",
                name: "Local JSON Song",
                url: "/media/local-song.mp3",
                lyricUrl: "/lyrics/local-song.lrc",
                translationLyricUrl: "/lyrics/local-song.zh.lrc",
              },
            ],
          }),
        };
      }

      if (url === "/lyrics/local-song.lrc") {
        return {
          ok: true,
          text: async () => "[00:01.00]Original line",
        };
      }

      expect(url).toBe("/lyrics/local-song.zh.lrc");
      return {
        ok: true,
        text: async () => "[00:01.00]Translated line",
      };
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(player).toMatchObject({
      lyricStatus: "ready",
      lyrics: [
        {
          time: 1,
          text: "Original line",
          translation: "Translated line",
        },
      ],
      currentLyric: null,
    });
    expect(playerElement.nmpv3PlusRuntime).toBeDefined();
  });

  it("turns page-linking into real host sync without requiring explicit host-sync", async () => {
    const playerElement = createElementStub({
      "page-linking": "true",
    });
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;
    const host = playerElement.ownerDocument.documentElement as HTMLElement & {
      attributes: Record<string, string>;
      historyReplacements: string[];
    };

    stubBrowser({
      NMPv3: { setApiBaseUrl: vi.fn() },
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    playerElement.dispatchEvent(
      new CustomEvent("nmpv3:songchange", {
        detail: {
          song: {
            id: "linked-song",
            name: "Linked Song",
            picUrl: "https://example.test/cover.jpg",
          },
        },
      }),
    );

    expect(host.attributes["data-nmpv3-plus-linked-song"]).toBe("linked-song");
    expect(host.attributes["data-nmpv3-plus-linked-title"]).toBe("Linked Song");
    expect(host.historyReplacements).toContain(
      "/article?existing=1&nmp_song=linked-song#music",
    );
  });

  it("registers and applies a user skin package from skin-url", async () => {
    const playerElement = createElementStub({
      skin: "studio-deep",
      "skin-url": "/skins/user/studio/skin.json",
    });
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;
    const head = playerElement.ownerDocument.head as HTMLElement & {
      appended: Array<{ textContent?: string }>;
    };

    stubBrowser({
      NMPv3: { setApiBaseUrl: vi.fn() },
    });
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/skins/user/studio/skin.json") {
        return {
          ok: true,
          json: async () => ({
            name: "studio-deep",
            displayName: "Studio Deep",
            version: "1.0.0",
            author: "User",
            supports: ["mini", "compact", "dock", "card", "cover"],
            tokens: {
              "--nmpv3-bg": "rgba(16, 20, 28, 0.92)",
              "--nmpv3-radius": "18px",
            },
          }),
        };
      }

      expect(url).toBe("/skins/user/studio/skin.css");
      return {
        ok: true,
        text: async () => ".nmpv3-player{background:var(--nmpv3-bg)}",
      };
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    expect(playerElement.dataset.nmpv3PlusSkin).toBe("studio-deep");
    expect(playerElement.style.getPropertyValue("--nmpv3-bg")).toBe(
      "rgba(16, 20, 28, 0.92)",
    );
    expect(head.appended[0].textContent).toBe(
      ".nmpv3-plus-skin-studio-deep .nmpv3-player{background:var(--nmpv3-bg)}",
    );
  });

  it("loads and installs a user extension package from extension-url", async () => {
    const playerElement = createElementStub({
      "extension-url": "/extensions/user/wave/manifest.json",
    });
    const root = {
      querySelectorAll: vi.fn(() => [playerElement]),
    } as unknown as ParentNode;
    const head = playerElement.ownerDocument.head as HTMLElement & {
      appended: Array<{ textContent?: string }>;
    };
    const importer = vi.fn(async (url: string) => {
      expect(url).toBe("/extensions/user/wave/index.js");
      return {
        default: {
          name: "nmpv3-plus-extension-user-wave",
          setup(ctx: {
            on(event: string, handler: (payload: unknown) => void): () => void;
            setToken(name: string, value: string): void;
          }) {
            return ctx.on("songchange", () => {
              ctx.setToken("--nmpv3-user-wave-active", "1");
            });
          },
        },
      };
    });

    stubBrowser({
      NMPv3: { setApiBaseUrl: vi.fn() },
      NMPv3PlusPluginImporter: importer,
    });
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/extensions/user/wave/manifest.json") {
        return {
          ok: true,
          json: async () => ({
            name: "nmpv3-plus-extension-user-wave",
            displayName: "User Wave",
            version: "1.0.0",
            author: "User",
            entry: "./index.js",
            style: "./style.css",
            type: "visual",
            description: "Adds a user visual extension.",
          }),
        };
      }

      expect(url).toBe("/extensions/user/wave/style.css");
      return {
        ok: true,
        text: async () => ".nmpv3-player{outline:1px solid currentColor}",
      };
    });

    const { bootNMPv3PlusBrowser } = await import("./browser");
    await bootNMPv3PlusBrowser(root);

    playerElement.dispatchEvent(
      new CustomEvent("nmpv3:songchange", {
        detail: { song: { id: "song-a", name: "Song A" } },
      }),
    );

    expect(importer).toHaveBeenCalledTimes(1);
    expect(head.appended[0].textContent).toBe(
      ".nmpv3-plus-extension-nmpv3-plus-extension-user-wave .nmpv3-player{outline:1px solid currentColor}",
    );
    expect(
      playerElement.style.getPropertyValue("--nmpv3-user-wave-active"),
    ).toBe("1");
    expect(playerElement.nmpv3PlusRuntime?.plugins.list()).toHaveLength(1);
  });
});

function stubBrowser(config: Partial<Window>): ParentNode {
  const root = {
    querySelectorAll: vi.fn(() => []),
  } as unknown as ParentNode;

  const browserWindow = {
    dispatchEvent: vi.fn(),
    ...config,
  } as Window;

  const document = {
    readyState: "complete",
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
  };

  vi.stubGlobal("window", browserWindow);
  vi.stubGlobal("document", document);
  vi.stubGlobal("customElements", {
    whenDefined: vi.fn(() => Promise.resolve()),
  });
  vi.stubGlobal(
    "CustomEvent",
    class MockCustomEvent extends Event {
      readonly detail?: unknown;

      constructor(type: string, init?: CustomEventInit) {
        super(type, init);
        this.detail = init?.detail;
      }
    },
  );

  return root;
}

function createElementStub(attrs: Record<string, string> = {}): HTMLElement {
  const target = new EventTarget() as HTMLElement;
  const tokens = new Map<string, string>();
  const classes = new Set<string>();
  const documentElement = createHostElementStub();
  const head = createHeadStub();
  const ownerDocument = {
    documentElement,
    defaultView: {
      history: {
        replaceState(_state: unknown, _title: string, url: string) {
          documentElement.historyReplacements.push(url);
        },
      },
      location: {
        href: "https://example.test/article?existing=1#music",
        pathname: "/article",
        search: "?existing=1",
        hash: "#music",
      },
    },
    head,
    createElement: vi.fn((tagName: string) => {
      if (tagName === "style") {
        return {
          dataset: {},
          textContent: "",
          remove: vi.fn(),
        };
      }

      return {};
    }),
  };
  documentElement.ownerDocument = ownerDocument as unknown as Document;

  Object.assign(target, {
    dataset: {},
    ownerDocument,
    style: {
      getPropertyValue: (name: string) => tokens.get(name) ?? "",
      setProperty: (name: string, value: string) => tokens.set(name, value),
      removeProperty: (name: string) => tokens.delete(name),
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name),
    },
    setAttribute: (name: string, value: string) => {
      attrs[name] = value;
    },
    removeAttribute: (name: string) => {
      delete attrs[name];
    },
    getAttribute: (name: string) => attrs[name] ?? null,
    querySelector: vi.fn(() => null),
  });

  return target;
}

function createBasePlayerStub() {
  const player = {
    audio: { setSrc: vi.fn() },
    currentSong: null as {
      id: string;
      name: string;
      artists?: string;
      url?: string;
      source?: string;
    } | null,
    currentTime: 0,
    currentLyric: null as {
      time: number;
      text: string;
      translation?: string;
    } | null,
    lyrics: [] as Array<{
      time: number;
      text: string;
      translation?: string;
    }>,
    lyricStatus: "empty",
    status: "ready",
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    next: vi.fn(async () => {}),
    previous: vi.fn(async () => {}),
    seekTo: vi.fn(),
    getCurrentSong: vi.fn(() => player.currentSong),
    getState: vi.fn(() => ({ currentTime: player.currentTime })),
    loadPlaylistData: vi.fn(
      async (
        playlist: {
          songs: Array<{
            id: string;
            name: string;
            artists?: string;
            url?: string;
            source?: string;
          }>;
        },
        options?: { startIndex?: number; autoplay?: boolean },
      ) => {
        const index = Math.max(
          0,
          Math.min(playlist.songs.length - 1, options?.startIndex ?? 0),
        );
        player.currentSong = playlist.songs[index] ?? null;
        player.status = "ready";
        player.lyrics = [];
        player.lyricStatus = "empty";
        player.currentLyric = null;

        if (player.currentSong?.url) {
          player.audio.setSrc(player.currentSong.url);
        }

        if (options?.autoplay) {
          await player.play();
        }

        return player.currentSong;
      },
    ),
    setLyrics: vi.fn(
      (
        lyrics: ReadonlyArray<{
          time: number;
          text: string;
          translation?: string;
        }>,
      ) => {
        player.lyrics = lyrics.map((line) => ({ ...line }));
        player.lyricStatus = player.lyrics.length > 0 ? "ready" : "empty";
        player.currentLyric =
          [...player.lyrics]
            .reverse()
            .find((line) => line.time <= player.currentTime) ?? null;
      },
    ),
  };

  return player;
}

function createHeadStub(): HTMLElement & {
  appended: Array<{ textContent?: string }>;
} {
  const appended: Array<{ textContent?: string }> = [];

  return {
    appended,
    append(element: { textContent?: string }) {
      appended.push(element);
    },
  } as unknown as HTMLElement & {
    appended: Array<{ textContent?: string }>;
  };
}

function createHostElementStub(): HTMLElement & {
  attributes: Record<string, string>;
  historyReplacements: string[];
  ownerDocument?: Document;
} {
  const attributes: Record<string, string> = {};
  const tokens = new Map<string, string>();
  const classes = new Set<string>();

  return {
    attributes,
    historyReplacements: [],
    style: {
      getPropertyValue: (name: string) => tokens.get(name) ?? "",
      setProperty: (name: string, value: string) => tokens.set(name, value),
      removeProperty: (name: string) => tokens.delete(name),
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name),
      toggle: (name: string, force?: boolean) => {
        const enabled = force ?? !classes.has(name);
        if (enabled) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
        return enabled;
      },
    },
    setAttribute(name: string, value: string) {
      attributes[name] = value;
    },
    removeAttribute(name: string) {
      delete attributes[name];
    },
  } as unknown as HTMLElement & {
    attributes: Record<string, string>;
    historyReplacements: string[];
    ownerDocument?: Document;
  };
}
