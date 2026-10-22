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

  // 逐个安装：单个 action 不受支持（如旧 iOS 的 seekto 抛 NotSupportedError）时
  // 不影响其余 action 的安装
  setHandler(mediaSession, "play", () => {
    void activePlayer?.play().catch(() => {
      // 用户手势缺失等拒绝不应产生未处理 Promise
    });
  });
  setHandler(mediaSession, "pause", () => activePlayer?.pause());
  setHandler(mediaSession, "previoustrack", () => {
    void activePlayer?.previous().catch(() => {});
  });
  setHandler(mediaSession, "nexttrack", () => {
    void activePlayer?.next().catch(() => {});
  });
  setHandler(mediaSession, "seekbackward", (details) => {
    seekBy(-(details.seekOffset ?? 5));
  });
  setHandler(mediaSession, "seekforward", (details) => {
    seekBy(details.seekOffset ?? 5);
  });
  setHandler(mediaSession, "seekto", (details) => {
    if (typeof details.seekTime === "number") {
      activePlayer?.seekTo(details.seekTime);
    }
  });

  handlersInstalled = true;
}

/**
 * 安装单个 Media Session action handler
 * 不支持该 action 的浏览器只跳过它本身，不中断后续安装
 */
function setHandler(
  mediaSession: MediaSession,
  action: MediaSessionAction,
  handler: MediaSessionActionHandler,
): void {
  try {
    mediaSession.setActionHandler(action, handler);
  } catch {
    // 该 action 不被支持：忽略并继续安装其它 action
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
