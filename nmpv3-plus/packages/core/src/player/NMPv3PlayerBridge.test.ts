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
      loadPlaylistData: vi.fn(async (playlist) => playlist.songs[0] ?? null),
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
    expect(player.loadPlaylistData).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "local-list",
        songs: [expect.objectContaining({ id: "local-1" })],
      }),
      { startIndex: undefined, autoplay: undefined },
    );
    expect(playlistChange).not.toHaveBeenCalled();
    expect(songChange).not.toHaveBeenCalled();
  });

  it("applies Plus lyrics to the base lyric view state", () => {
    const root = new EventTarget() as HTMLElement;
    const lyricsChange = vi.fn();
    root.addEventListener("nmpv3plus:lyricschange", lyricsChange);
    const player = {
      setLyrics: vi.fn(),
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

    expect(player.setLyrics).toHaveBeenCalledWith([
      { time: 0, text: "Opening" },
      { time: 2, text: "Active", translation: "Translated" },
    ]);
    expect(lyricsChange).toHaveBeenCalledTimes(1);
  });

  it("resolves the base player attached to an nmp-player element", () => {
    const root = {} as HTMLElement;
    const player = { getState: vi.fn() };
    root.getPlayer = () => player;

    expect(resolveNMPv3PlayerFromElement(root)).toBe(player);
  });
});
