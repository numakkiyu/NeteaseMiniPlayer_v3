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

/**
 * 播放器可配置项快照
 *
 * 只列出 Plus 插件最常读写的字段，其余字段按索引签名透传，
 * 这样 NMPv3 增加新选项时 Plus 不必同步发版。
 */
/** 插槽渲染上下文 */
export interface NMPv3PlusSlotContext {
  /** 插槽容器，插件往里追加 DOM */
  container: HTMLElement;
  /** 注册清理回调，插件卸载时执行 */
  onCleanup(cleanup: () => void): void;
}

/** 插槽渲染器，可返回清理函数 */
export type NMPv3PlusSlotRenderer = (
  context: NMPv3PlusSlotContext,
) => void | (() => void);

/** 插件可用的插槽通道 */
export interface NMPv3PlusSlotChannel {
  /**
   * 注册插槽渲染器
   *
   * 内置 toolbar / overlay / panel 三个位置，传其它名字会挂到播放器根节点末尾。
   * order 越小越靠前。
   */
  register(
    name: string,
    renderer: NMPv3PlusSlotRenderer,
    options?: { order?: number },
  ): () => void;
  /** 取插槽容器，未挂载时返回 null */
  getContainer(name: string): HTMLElement | null;
  /** 已注册的插槽名 */
  list(): string[];
}

/** 插件可用的命令通道 */
export interface NMPv3PlusCommandChannel {
  register(command: {
    id: string;
    title?: string;
    handler: (arg?: unknown) => unknown | Promise<unknown>;
  }): () => void;
  execute(id: string, arg?: unknown): Promise<unknown>;
  list(): Array<{ id: string; title?: string }>;
}

/** 插件可用的快捷键通道 */
export interface NMPv3PlusShortcutChannel {
  register(binding: {
    keys: string;
    handler: (event: KeyboardEvent) => void;
    allowInEditable?: boolean;
    preventDefault?: boolean;
  }): () => void;
  list(): string[];
}

export interface NMPv3PlusPlayerConfig {
  theme?: string;
  layout?: string;
  scale?: number | "auto";
  palette?: string;
  paletteFollowHost?: boolean;
  volume?: number;
  showLyrics?: boolean;
  showPlaylist?: boolean;
  idleOpacity?: number;
  [key: string]: unknown;
}

/**
 * 插件可用的配置通道
 *
 * 读：拿到当前快照；写：交给底层播放器；订阅：配置变化时收到通知。
 */
export interface NMPv3PlusConfigChannel {
  /** 当前配置快照（引用不可变，每次写入后替换） */
  get(): NMPv3PlusPlayerConfig;
  /** 写入配置，返回底层播放器的 Promise */
  patch(patch: Partial<NMPv3PlusPlayerConfig>): Promise<void>;
  /** 订阅配置变化，返回取消订阅函数 */
  subscribe(
    handler: (
      next: NMPv3PlusPlayerConfig,
      previous: NMPv3PlusPlayerConfig,
    ) => void,
  ): () => void;
}

export interface NMPv3PlusPlayerLike {
  play?(): Promise<void>;
  pause?(): void;
  next?(): Promise<void>;
  previous?(): Promise<void>;
  seekTo?(time: number): void;
  /** 读取当前生效的配置快照 */
  getConfig?(): Record<string, unknown>;
  /** 读取配色解析结果（色板、色相来源、对比度等） */
  getPaletteInfo?(): unknown;
  /** 读取当前实际生效的缩放因子 */
  getScaleFactor?(): number;
  loadPlaylistData?(
    playlist: NMPv3PlusPlaylist,
    options?: { startIndex?: number; autoplay?: boolean },
  ): Promise<NMPv3PlusSong | null>;
  setLyrics?(lyrics: readonly NMPv3PlusLyricLine[]): void;
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
  /**
   * 播放器配置通道
   *
   * 没有挂载播放器时 get() 返回空对象，patch() 静默失败但不抛错，
   * 插件因此不需要到处判空。
   */
  config: NMPv3PlusConfigChannel;
  /** 往播放器里挂自定义 UI */
  slot: NMPv3PlusSlotChannel;
  /** 注册可被外部调用的命令 */
  command: NMPv3PlusCommandChannel;
  /** 注册快捷键 */
  shortcut: NMPv3PlusShortcutChannel;
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
  /** 插件安装超时（毫秒），默认 5000；传 0 关闭 */
  pluginTimeout?: number;
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
