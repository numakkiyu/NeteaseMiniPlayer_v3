import { describe, expect, it, vi } from "vitest";
import {
  applyNMPv3PlusLyricsToBasePlayer,
  loadNMPv3PlusPlaylistIntoBasePlayer,
  resolveNMPv3PlayerFromElement,
} from "./NMPv3PlayerBridge";

describe("NMPv3PlayerBridge", () => {
  it("loads a Plus playlist into the live base player state and emits base events", async () => {
    const root = new EventTarget() as HTMLElement;
    const playlistChange = vi.fn();
    const songChange = vi.fn();
    root.addEventListener("nmpv3:playlistchange", playlistChange);
    root.addEventListener("nmpv3:songchange", songChange);

    const player = {
      target: root,
      config: { showLyrics: true },
      audio: { setSrc: vi.fn() },
      pause: vi.fn(),
      updateView: vi.fn(),
      updateMediaSession: vi.fn(),
    };

    const currentSong = await loadNMPv3PlusPlaylistIntoBasePlayer(
      player,
      {
        id: "local-list",
        name: "Local list",
        source: "local-json",
        songs: [
          {
            id: "local-1",
            name: "Local Song",
            artists: "Local Artist",
            url: "/media/local-song.mp3",
            duration: 185000,
          },
        ],
      },
      { root },
    );

    expect(currentSong).toMatchObject({
      id: "local-1",
      name: "Local Song",
    });
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.audio.setSrc).toHaveBeenCalledWith("/media/local-song.mp3");
    expect(player).toMatchObject({
      currentIndex: 0,
      currentSong: { id: "local-1", name: "Local Song" },
      duration: 185,
      lyricStatus: "empty",
      status: "ready",
    });
    expect(player.updateView).toHaveBeenCalled();
    expect(player.updateMediaSession).toHaveBeenCalled();
    expect(playlistChange).toHaveBeenCalledTimes(1);
    expect(songChange).toHaveBeenCalledTimes(1);
  });

  it("applies Plus lyrics to the base lyric view state", () => {
    const root = new EventTarget() as HTMLElement;
    const lyricsChange = vi.fn();
    root.addEventListener("nmpv3plus:lyricschange", lyricsChange);
    const player = {
      target: root,
      config: { showLyrics: true },
      currentTime: 3,
      getState: vi.fn(),
      updateView: vi.fn(),
    };

    applyNMPv3PlusLyricsToBasePlayer(
      player,
      {
        songId: "local-1",
        source: "static-lyrics",
        lines: [
          { time: 0, text: "Opening" },
          { time: 2, text: "Active", translation: "Translated" },
        ],
      },
      root,
    );

    expect(player).toMatchObject({
      lyricStatus: "ready",
      currentLyric: {
        time: 2,
        text: "Active",
        translation: "Translated",
      },
    });
    expect(player.updateView).toHaveBeenCalledTimes(1);
    expect(lyricsChange).toHaveBeenCalledTimes(1);
  });

  it("resolves the base player attached to an nmp-player element", () => {
    const root = {} as HTMLElement;
    const player = { getState: vi.fn() };
    root.player = player;

    expect(resolveNMPv3PlayerFromElement(root)).toBe(player);
  });
});
