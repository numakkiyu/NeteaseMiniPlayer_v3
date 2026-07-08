import { describe, expect, it } from "vitest";
import { shouldSyncPlaylistScroll } from "./render";

describe("shouldSyncPlaylistScroll", () => {
  const openPlaylistState = {
    isOpen: true,
    previousPanelState: "open",
    previousPlaylistSignature: "playlist-a",
    previousActiveIndex: "2",
    playlistSignature: "playlist-a",
    currentIndex: 2,
  };

  it("does not force-scroll on repeated playback view updates", () => {
    expect(shouldSyncPlaylistScroll(openPlaylistState)).toBe(false);
  });

  it("syncs when the panel opens", () => {
    expect(
      shouldSyncPlaylistScroll({
        ...openPlaylistState,
        previousPanelState: "closed",
      }),
    ).toBe(true);
  });

  it("syncs when the active playlist item changes", () => {
    expect(
      shouldSyncPlaylistScroll({
        ...openPlaylistState,
        currentIndex: 3,
      }),
    ).toBe(true);
  });

  it("syncs when playlist content changes", () => {
    expect(
      shouldSyncPlaylistScroll({
        ...openPlaylistState,
        playlistSignature: "playlist-b",
      }),
    ).toBe(true);
  });

  it("does not sync when the panel is closed", () => {
    expect(
      shouldSyncPlaylistScroll({
        ...openPlaylistState,
        isOpen: false,
        currentIndex: 3,
      }),
    ).toBe(false);
  });
});
