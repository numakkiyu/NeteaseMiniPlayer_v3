import { afterEach, describe, expect, it, vi } from "vitest";
import type { NMPv3Player, NMPv3State } from "../types";

describe("mediaSessionManager", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("routes global media actions to the active player only", async () => {
    const handlers = new Map<string, MediaSessionActionHandler | null>();
    const mediaSession = {
      metadata: null,
      playbackState: "none",
      setActionHandler: vi.fn(
        (action: string, handler: MediaSessionActionHandler | null) => {
          handlers.set(action, handler);
        },
      ),
    };
    vi.stubGlobal("navigator", { mediaSession });
    vi.stubGlobal(
      "MediaMetadata",
      class MockMediaMetadata {
        constructor(readonly init: MediaMetadataInit) {}
      },
    );
    const { mediaSessionManager } = await import("./MediaSessionManager");
    const first = createPlayer("first");
    const second = createPlayer("second");

    mediaSessionManager.activate(first);
    mediaSessionManager.activate(second);
    await handlers.get("play")?.({ action: "play" });

    expect(first.play).not.toHaveBeenCalled();
    expect(second.play).toHaveBeenCalledTimes(1);
    expect(mediaSession.setActionHandler).toHaveBeenCalledTimes(7);

    mediaSessionManager.release(second);
    await handlers.get("play")?.({ action: "play" });
    expect(second.play).toHaveBeenCalledTimes(1);
  });
});

function createPlayer(id: string): NMPv3Player {
  const state: NMPv3State = {
    isPlaying: true,
    currentTime: 0,
    duration: 180,
    volume: 0.8,
    theme: "auto",
    layout: "compact",
    embedMode: "page",
    playMode: "list",
    currentIndex: 0,
    status: "ready",
    lyricStatus: "ready",
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
    loadPlaylistData: vi.fn(async () => null),
    setLyrics: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    setTheme: vi.fn(),
    setLayout: vi.fn(),
    updateConfig: vi.fn(async () => {}),
    getState: vi.fn(() => state),
    getCurrentSong: vi.fn(() => ({ id, name: id, url: `/${id}.mp3` })),
    destroy: vi.fn(),
  };
}
