import { describe, expect, it } from "vitest";
import { syncLyric } from "./syncLyric";

describe("syncLyric", () => {
  const lyrics = [
    { time: 1, text: "First" },
    { time: 3.5, text: "Second" },
    { time: 8, text: "Third" },
  ];

  it("returns null before the first line", () => {
    expect(syncLyric(lyrics, 0.5)).toBeNull();
  });

  it("returns the latest line at or before the current time", () => {
    expect(syncLyric(lyrics, 4)).toEqual({ time: 3.5, text: "Second" });
  });

  it("returns null for empty or invalid inputs", () => {
    expect(syncLyric([], 4)).toBeNull();
    expect(syncLyric(lyrics, Number.NaN)).toBeNull();
  });
});
