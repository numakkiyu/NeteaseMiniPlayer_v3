import { describe, expect, it } from "vitest";
import { mergeLyrics, parseLrc } from "./parseLrc";

describe("parseLrc", () => {
  it("parses timestamps with centiseconds and milliseconds", () => {
    expect(parseLrc("[00:01.20]First\n[00:02.345]Second")).toEqual([
      { time: 1.2, text: "First" },
      { time: 2.345, text: "Second" },
    ]);
  });

  it("expands repeated time tags into separate lines", () => {
    // 网易云副歌重复行：一行多个时间标签，第二个标签不能被当成正文
    expect(parseLrc("[00:12.00][00:45.00]Chorus")).toEqual([
      { time: 12, text: "Chorus" },
      { time: 45, text: "Chorus" },
    ]);
  });

  it("keeps the text after the last time tag only", () => {
    expect(parseLrc("[00:01.00][00:02.00][00:03.00]Repeat")).toEqual([
      { time: 1, text: "Repeat" },
      { time: 2, text: "Repeat" },
      { time: 3, text: "Repeat" },
    ]);
  });

  it("ignores lines without time tags", () => {
    expect(parseLrc("[ar:Artist]\n[00:01.00]Lyric")).toEqual([
      { time: 1, text: "Lyric" },
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
