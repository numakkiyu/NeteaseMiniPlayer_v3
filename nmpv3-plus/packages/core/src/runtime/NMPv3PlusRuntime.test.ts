import { describe, expect, it, vi } from "vitest";
import { createStaticLyricsAdapter } from "../lyric/LyricsAdapterManager";
import { createLocalJsonSourceAdapter } from "../source/MusicSourceManager";
import { createNMPv3PlusRuntime } from "./NMPv3PlusRuntime";

describe("NMPv3PlusRuntime", () => {
  it("composes plugins, source adapters, lyrics adapters, and events", async () => {
    const runtime = createNMPv3PlusRuntime({
      sourceAdapters: [createLocalJsonSourceAdapter()],
      lyricsAdapters: [
        createStaticLyricsAdapter({
          "song-a": "[00:00.00]Runtime lyric",
        }),
      ],
    });
    const pluginEvent = vi.fn();

    await runtime.installPlugin({
      name: "runtime-plugin",
      setup(ctx) {
        ctx.on("songchange", pluginEvent);
        ctx.store.set("installed", true);
      },
    });

    const playlist = await runtime.loadPlaylist({
      source: "local-json",
      data: {
        id: "runtime-list",
        songs: [{ id: "song-a", name: "Runtime song" }],
      },
    });
    const lyrics = await runtime.getLyrics({
      songId: "song-a",
      source: "static-lyrics",
    });

    runtime.emit("songchange", playlist.songs[0]);

    expect(playlist.songs[0]).toMatchObject({
      id: "song-a",
      name: "Runtime song",
    });
    expect(lyrics.lines[0]).toMatchObject({
      time: 0,
      text: "Runtime lyric",
    });
    expect(runtime.store.get("installed", false)).toBe(true);
    expect(pluginEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "song-a" }),
    );

    runtime.destroy();
    expect(runtime.plugins.list()).toHaveLength(0);
  });

  it("bridges NMPv3 DOM events into Plus runtime events for real player integration", async () => {
    const eventTarget = new EventTarget();
    const runtime = createNMPv3PlusRuntime({ eventTarget });
    const play = vi.fn();
    const prefixedPlay = vi.fn();
    const songchange = vi.fn();

    await runtime.installPlugin({
      name: "dom-bridge-plugin",
      setup(ctx) {
        ctx.on("play", play);
        ctx.on("nmp:play", prefixedPlay);
        ctx.on("songchange", songchange);
      },
    });

    eventTarget.dispatchEvent(
      createNMPv3DomEvent("nmpv3:play", {
        song: { id: "song-a", name: "DOM song" },
      }),
    );
    eventTarget.dispatchEvent(
      createNMPv3DomEvent("nmpv3:songchange", {
        song: { id: "song-b", name: "Changed song" },
      }),
    );

    expect(play).toHaveBeenCalledWith({
      song: { id: "song-a", name: "DOM song" },
    });
    expect(prefixedPlay).toHaveBeenCalledWith({
      song: { id: "song-a", name: "DOM song" },
    });
    expect(songchange).toHaveBeenCalledWith({
      song: { id: "song-b", name: "Changed song" },
    });

    runtime.destroy();
    eventTarget.dispatchEvent(createNMPv3DomEvent("nmpv3:play", {}));

    expect(play).toHaveBeenCalledTimes(1);
  });
});

function createNMPv3DomEvent(type: string, detail: unknown): Event {
  const event = new Event(type);
  Object.defineProperty(event, "detail", {
    configurable: true,
    value: detail,
  });
  return event;
}
