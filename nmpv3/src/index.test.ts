import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_API_BASE_URL } from "./config/constants";
import type { NMPv3Config, NMPv3Global, NMPv3Player } from "./types";

describe("NMPv3 browser API configuration contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("hardcodes the v2.5-compatible API proxy as the compiled default", async () => {
    const browserWindow = stubWindow({});
    const { NMPv3 } = await import("./index");

    expect(NMPv3.defaultApiBaseUrl).toBe(DEFAULT_API_BASE_URL);
    expect(NMPv3.getGlobalConfig().apiBaseUrl).toBe(DEFAULT_API_BASE_URL);
    expect(browserWindow.NMPv3?.defaultApiBaseUrl).toBe(DEFAULT_API_BASE_URL);
    expect(browserWindow.NeteaseMiniPlayer?.defaultApiBaseUrl).toBe(
      DEFAULT_API_BASE_URL,
    );
  });

  it("accepts frontend or backend-generated JS config before the bundle loads", async () => {
    const apiBaseUrl = "https://example.test/NeteaseMiniPlayer/nmp.php";
    const browserWindow = stubWindow({
      NMPv3Config: { apiBaseUrl },
    });
    const { NMPv3 } = await import("./index");

    expect(NMPv3.getGlobalConfig().apiBaseUrl).toBe(apiBaseUrl);
    expect(browserWindow.NMPv3?.getGlobalConfig().apiBaseUrl).toBe(apiBaseUrl);
  });

  it("accepts a backend-generated scalar API alias before the bundle loads", async () => {
    const apiBaseUrl = "https://server-rendered.example.test/nmp.php";
    const browserWindow = stubWindow({
      NMPv3ApiBaseUrl: apiBaseUrl,
    });
    const { NMPv3 } = await import("./index");

    expect(NMPv3.getGlobalConfig().apiBaseUrl).toBe(apiBaseUrl);
    expect(browserWindow.NMPv3?.getGlobalConfig().apiBaseUrl).toBe(apiBaseUrl);
  });

  it("accepts the legacy backend-generated scalar API alias before the bundle loads", async () => {
    const apiBaseUrl = "https://legacy-server-rendered.example.test/nmp.php";
    const browserWindow = stubWindow({
      NeteaseMiniPlayerApiBaseUrl: apiBaseUrl,
    });
    const { NMPv3 } = await import("./index");

    expect(NMPv3.getGlobalConfig().apiBaseUrl).toBe(apiBaseUrl);
    expect(browserWindow.NeteaseMiniPlayer?.getGlobalConfig().apiBaseUrl).toBe(
      apiBaseUrl,
    );
  });

  it("keeps the compiled browser bundle configurable after it has loaded", async () => {
    const apiBaseUrl = "https://backup.example.test/netease";
    const browserWindow = stubWindow({});
    const { NMPv3 } = await import("./index");

    browserWindow.NMPv3?.setApiBaseUrl(apiBaseUrl);

    expect(NMPv3.getGlobalConfig().apiBaseUrl).toBe(apiBaseUrl);
    expect(browserWindow.NMPv3Config).toMatchObject({ apiBaseUrl });
    expect(browserWindow.NMPv3ApiBaseUrl).toBe(apiBaseUrl);
    expect(browserWindow.NeteaseMiniPlayerApiBaseUrl).toBe(apiBaseUrl);
  });

  it("pushes runtime API updates into existing player instances", async () => {
    const apiBaseUrl = "https://runtime-backup.example.test/netease";
    const player = createPlayerStub();
    stubWindow({});
    const { NMPv3 } = await import("./index");
    const { globalAudioManager } = await import("./core/GlobalAudioManager");

    globalAudioManager.add(player);
    try {
      NMPv3.setApiBaseUrl(apiBaseUrl);

      expect(player.updateConfig).toHaveBeenCalledWith({ apiBaseUrl });
    } finally {
      globalAudioManager.remove(player);
    }
  });
});

function createPlayerStub(): NMPv3Player {
  const state: ReturnType<NMPv3Player["getState"]> = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    theme: "auto",
    layout: "compact",
    embedMode: "page",
    playMode: "list",
    currentIndex: 0,
    status: "idle",
    lyricStatus: "idle",
    isMinimized: false,
  };

  return {
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    toggle: vi.fn(async () => {}),
    next: vi.fn(async () => {}),
    previous: vi.fn(async () => {}),
    loadSong: vi.fn(async () => {}),
    loadPlaylist: vi.fn(async () => {}),
    setVolume: vi.fn(),
    setTheme: vi.fn(),
    setLayout: vi.fn(),
    updateConfig: vi.fn(async () => {}),
    getState: vi.fn(() => state),
    getCurrentSong: vi.fn(() => null),
    destroy: vi.fn(),
  };
}

function stubWindow(config: Partial<Window>): Window & {
  NMPv3?: NMPv3Global;
  NeteaseMiniPlayer?: NMPv3Global;
  NMPv3ApiBaseUrl?: string;
  NeteaseMiniPlayerApiBaseUrl?: string;
  NMPv3Config?: Partial<NMPv3Config>;
} {
  const browserWindow = config as Window & {
    NMPv3?: NMPv3Global;
    NeteaseMiniPlayer?: NMPv3Global;
    NMPv3ApiBaseUrl?: string;
    NeteaseMiniPlayerApiBaseUrl?: string;
    NMPv3Config?: Partial<NMPv3Config>;
  };

  vi.stubGlobal("HTMLElement", class MockHTMLElement {});
  vi.stubGlobal("window", browserWindow);

  return browserWindow;
}
