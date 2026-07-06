import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createNeteaseLyricsAdapter,
  createStaticLyricsAdapter,
  NMPv3PlusLyricsAdapterManager,
  parseStaticLyrics,
} from "./LyricsAdapterManager";

describe("NMPv3PlusLyricsAdapterManager", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and parses custom static LRC lyrics", async () => {
    const manager = new NMPv3PlusLyricsAdapterManager();
    manager.register(
      createStaticLyricsAdapter({
        "song-a": "[00:01.50]First line\n[00:03.00]Second line",
      }),
    );

    await expect(
      manager.getLyrics({ songId: "song-a", source: "static-lyrics" }),
    ).resolves.toMatchObject({
      songId: "song-a",
      source: "static-lyrics",
      lines: [
        { time: 1.5, text: "First line" },
        { time: 3, text: "Second line" },
      ],
    });
  });

  it("auto-detects JSON lyric lines", () => {
    expect(
      parseStaticLyrics([
        { time: 3, text: "Third" },
        { time: 1, text: "First", translation: "第一" },
      ]),
    ).toEqual([
      { time: 1, text: "First", translation: "第一" },
      { time: 3, text: "Third", translation: undefined },
    ]);
  });

  it("auto-detects plain text lyrics", () => {
    expect(parseStaticLyrics("First line\nSecond line")).toEqual([
      { time: 0, text: "First line" },
      { time: 1, text: "Second line" },
    ]);
  });

  it("merges translated LRC or plain text lyrics", () => {
    expect(
      parseStaticLyrics({
        lyric: "[00:01.00]Hello\n[00:02.00]World",
        translation: "[00:01.00]你好\n[00:02.00]世界",
      }),
    ).toEqual([
      { time: 1, text: "Hello", translation: "你好" },
      { time: 2, text: "World", translation: "世界" },
    ]);

    expect(
      parseStaticLyrics({
        lyric: "Hello\nWorld",
        translation: "你好\n世界",
      }),
    ).toEqual([
      { time: 0, text: "Hello", translation: "你好" },
      { time: 1, text: "World", translation: "世界" },
    ]);
  });

  it("accepts Netease-like lrc and tlyric fields for local lyrics", async () => {
    const manager = new NMPv3PlusLyricsAdapterManager();
    manager.register(
      createStaticLyricsAdapter({
        "song-b": {
          lrc: { lyric: "[00:01.00]Original" },
          tlyric: { lyric: "[00:01.00]Translated" },
        },
      }),
    );

    await expect(
      manager.getLyrics({ songId: "song-b" }),
    ).resolves.toMatchObject({
      lines: [{ time: 1, text: "Original", translation: "Translated" }],
    });
  });

  it("loads NetEase LRC and translated lyrics through a Plus lyrics adapter", async () => {
    const manager = new NMPv3PlusLyricsAdapterManager();
    manager.register(
      createNeteaseLyricsAdapter({
        baseUrl: "https://api.example.test/NeteaseMiniPlayer/nmp.php",
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        expect(url.pathname.endsWith("/lyric")).toBe(true);
        expect(url.searchParams.get("id")).toBe("1901371647");

        return Response.json({
          lrc: { lyric: "[00:01.00]Original line" },
          tlyric: { lyric: "[00:01.00]Translated line" },
        });
      }),
    );

    await expect(
      manager.getLyrics({
        source: "netease",
        songId: "1901371647",
      }),
    ).resolves.toMatchObject({
      songId: "1901371647",
      source: "netease",
      lines: [
        {
          time: 1,
          text: "Original line",
          translation: "Translated line",
        },
      ],
    });
  });

  it("supports relative NetEase lyrics API proxy URLs", async () => {
    const manager = new NMPv3PlusLyricsAdapterManager();
    manager.register(createNeteaseLyricsAdapter({ baseUrl: "/api/netease" }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        expect(url.origin).toBe("http://localhost");
        expect(url.pathname).toBe("/api/netease/lyric");

        return Response.json({
          lrc: { lyric: "[00:02.00]Relative API lyric" },
        });
      }),
    );

    await expect(
      manager.getLyrics({ source: "netease", songId: "relative-song" }),
    ).resolves.toMatchObject({
      lines: [{ time: 2, text: "Relative API lyric" }],
    });
  });
});
