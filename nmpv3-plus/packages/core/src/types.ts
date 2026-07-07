export type NMPv3PlusEventHandler<TPayload = unknown> = (
  payload: TPayload,
) => void;

export interface NMPv3PlusLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface NMPv3PlusStore {
  get<TValue>(key: string, fallback: TValue): TValue;
  set<TValue>(key: string, value: TValue): void;
  delete(key: string): void;
  has(key: string): boolean;
  subscribe?<TValue>(
    key: string,
    callback: (value: TValue | undefined, previous: TValue | undefined) => void,
  ): () => void;
  clear(): void;
}

export type NMPv3PlusPluginCleanup = () => void | Promise<void>;

export interface NMPv3PlusPlayerLike {
  play?(): Promise<void>;
  pause?(): void;
  updateConfig?(config: Record<string, unknown>): Promise<void>;
  getState?(): unknown;
  getCurrentSong?(): unknown;
}

export interface NMPv3PlusApiLike {
  getSong?(songId: string): Promise<NMPv3PlusSong>;
  getPlaylist?(playlistId: string): Promise<NMPv3PlusPlaylist>;
  getLyrics?(songId: string): Promise<NMPv3PlusLyricsResult>;
}

export interface NMPv3PlusSong {
  id: string;
  name: string;
  artists?: string;
  album?: string;
  picUrl?: string;
  url?: string;
  lyricUrl?: string;
  translationLyricUrl?: string;
  duration?: number;
  source?: string;
  raw?: unknown;
}

export interface NMPv3PlusPlaylist {
  id?: string;
  name?: string;
  songs: NMPv3PlusSong[];
  source?: string;
  raw?: unknown;
}

export interface NMPv3PlusLyricLine {
  time: number;
  text: string;
  translation?: string;
}

export interface NMPv3PlusLyricsResult {
  songId: string;
  lines: NMPv3PlusLyricLine[];
  source?: string;
  raw?: unknown;
}

export interface NMPv3PlusSourceInput {
  source?: string;
  id?: string;
  url?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface NMPv3PlusSourceAdapter {
  name: string;
  priority?: number;
  canHandle(input: NMPv3PlusSourceInput): boolean;
  getSong?(input: NMPv3PlusSourceInput): Promise<NMPv3PlusSong>;
  getPlaylist?(input: NMPv3PlusSourceInput): Promise<NMPv3PlusPlaylist>;
}

export interface NMPv3PlusLyricsInput {
  songId: string;
  source?: string;
  song?: NMPv3PlusSong;
  data?: unknown;
  [key: string]: unknown;
}

export interface NMPv3PlusLyricsAdapter {
  name: string;
  priority?: number;
  canHandle(input: NMPv3PlusLyricsInput): boolean;
  getLyrics(input: NMPv3PlusLyricsInput): Promise<NMPv3PlusLyricsResult>;
}

export interface NMPv3PlusSkin {
  name: string;
  displayName?: string;
  version?: string;
  author?: string;
  supports?: string[];
  tokens?: Record<string, string>;
  cssText?: string;
  className?: string;
}

export type NMPv3PlusExtensionType =
  | "visual"
  | "layout"
  | "host"
  | "source"
  | "lyrics"
  | "media"
  | "cache"
  | "sync"
  | "utility";

export interface NMPv3PlusManifestFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  enum?: Array<string | number | boolean>;
  default?: unknown;
  description?: string;
}

export interface NMPv3PlusExtensionManifest {
  name: string;
  displayName: string;
  version: string;
  author?: string;
  entry: string;
  style?: string;
  type: NMPv3PlusExtensionType;
  description: string;
  dependencies?: Record<string, string>;
  configSchema?: Record<string, NMPv3PlusManifestFieldSchema>;
}

export interface NMPv3PlusSkinManifest {
  name: string;
  displayName: string;
  version: string;
  author?: string;
  supports: string[];
  tokens: Record<string, string>;
}

export interface NMPv3PlusSkinPackageInput {
  manifest: unknown;
  cssText?: string;
  className?: string;
  scopeCss?: boolean;
}

export interface NMPv3PlusRemoteSkinPackageInput {
  manifestUrl: string;
  cssUrl?: string;
  className?: string;
  scopeCss?: boolean;
  fetcher?: typeof fetch;
}

export interface NMPv3PlusPlugin {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  manifest?: NMPv3PlusExtensionManifest;
  setup(
    ctx: NMPv3PlusPluginContext,
  ): void | NMPv3PlusPluginCleanup | Promise<void | NMPv3PlusPluginCleanup>;
}

export interface NMPv3PlusPluginPackage {
  manifest: NMPv3PlusExtensionManifest;
  plugin: NMPv3PlusPlugin;
}

export interface NMPv3PlusPluginModule {
  default?: NMPv3PlusPlugin | NMPv3PlusPluginFactory;
  plugin?: NMPv3PlusPlugin | NMPv3PlusPluginFactory;
  createPlugin?: NMPv3PlusPluginFactory;
  [key: string]: unknown;
}

export type NMPv3PlusPluginFactory = (
  config?: Record<string, unknown>,
) => NMPv3PlusPlugin;

export interface NMPv3PlusPluginPackageInput {
  manifest: unknown;
  module: unknown;
  cssText?: string;
  className?: string;
  exportName?: string;
  config?: Record<string, unknown>;
  scopeCss?: boolean;
}

export interface NMPv3PlusRemotePluginPackageInput {
  manifestUrl: string;
  entryUrl?: string;
  styleUrl?: string;
  className?: string;
  exportName?: string;
  config?: Record<string, unknown>;
  scopeCss?: boolean;
  fetcher?: typeof fetch;
  importer?: (url: string) => Promise<unknown>;
}

export interface NMPv3PlusPluginContext {
  root: HTMLElement | null;
  player: NMPv3PlusPlayerLike | null;
  audio: HTMLAudioElement | null;
  store: NMPv3PlusStore;
  api: NMPv3PlusApiLike | null;
  source: {
    loadSong(input: NMPv3PlusSourceInput): Promise<NMPv3PlusSong>;
    loadPlaylist(input: NMPv3PlusSourceInput): Promise<NMPv3PlusPlaylist>;
    register(adapter: NMPv3PlusSourceAdapter): () => void;
  };
  lyrics: {
    getLyrics(input: NMPv3PlusLyricsInput): Promise<NMPv3PlusLyricsResult>;
    register(adapter: NMPv3PlusLyricsAdapter): () => void;
  };
  on<TPayload = unknown>(
    event: string,
    handler: NMPv3PlusEventHandler<TPayload>,
  ): () => void;
  emit(event: string, payload?: unknown): void;
  getPart(name: string): HTMLElement | null;
  setToken(name: string, value: string): void;
  logger: NMPv3PlusLogger;
}

export interface NMPv3PlusRuntimeOptions {
  root?: HTMLElement | null;
  eventTarget?: EventTarget | null;
  bridgeNMPv3Events?: boolean;
  debug?: boolean;
  player?: NMPv3PlusPlayerLike | null;
  audio?: HTMLAudioElement | null;
  api?: NMPv3PlusApiLike | null;
  store?: NMPv3PlusStore;
  logger?: NMPv3PlusLogger;
  skins?: NMPv3PlusSkin[];
  sourceAdapters?: NMPv3PlusSourceAdapter[];
  lyricsAdapters?: NMPv3PlusLyricsAdapter[];
  plugins?: NMPv3PlusPlugin[];
}

export type NMPv3PlusHostBridgeMappedValue =
  string | number | boolean | null | undefined;

export type NMPv3PlusHostBridgeValue =
  | NMPv3PlusHostBridgeMappedValue
  | ((payload: unknown) => NMPv3PlusHostBridgeMappedValue);

export interface NMPv3PlusHostBridgeRule {
  event?: string;
  on?: string;
  target?: HTMLElement | string;
  attribute?: string | Record<string, NMPv3PlusHostBridgeValue>;
  className?: string | Record<string, NMPv3PlusHostBridgeValue>;
  token?: string | Record<string, NMPv3PlusHostBridgeValue>;
  style?: Record<string, NMPv3PlusHostBridgeValue>;
  map?(payload: unknown): NMPv3PlusHostBridgeMappedValue;
}

export interface NMPv3PlusHostBridgeOptions {
  target: HTMLElement | string;
  root?: ParentNode;
  rules: NMPv3PlusHostBridgeRule[];
}
