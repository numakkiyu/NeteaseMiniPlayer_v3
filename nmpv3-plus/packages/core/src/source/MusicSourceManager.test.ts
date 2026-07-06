import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCustomApiSourceAdapter,
  createLocalJsonSourceAdapter,
  createManualSourceAdapter,
  createNeteaseSourceAdapter,
  createStaticPlaylistSourceAdapter,
  NMPv3PlusMusicSourceManager,
} from "./MusicSourceManager";

describe("NMPv3PlusMusicSourceManager", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads local JSON playlists and songs through a source adapter", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register(createLocalJsonSourceAdapter());
    const data = {
      id: "playlist-a",
      name: "Local playlist",
      songs: [
        { id: "song-a", name: "Song A", artists: "Artist A" },
        { id: "song-b", name: "Song B", artists: "Artist B" },
      ],
    };

    await expect(
      manager.loadPlaylist({ source: "local-json", data }),
    ).resolves.toMatchObject({
      id: "playlist-a",
      source: "local-json",
      songs: [
        { id: "song-a", name: "Song A", source: "local-json" },
        { id: "song-b", name: "Song B", source: "local-json" },
      ],
    });

    await expect(
      manager.loadSong({ source: "local-json", id: "song-b", data }),
    ).resolves.toMatchObject({
      id: "song-b",
      name: "Song B",
      source: "local-json",
    });
  });

  it("prefers explicitly named source adapters", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register({
      name: "custom-api",
      priority: 1,
      canHandle: (input) => input.source === "custom-api",
      async getSong(input) {
        return {
          id: String(input.id),
          name: "Custom API Song",
          source: "custom-api",
        };
      },
    });

    await expect(
      manager.loadSong({ source: "custom-api", id: "42" }),
    ).resolves.toMatchObject({
      id: "42",
      name: "Custom API Song",
      source: "custom-api",
    });
  });

  it("loads local JSON playlists from a URL when data is not provided", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register(createLocalJsonSourceAdapter());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          id: "remote-playlist",
          songs: [{ id: "remote-song", name: "Remote Song" }],
        }),
      ),
    );

    await expect(
      manager.loadPlaylist({
        source: "local-json",
        url: "https://example.test/playlist.json",
      }),
    ).resolves.toMatchObject({
      id: "remote-playlist",
      songs: [{ id: "remote-song", name: "Remote Song", source: "local-json" }],
    });
    expect(fetch).toHaveBeenCalledWith("https://example.test/playlist.json");
  });

  it("loads static playlists and manual songs without network access", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register(
      createStaticPlaylistSourceAdapter({
        id: "static",
        songs: [{ id: "static-a", name: "Static A" }],
      }),
    );
    manager.register(createManualSourceAdapter());

    await expect(
      manager.loadPlaylist({ source: "static-playlist" }),
    ).resolves.toMatchObject({
      id: "static",
      source: "static-playlist",
      songs: [{ id: "static-a", name: "Static A" }],
    });
    await expect(
      manager.loadSong({
        source: "manual",
        data: { id: "manual-a", name: "Manual A", url: "/a.mp3" },
      }),
    ).resolves.toMatchObject({
      id: "manual-a",
      name: "Manual A",
      source: "manual",
      url: "/a.mp3",
    });
  });

  it("loads custom-api songs and playlists from configured endpoints", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register(
      createCustomApiSourceAdapter({
        baseUrl: "https://api.example.test/music",
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/song/42")) {
          return Response.json({ id: "42", name: "Custom API Song" });
        }

        return Response.json({
          id: "mix",
          songs: [{ id: "43", name: "Custom API Playlist Song" }],
        });
      }),
    );

    await expect(
      manager.loadSong({ source: "custom-api", id: "42" }),
    ).resolves.toMatchObject({
      id: "42",
      name: "Custom API Song",
      source: "custom-api",
    });
    await expect(
      manager.loadPlaylist({ source: "custom-api", id: "mix" }),
    ).resolves.toMatchObject({
      id: "mix",
      source: "custom-api",
      songs: [{ id: "43", source: "custom-api" }],
    });
  });

  it("loads NetEase songs and playlists through the Plus source adapter", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register(
      createNeteaseSourceAdapter({
        baseUrl: "https://api.example.test/NeteaseMiniPlayer/nmp.php",
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));

        if (url.pathname.endsWith("/song/detail")) {
          expect(url.searchParams.get("ids")).toBe("1901371647");
          return Response.json({
            songs: [
              {
                id: 1901371647,
                name: "NetEase Song",
                ar: [{ name: "Artist A" }],
                al: { name: "Album A", picUrl: "https://cover.test/a.jpg" },
                dt: 180000,
              },
            ],
          });
        }

        if (url.pathname.endsWith("/playlist/track/all")) {
          expect(url.searchParams.get("id")).toBe("14273792576");
          return Response.json({
            songs: [
              { id: 1, name: "Playlist Song A" },
              { id: 2, name: "Playlist Song B" },
            ],
          });
        }

        expect(url.pathname.endsWith("/song/url/v1")).toBe(true);
        return Response.json({
          data: url.searchParams
            .get("id")
            ?.split(",")
            .map((id) => ({
              id,
              url: `http://music.test/${id}.mp3`,
            })),
        });
      }),
    );

    await expect(
      manager.loadSong({ source: "netease", id: "1901371647" }),
    ).resolves.toMatchObject({
      id: "1901371647",
      name: "NetEase Song",
      artists: "Artist A",
      album: "Album A",
      duration: 180000,
      source: "netease",
      url: "https://music.test/1901371647.mp3",
    });
    await expect(
      manager.loadPlaylist({ source: "netease", id: "14273792576" }),
    ).resolves.toMatchObject({
      id: "14273792576",
      source: "netease",
      songs: [
        { id: "1", name: "Playlist Song A", url: "https://music.test/1.mp3" },
        { id: "2", name: "Playlist Song B", url: "https://music.test/2.mp3" },
      ],
    });
  });

  it("supports relative NetEase API proxy URLs", async () => {
    const manager = new NMPv3PlusMusicSourceManager();
    manager.register(createNeteaseSourceAdapter({ baseUrl: "/api/netease" }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        expect(url.origin).toBe("http://localhost");

        if (url.pathname.endsWith("/song/detail")) {
          return Response.json({
            songs: [{ id: "relative-song", name: "Relative Song" }],
          });
        }

        return Response.json({
          data: [
            {
              id: "relative-song",
              url: "https://music.test/relative-song.mp3",
            },
          ],
        });
      }),
    );

    await expect(
      manager.loadSong({ source: "netease", id: "relative-song" }),
    ).resolves.toMatchObject({
      id: "relative-song",
      url: "https://music.test/relative-song.mp3",
    });
  });
});
