import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NMPv3RenderedElements } from "../ui/render";
import type { NMPv3Song } from "../types";

const apiMocks = vi.hoisted(() => ({
  getSong: vi.fn(),
  getPlaylist: vi.fn(),
  getSongUrl: vi.fn(),
  getLyrics: vi.fn(),
}));
const audioMocks = vi.hoisted(() => ({
  instances: [] as Array<{
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    emit(event: string): void;
  }>,
}));

vi.mock("../api/NeteaseApiClient", () => ({
  NeteaseApiClient: class MockNeteaseApiClient {
    getSong = apiMocks.getSong;
    getPlaylist = apiMocks.getPlaylist;
    getSongUrl = apiMocks.getSongUrl;
    getLyrics = apiMocks.getLyrics;
  },
}));

vi.mock("./AudioController", () => ({
  AudioController: class MockAudioController {
    private handlers = new Map<string, Array<() => void>>();
    play = vi.fn(async () => {});
    pause = vi.fn();

    constructor() {
      audioMocks.instances.push(this);
    }

    setSrc(): void {}
    setVolume(): void {}
    seek(): void {}
    destroy(): void {}

    on(event: string, handler: () => void): () => void {
      const handlers = this.handlers.get(event) ?? [];
      handlers.push(handler);
      this.handlers.set(event, handlers);
      return () => {
        this.handlers.set(
          event,
          (this.handlers.get(event) ?? []).filter(
            (candidate) => candidate !== handler,
          ),
        );
      };
    }

    emit(event: string): void {
      for (const handler of this.handlers.get(event) ?? []) {
        handler();
      }
    }

    getState(): { currentTime: number; duration: number; volume: number } {
      return { currentTime: 0, duration: 180, volume: 0.8 };
    }
  },
}));

vi.mock("../ui/render", () => ({
  renderPlayerShell: () => createRenderedElements(),
  updatePlayerView: vi.fn(),
}));

import { NMPv3PlayerInstance } from "./NMPv3Player";

describe("NMPv3PlayerInstance async source handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioMocks.instances.length = 0;
    apiMocks.getLyrics.mockResolvedValue({});
  });

  it("keeps the latest song when requests resolve out of order", async () => {
    const songA = deferred<NMPv3Song>();
    const songB = deferred<NMPv3Song>();
    apiMocks.getSong.mockImplementation((songId: string) =>
      songId === "A" ? songA.promise : songB.promise,
    );
    const player = createPlayer();

    const loadA = player.updateConfig({ songId: "A" });
    const loadB = player.updateConfig({ songId: "B" });
    songB.resolve({ id: "B", name: "Song B", url: "/b.mp3" });
    await loadB;
    songA.resolve({ id: "A", name: "Song A", url: "/a.mp3" });
    await loadA;

    expect(player.getCurrentSong()).toMatchObject({ id: "B" });
  });

  it("continues playback on the next track after an audio error", async () => {
    const player = createPlayer();
    await player.loadPlaylistData(
      {
        id: "error-recovery",
        songs: [
          { id: "A", name: "Song A", url: "/a.mp3" },
          { id: "B", name: "Song B", url: "/b.mp3" },
        ],
      },
      { autoplay: true },
    );
    const audio = audioMocks.instances[0];
    vi.stubGlobal("window", {
      setTimeout(callback: () => void) {
        callback();
        return 1;
      },
    });

    audio?.emit("error");

    await vi.waitFor(() => {
      expect(player.getCurrentSong()).toMatchObject({ id: "B" });
      expect(audio?.play).toHaveBeenCalledTimes(2);
    });
    vi.unstubAllGlobals();
  });

  it("preserves configured autoplay for externally supplied playlists", async () => {
    const player = createPlayer({ autoplay: true });

    await player.loadPlaylistData({
      songs: [{ id: "A", name: "Song A", url: "/a.mp3" }],
    });

    expect(audioMocks.instances[0]?.play).toHaveBeenCalledTimes(1);
  });
});

function createPlayer(
  config: ConstructorParameters<typeof NMPv3PlayerInstance>[1] = {},
): NMPv3PlayerInstance {
  const target = Object.assign(new EventTarget(), {
    id: "unit-player",
    innerHTML: "",
  }) as HTMLElement;

  return new NMPv3PlayerInstance(target, {
    remember: false,
    position: "static",
    hotkeys: false,
    ...config,
  });
}

function createRenderedElements(): NMPv3RenderedElements {
  const root = createElementStub();
  const coverParent = createElementStub();
  const cover = createElementStub();
  Object.defineProperty(cover, "parentElement", { value: coverParent });
  const elements = {
    root,
    cover,
    fallbackCover: createElementStub(),
    title: createElementStub(),
    artist: createElementStub(),
    album: createElementStub(),
    order: createElementStub(),
    modeBadge: createElementStub(),
    lyricOriginal: createElementStub(),
    lyricTranslation: createElementStub(),
    playButton: createElementStub(),
    playIcon: createElementStub(),
    previousButton: createElementStub(),
    nextButton: createElementStub(),
    progressTrack: createElementStub(),
    progressBar: createElementStub(),
    currentTime: createElementStub(),
    totalTime: createElementStub(),
    volumeTrack: createElementStub(),
    volumeBar: createElementStub(),
    lyricsButton: createElementStub(),
    modeButton: createElementStub(),
    playlistButton: createElementStub(),
    minimizeButton: createElementStub(),
    playlistPanel: createElementStub(),
    playlistList: createElementStub(),
    status: createElementStub(),
    miniPanel: createElementStub(),
    miniTitle: createElementStub(),
    miniSubtitle: createElementStub(),
    miniMode: createElementStub(),
  };

  return elements as unknown as NMPv3RenderedElements;
}

function createElementStub(): HTMLElement {
  const classes = new Set<string>();
  return Object.assign(new EventTarget(), {
    dataset: {} as DOMStringMap,
    hidden: false,
    innerHTML: "",
    textContent: "",
    parentElement: null as HTMLElement | null,
    offsetWidth: 420,
    offsetHeight: 120,
    style: {
      left: "",
      top: "",
      right: "",
      bottom: "",
      transition: "",
      setProperty: vi.fn(),
    },
    classList: {
      add: (...names: string[]) => names.forEach((name) => classes.add(name)),
      remove: (...names: string[]) =>
        names.forEach((name) => classes.delete(name)),
      contains: (name: string) => classes.has(name),
      toggle: (name: string, force?: boolean) => {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name);
        else classes.delete(name);
        return enabled;
      },
    },
    closest: () => null,
    getBoundingClientRect: () => ({
      left: 20,
      top: 20,
      right: 440,
      bottom: 140,
      width: 420,
      height: 120,
    }),
  }) as unknown as HTMLElement;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve(value: T): void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
