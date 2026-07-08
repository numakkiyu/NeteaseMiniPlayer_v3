import { describe, expect, it } from "vitest";
import { normalizeLyrics } from "./normalizeLyrics";

describe("normalizeLyrics", () => {
  it("treats explicit pure music responses as instrumental", () => {
    expect(normalizeLyrics({ pureMusic: true })).toEqual({
      lyrics: [],
      status: "instrumental",
    });
  });

  it("treats empty timed lyric rows as instrumental instead of ready", () => {
    expect(
      normalizeLyrics({
        lrc: {
          lyric: "[00:00.00]\n[00:12.34]   ",
        },
      }),
    ).toEqual({
      lyrics: [],
      status: "instrumental",
    });
  });

  it("keeps displayable lyric rows and removes blank rows", () => {
    expect(
      normalizeLyrics({
        lrc: {
          lyric: "[00:00.00]\n[00:10.00]First line",
        },
      }),
    ).toEqual({
      lyrics: [
        {
          time: 10,
          text: "First line",
          translation: undefined,
        },
      ],
      status: "ready",
    });
  });
});
