import type {
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
    getPlayer?(): NMPv3PlusPlayerLike | null;
  }
}

export function resolveNMPv3PlayerFromElement(
  root: HTMLElement | null | undefined,
): NMPv3PlusPlayerLike | null {
  if (!root) {
    return null;
  }

  const attachedPlayer = root.getPlayer?.();
  if (attachedPlayer) {
    return attachedPlayer;
  }

  return null;
}

export async function loadNMPv3PlusPlaylistIntoBasePlayer(
  player: NMPv3PlusPlayerLike | null | undefined,
  playlist: NMPv3PlusPlaylist,
  options: NMPv3PlusBasePlayerBridgeOptions = {},
): Promise<NMPv3PlusSong> {
  if (!player?.loadPlaylistData) {
    throw new Error("NMPv3+ custom source requires a live NMPv3 player");
  }

  if (playlist.songs.length === 0) {
    throw new Error("NMPv3+ custom source playlist is empty");
  }

  const currentSong = await player.loadPlaylistData(
    {
      ...playlist,
      songs: playlist.songs.map(normalizeSongForBasePlayer),
    },
    {
      startIndex: options.startIndex,
      autoplay: options.autoplay,
    },
  );

  if (!currentSong) {
    throw new Error("NMPv3+ custom source playlist could not be loaded");
  }

  return currentSong;
}

export function applyNMPv3PlusLyricsToBasePlayer(
  player: NMPv3PlusPlayerLike | null | undefined,
  lyrics: NMPv3PlusLyricsResult,
  root?: HTMLElement | null,
): void {
  if (!player?.setLyrics) {
    throw new Error("NMPv3+ custom lyrics requires a live NMPv3 player");
  }

  player.setLyrics(lyrics.lines);
  dispatchBasePlayerEvent(player, root, "nmpv3plus:lyricschange", {
    player,
    lyrics,
  });
}

function normalizeSongForBasePlayer(song: NMPv3PlusSong): NMPv3PlusSong {
  return {
    ...song,
    id: String(song.id),
    name: song.name || "Untitled song",
  };
}

function dispatchBasePlayerEvent(
  player: NMPv3PlusPlayerLike,
  root: HTMLElement | null | undefined,
  type: string,
  detail: unknown,
): void {
  const target = root;

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
