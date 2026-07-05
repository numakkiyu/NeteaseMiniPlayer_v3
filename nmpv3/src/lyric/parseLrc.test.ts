import { describe, expect, it } from "vitest";
import { mergeLyrics, parseLrc } from "./parseLrc";

describe("parseLrc", () => {
  it("parses timestamps with centiseconds and milliseconds", () => {
    expect(parseLrc("[00:01.20]First\n[00:02.345]Second")).toEqual([
      { time: 1.2, text: "First" },
      { time: 2.345, text: "Second" },
    ]);
  });
});

describe("mergeLyrics", () => {
  it("merges translated lines by timestamp", () => {
    expect(mergeLyrics("[00:01.00]Original", "[00:01.00]Translation")).toEqual([
      { time: 1, text: "Original", translation: "Translation" },
    ]);
  });
});
