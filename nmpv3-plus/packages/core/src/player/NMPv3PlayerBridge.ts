import type {
  NMPv3PlusLyricLine,
  NMPv3PlusLyricsResult,
  NMPv3PlusPlayerLike,
  NMPv3PlusPlaylist,
  NMPv3PlusSong,
} from "../types";

export interface NMPv3PlusBasePlayerBridgeOptions {
  root?: HTMLElement | null;
  startIndex?: number;
  autoplay?: boolean;
}

interface NMPv3InternalPlayer extends NMPv3PlusPlayerLike {
  target?: HTMLElement;
  config?: {
    autoplay?: boolean;
    showLyrics?: boolean;
  };
  audio?: {
    setSrc?(url: string): void;
  };
  playlist?: NMPv3PlusSong[];
  lyrics?: NMPv3PlusLyricLine[];
  currentSong?: NMPv3PlusSong | null;
  currentIndex?: number;
  currentLyric?: NMPv3PlusLyricLine | null;
  currentTime?: number;
  duration?: number;
  status?: string;
  lyricStatus?: string;
  errorMessage?: string;
  updateView?(): void;
  updateMediaSession?(): void;
}

declare global {
  interface Window {
    NMPv3?: {
      getPlayers?: () => NMPv3PlusPlayerLike[];
      getGlobalConfig?: () => { apiBaseUrl?: string };
      setApiBaseUrl?: (apiBaseUrl: string) => void;
      setGlobalConfig?: (config: { apiBaseUrl?: string }) => void;
    };
  }

  interface HTMLElement {
    player?: NMPv3PlusPlayerLike;
  }
}

export function resolveNMPv3PlayerFromElement(
  root: HTMLElement | null | undefined,
): NMPv3PlusPlayerLike | null {
  if (!root) {
    return null;
  }

  if (root.player) {
    return root.player;
  }

  const players = globalThis.window?.NMPv3?.getPlayers?.() ?? [];

  return (
    players.find((player) => {
      const candidate = player as NMPv3InternalPlayer;
      return candidate.target === root;
    }) ?? null
  );
}

export async function loadNMPv3PlusPlaylistIntoBasePlayer(
  player: NMPv3PlusPlayerLike | null | undefined,
  playlist: NMPv3PlusPlaylist,
  options: NMPv3PlusBasePlayerBridgeOptions = {},
): Promise<NMPv3PlusSong> {
  const targetPlayer = asInternalPlayer(player);

  if (!targetPlayer) {
    throw new Error("NMPv3+ custom source requires a live NMPv3 player");
  }

  if (playlist.songs.length === 0) {
    throw new Error("NMPv3+ custom source playlist is empty");
  }

  targetPlayer.pause?.();

  const normalizedSongs = playlist.songs.map(normalizeSongForBasePlayer);
  const currentIndex = clampIndex(options.startIndex ?? 0, normalizedSongs);
  const currentSong = normalizedSongs[currentIndex];
  const showLyrics = targetPlayer.config?.showLyrics !== false;

  targetPlayer.playlist = normalizedSongs;
  targetPlayer.currentIndex = currentIndex;
  targetPlayer.currentSong = currentSong;
  targetPlayer.currentTime = 0;
  targetPlayer.duration = durationSeconds(currentSong);
  targetPlayer.currentLyric = null;
  targetPlayer.lyrics = [];
  targetPlayer.lyricStatus = showLyrics ? "empty" : "hidden";
  targetPlayer.status = "ready";
  targetPlayer.errorMessage = "";

  if (currentSong.url) {
    targetPlayer.audio?.setSrc?.(currentSong.url);
  }

  targetPlayer.updateView?.();
  targetPlayer.updateMediaSession?.();
  dispatchBasePlayerEvent(targetPlayer, options.root, "nmpv3:playlistchange", {
    player: targetPlayer,
    playlist,
  });
  dispatchBasePlayerEvent(targetPlayer, options.root, "nmpv3:songchange", {
    player: targetPlayer,
    song: currentSong,
  });

  if (options.autoplay ?? targetPlayer.config?.autoplay) {
    await targetPlayer.play?.();
  }

  return currentSong;
}

export function applyNMPv3PlusLyricsToBasePlayer(
  player: NMPv3PlusPlayerLike | null | undefined,
  lyrics: NMPv3PlusLyricsResult,
  root?: HTMLElement | null,
): void {
  const targetPlayer = asInternalPlayer(player);

  if (!targetPlayer) {
    throw new Error("NMPv3+ custom lyrics requires a live NMPv3 player");
  }

  const showLyrics = targetPlayer.config?.showLyrics !== false;
  targetPlayer.lyrics = lyrics.lines.map((line) => ({ ...line }));
  targetPlayer.lyricStatus = showLyrics
    ? targetPlayer.lyrics.length > 0
      ? "ready"
      : "empty"
    : "hidden";
  targetPlayer.currentLyric = activeLyric(
    targetPlayer.lyrics,
    targetPlayer.currentTime ?? 0,
  );
  targetPlayer.updateView?.();
  dispatchBasePlayerEvent(targetPlayer, root, "nmpv3plus:lyricschange", {
    player: targetPlayer,
    lyrics,
  });
}

function asInternalPlayer(
  player: NMPv3PlusPlayerLike | null | undefined,
): NMPv3InternalPlayer | null {
  return player ? (player as NMPv3InternalPlayer) : null;
}

function normalizeSongForBasePlayer(song: NMPv3PlusSong): NMPv3PlusSong {
  return {
    ...song,
    id: String(song.id),
    name: song.name || "Untitled song",
  };
}

function clampIndex(index: number, songs: NMPv3PlusSong[]): number {
  if (!Number.isFinite(index)) {
    return 0;
  }

  return Math.max(0, Math.min(songs.length - 1, Math.trunc(index)));
}

function durationSeconds(song: NMPv3PlusSong): number {
  if (!song.duration || !Number.isFinite(song.duration)) {
    return 0;
  }

  // > 600 视为毫秒（超过 10 分钟），否则视为秒
  return song.duration > 600 ? song.duration / 1000 : song.duration;
}

function activeLyric(
  lyrics: NMPv3PlusLyricLine[],
  currentTime: number,
): NMPv3PlusLyricLine | null {
  let active: NMPv3PlusLyricLine | null = null;

  for (const line of lyrics) {
    if (currentTime >= line.time) {
      active = line;
    } else {
      break;
    }
  }

  return active;
}

function dispatchBasePlayerEvent(
  player: NMPv3InternalPlayer,
  root: HTMLElement | null | undefined,
  type: string,
  detail: unknown,
): void {
  const target = root ?? player.target;

  if (!target || typeof target.dispatchEvent !== "function") {
    return;
  }

  target.dispatchEvent(createBridgeEvent(type, detail));
}

function createBridgeEvent(type: string, detail: unknown): Event {
  if (typeof CustomEvent === "function") {
    return new CustomEvent(type, {
      bubbles: true,
      detail,
    });
  }

  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "detail", {
    configurable: true,
    value: detail,
  });
  return event;
}
