import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";

export function createMediaSessionPlugin(): NMPv3PlusPlugin {
  return {
    name: "nmpv3-plus-extension-media-session",
    version: "1.0.0",
    setup(ctx) {
      const mediaSession =
        typeof navigator === "undefined" ? null : navigator.mediaSession;

      if (!mediaSession || typeof MediaMetadata === "undefined") {
        ctx.logger.warn("Media Session extension requires browser support.");
        return undefined;
      }

      const stopSong = ctx.on("songchange", (payload) => {
        const song = songFromPayload(payload);

        if (!song) {
          return;
        }

        mediaSession.metadata = new MediaMetadata({
          title: song.name,
          artist: song.artists ?? "",
          album: song.album ?? "",
          artwork: song.picUrl
            ? [{ src: song.picUrl, sizes: "512x512", type: "image/jpeg" }]
            : [],
        });
      });

      mediaSession.setActionHandler("play", () => {
        void ctx.player?.play?.();
      });
      mediaSession.setActionHandler("pause", () => {
        ctx.player?.pause?.();
      });

      return () => {
        stopSong();
        mediaSession.setActionHandler("play", null);
        mediaSession.setActionHandler("pause", null);
      };
    },
  };
}

function songFromPayload(payload: unknown): {
  name: string;
  artists?: string;
  album?: string;
  picUrl?: string;
} | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("song" in payload && typeof payload.song === "object" && payload.song) {
    return songFromPayload(payload.song);
  }

  return "name" in payload && typeof payload.name === "string"
    ? (payload as {
        name: string;
        artists?: string;
        album?: string;
        picUrl?: string;
      })
    : null;
}
