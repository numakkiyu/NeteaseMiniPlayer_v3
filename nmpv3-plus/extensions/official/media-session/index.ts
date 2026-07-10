import type {
  NMPv3PlusPlayerLike,
  NMPv3PlusPlugin,
} from "../../../packages/core/src/index";

interface MediaSessionController {
  mediaSession: MediaSession;
  player: NMPv3PlusPlayerLike | null;
  managesHandlers: boolean;
}

const controllers = new Set<MediaSessionController>();
let activeController: MediaSessionController | null = null;
let handlerMediaSession: MediaSession | null = null;

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

      const controller: MediaSessionController = {
        mediaSession,
        player: ctx.player,
        managesHandlers: !isManagedBasePlayer(ctx.player),
      };
      controllers.add(controller);

      if (controller.managesHandlers) {
        installHandlers(mediaSession);
      }

      const stopSong = ctx.on("songchange", (payload) => {
        const song = songFromPayload(payload);

        if (!song) {
          return;
        }

        activeController = controller;
        mediaSession.metadata = new MediaMetadata({
          title: song.name,
          artist: song.artists ?? "",
          album: song.album ?? "",
          artwork: song.picUrl
            ? [{ src: song.picUrl, sizes: "512x512", type: "image/jpeg" }]
            : [],
        });
      });
      const stopPlay = ctx.on("play", () => {
        activeController = controller;
        mediaSession.playbackState = "playing";
      });
      const stopPause = ctx.on("pause", () => {
        if (activeController === controller) {
          mediaSession.playbackState = "paused";
        }
      });

      return () => {
        stopSong();
        stopPlay();
        stopPause();
        controllers.delete(controller);

        if (activeController === controller) {
          const remaining = Array.from(controllers);
          activeController = remaining[remaining.length - 1] ?? null;
        }

        clearHandlersWhenUnused(mediaSession);
      };
    },
  };
}

function installHandlers(mediaSession: MediaSession): void {
  if (handlerMediaSession === mediaSession) {
    return;
  }

  mediaSession.setActionHandler("play", () => {
    void activeController?.player?.play?.();
  });
  mediaSession.setActionHandler("pause", () => {
    activeController?.player?.pause?.();
  });
  mediaSession.setActionHandler("previoustrack", () => {
    void activeController?.player?.previous?.();
  });
  mediaSession.setActionHandler("nexttrack", () => {
    void activeController?.player?.next?.();
  });
  handlerMediaSession = mediaSession;
}

function clearHandlersWhenUnused(mediaSession: MediaSession): void {
  const stillManaged = Array.from(controllers).some(
    (controller) =>
      controller.mediaSession === mediaSession && controller.managesHandlers,
  );

  if (stillManaged || handlerMediaSession !== mediaSession) {
    return;
  }

  mediaSession.setActionHandler("play", null);
  mediaSession.setActionHandler("pause", null);
  mediaSession.setActionHandler("previoustrack", null);
  mediaSession.setActionHandler("nexttrack", null);
  handlerMediaSession = null;
}

function isManagedBasePlayer(player: NMPv3PlusPlayerLike | null): boolean {
  return Boolean(
    player?.next && player.previous && player.seekTo && player.getCurrentSong,
  );
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
