export type NMPv3Theme = "auto" | "light" | "dark";
export type NMPv3Layout = "mini" | "compact" | "dock";
export type NMPv3EmbedMode = "page" | "article";
export type NMPv3Position =
  "static" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type NMPv3PlayMode = "list" | "single" | "shuffle";
export type NMPv3LoadStatus = "idle" | "loading" | "ready" | "error";
export type NMPv3LyricStatus =
  "idle" | "loading" | "ready" | "empty" | "instrumental" | "error" | "hidden";

export interface NMPv3Config {
  songId?: string;
  playlistId?: string;
  theme: NMPv3Theme;
  layout: NMPv3Layout;
  embed: boolean;
  embedMode: NMPv3EmbedMode;
  position: NMPv3Position;
  volume: number;
  autoplay: boolean;
  showLyrics: boolean;
  showPlaylist: boolean;
  defaultMinimized: boolean;
  autoPauseOnHidden: boolean;
  remember: boolean;
  storageKey?: string;
  draggable: boolean;
  hotkeys: boolean;
  idleOpacity: number;
  apiBaseUrl?: string;
}

export interface NMPv3Song {
  id: string;
  name: string;
  artists?: string;
  album?: string;
  picUrl?: string;
  url?: string;
  duration?: number;
}

export interface NMPv3Playlist {
  id?: string;
  name?: string;
  songs: NMPv3Song[];
}

export interface NMPv3PlaylistLoadOptions {
  startIndex?: number;
  autoplay?: boolean;
}

export interface NMPv3LyricLine {
  time: number;
  text: string;
  translation?: string;
}

export interface NMPv3State {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  theme: NMPv3Theme;
  layout: NMPv3Layout;
  embedMode: NMPv3EmbedMode;
  playMode: NMPv3PlayMode;
  currentIndex: number;
  status: NMPv3LoadStatus;
  lyricStatus: NMPv3LyricStatus;
  isMinimized: boolean;
}

export interface NMPv3Player {
  play(): Promise<void>;
  pause(): void;
  toggle(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  loadSong(songId: string): Promise<void>;
  loadPlaylist(playlistId: string): Promise<void>;
  loadPlaylistData(
    playlist: NMPv3Playlist,
    options?: NMPv3PlaylistLoadOptions,
  ): Promise<NMPv3Song | null>;
  setLyrics(lyrics: readonly NMPv3LyricLine[]): void;
  seekTo(time: number): void;
  setVolume(volume: number): void;
  setTheme(theme: NMPv3Theme): void;
  setLayout(layout: NMPv3Layout): void;
  updateConfig(config: Partial<NMPv3Config>): Promise<void>;
  getState(): NMPv3State;
  getCurrentSong(): NMPv3Song | null;
  destroy(): void;
}

export interface NMPv3PlayerElement extends HTMLElement {
  getPlayer(): NMPv3Player | null;
  play(): Promise<void>;
  pause(): void;
  toggle(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  loadSong(songId: string): Promise<void>;
  loadPlaylist(playlistId: string): Promise<void>;
  seekTo(time: number): void;
  updateConfig(config: Partial<NMPv3Config>): Promise<void>;
  getState(): NMPv3State | null;
  getCurrentSong(): NMPv3Song | null;
}

export interface NMPv3Global {
  version: string;
  defaultApiBaseUrl: string;
  init(root?: ParentNode): NMPv3Player[];
  create(
    target: string | HTMLElement,
    config: Partial<NMPv3Config>,
  ): NMPv3Player;
  upgradeLegacy(root?: ParentNode): void;
  processShortcodes(root?: ParentNode): void;
  getPlayers(): NMPv3Player[];
  pauseAll(except?: NMPv3Player): void;
  setGlobalConfig(config: Partial<NMPv3Config>): void;
  setApiBaseUrl(apiBaseUrl: string): void;
  getGlobalConfig(): NMPv3Config;
}

declare global {
  interface Window {
    NMPv3?: NMPv3Global;
    NeteaseMiniPlayer?: NMPv3Global;
    NMPv3ApiBaseUrl?: string;
    NeteaseMiniPlayerApiBaseUrl?: string;
    NMPv3Config?: Partial<NMPv3Config>;
    NeteaseMiniPlayerConfig?: Partial<NMPv3Config>;
  }
}
