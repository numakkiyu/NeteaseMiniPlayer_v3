import type { NMPv3Player } from "../types";
import { getNavigator } from "../utils/env";

let activePlayer: NMPv3Player | null = null;
let handlersInstalled = false;

export const mediaSessionManager = {
  activate(player: NMPv3Player): void {
    activePlayer = player;
    installHandlers();
    update(player);
  },

  update(player: NMPv3Player): void {
    if (activePlayer !== player) {
      return;
    }

    update(player);
  },

  release(player: NMPv3Player): void {
    if (activePlayer !== player) {
      return;
    }

    activePlayer = null;
    const mediaSession = getNavigator()?.mediaSession;

    if (!mediaSession) {
      return;
    }

    try {
      mediaSession.metadata = null;
      mediaSession.playbackState = "none";
    } catch {
      // Media Session cleanup must not affect player teardown
    }
  },
};

function installHandlers(): void {
  const mediaSession = getNavigator()?.mediaSession;

  if (!mediaSession || handlersInstalled) {
    return;
  }

  try {
    mediaSession.setActionHandler("play", () => void activePlayer?.play());
    mediaSession.setActionHandler("pause", () => activePlayer?.pause());
    mediaSession.setActionHandler(
      "previoustrack",
      () => void activePlayer?.previous(),
    );
    mediaSession.setActionHandler("nexttrack", () => void activePlayer?.next());
    mediaSession.setActionHandler("seekbackward", (details) => {
      seekBy(-(details.seekOffset ?? 5));
    });
    mediaSession.setActionHandler("seekforward", (details) => {
      seekBy(details.seekOffset ?? 5);
    });
    mediaSession.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number") {
        activePlayer?.seekTo(details.seekTime);
      }
    });
    handlersInstalled = true;
  } catch {
    // Browsers may expose Media Session while rejecting individual handlers
  }
}

function seekBy(offset: number): void {
  const player = activePlayer;

  if (!player) {
    return;
  }

  player.seekTo(player.getState().currentTime + offset);
}

function update(player: NMPv3Player): void {
  const mediaSession = getNavigator()?.mediaSession;
  const song = player.getCurrentSong();

  if (!mediaSession || !song) {
    return;
  }

  try {
    if (typeof MediaMetadata !== "undefined") {
      mediaSession.metadata = new MediaMetadata({
        title: song.name || "Unknown song",
        artist: song.artists || "Unknown artist",
        album: song.album || "",
        artwork: song.picUrl
          ? [
              {
                src: song.picUrl,
                sizes: "512x512",
                type: "image/jpeg",
              },
            ]
          : [],
      });
    }

    mediaSession.playbackState = player.getState().isPlaying
      ? "playing"
      : "paused";
  } catch {
    // Metadata updates must not affect playback
  }
}
