import { describe, expect, it } from "vitest";
import { formatTime, shouldSyncPlaylistScroll } from "./render";

describe("formatTime", () => {
  it("formats sub-hour durations as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3599)).toBe("59:59");
  });

  it("formats durations over an hour as h:mm:ss", () => {
    // 长音频/播客场景，避免出现 61:30 这类错误显示
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3690)).toBe("1:01:30");
    expect(formatTime(7325)).toBe("2:02:05");
  });

  it("handles invalid input", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});

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
