import {
  createCustomApiSourceAdapter,
  createLocalJsonSourceAdapter,
  createNeteaseLyricsAdapter,
  createNeteaseSourceAdapter,
  createNMPv3PlusRuntime,
  parseStaticLyrics,
  loadNMPv3PlusPluginPackage,
  loadNMPv3PlusSkinPackage,
  applyNMPv3PlusLyricsToBasePlayer,
  loadNMPv3PlusPlaylistIntoBasePlayer,
  resolveNMPv3PlayerFromElement,
  type NMPv3PlusPlugin,
  type NMPv3PlusRuntime,
  type NMPv3PlusSong,
  type NMPv3PlusSourceInput,
} from "./packages/core/src/index";
import { officialNMPv3PlusSkins } from "./skins/official";

type ExtensionName =
  | "advanced-layouts"
  | "visualizer"
  | "host-sync"
  | "cover-color"
  | "cross-tab-sync"
  | "media-session"
  | "custom-source"
  | "local-lyrics"
  | "pwa-cache";

interface BrowserSettings {
  apiBaseUrl: string;
  syncBasePlayerApi: boolean;
  defaultSkin: string;
  enabledExtensions: ExtensionName[];
  extensionPackages: BrowserExtensionPackageSetting[];
  skinPackages: BrowserSkinPackageSetting[];
  localMusicJsonUrl: string;
  customLyricsUrl: string;
  customTranslationLyricsUrl: string;
  hostSyncEnabled: boolean;
  pageLinkingEnabled: boolean;
}

interface BrowserExtensionPackageSetting {
  manifestUrl: string;
  entryUrl?: string;
  styleUrl?: string;
  className?: string;
  exportName?: string;
  config?: Record<string, unknown>;
  scopeCss?: boolean;
}

interface BrowserSkinPackageSetting {
  manifestUrl: string;
  cssUrl?: string;
  className?: string;
  scopeCss?: boolean;
}

declare global {
  interface Window {
    NMPv3ApiBaseUrl?: string;
    NeteaseMiniPlayerApiBaseUrl?: string;
    NMPv3Config?: {
      apiBaseUrl?: string;
    };
    NeteaseMiniPlayerConfig?: {
      apiBaseUrl?: string;
    };
    NMPv3PlusConfig?: Partial<BrowserSettings> & {
      enabledExtensions?: string[];
      extensionPackages?: Array<string | BrowserExtensionPackageSetting>;
      skinPackages?: Array<string | BrowserSkinPackageSetting>;
    };
    NMPv3PlusPluginImporter?: (url: string) => Promise<unknown>;
    NMPv3PlusRuntimes?: ReturnType<typeof createNMPv3PlusRuntime>[];
  }

  interface HTMLElement {
    nmpv3PlusRuntime?: ReturnType<typeof createNMPv3PlusRuntime>;
  }
}

const DEFAULT_API_BASE_URL =
  "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php";

const extensionFactories = {
  "advanced-layouts": async (root: HTMLElement) => {
    const module = await import("./extensions/official/advanced-layouts");
    const layout = root.getAttribute("plus-layout") ?? "card";
    return module.createAdvancedLayoutPlugin({
      layout: layout === "cover" ? "cover" : "card",
    });
  },
  visualizer: async () => {
    const module = await import("./extensions/official/visualizer");
    return module.createVisualizerPlugin();
  },
  "host-sync": async (root: HTMLElement, settings: BrowserSettings) => {
    const module = await import("./extensions/official/host-sync");
    return module.createHostSyncPlugin({
      pageLinking: shouldEnablePageLinking(root, settings),
    });
  },
  "cover-color": async () => {
    const module = await import("./extensions/official/cover-color");
    return module.createCoverColorPlugin();
  },
  "cross-tab-sync": async () => {
    const module = await import("./extensions/official/cross-tab-sync");
    return module.createCrossTabSyncPlugin();
  },
  "media-session": async () => {
    const module = await import("./extensions/official/media-session");
    return module.createMediaSessionPlugin();
  },
  "custom-source": async (root: HTMLElement, settings: BrowserSettings) => {
    const module = await import("./extensions/official/custom-source");
    const adapter = sourceAdapterFor(root, settings);
    return adapter ? module.createCustomSourcePlugin(adapter) : null;
  },
  "local-lyrics": async (root: HTMLElement, settings: BrowserSettings) => {
    const lyricsUrl =
      root.getAttribute("lyrics-url") || settings.customLyricsUrl;
    const translationLyricsUrl =
      root.getAttribute("translation-lyrics-url") ||
      root.getAttribute("tlyric-url") ||
      settings.customTranslationLyricsUrl;

    if (!lyricsUrl) {
      return null;
    }

    const module = await import("./extensions/official/local-lyrics");
    const text = await fetch(lyricsUrl).then((response) => {
      if (!response.ok) {
        throw new Error(
          `NMPv3+ local lyrics request failed: ${response.status}`,
        );
      }

      return response.text();
    });

    const translation = translationLyricsUrl
      ? await fetchText(translationLyricsUrl, "local translation lyrics")
      : "";
    const songId = root.getAttribute("song-id") || "default";

    return module.createLocalLyricsPlugin({
      [songId]: translation ? { lyric: text, translation } : text,
    });
  },
  "pwa-cache": async () => {
    const module = await import("./extensions/official/pwa-cache");
    return module.createPwaCachePlugin();
  },
} satisfies Record<
  ExtensionName,
  (
    root: HTMLElement,
    settings: BrowserSettings,
  ) => Promise<NMPv3PlusPlugin | null>
>;

void whenReady().then(() => bootNMPv3PlusBrowser());

/**
 * 浏览器端主 bootloader
 * 扫描页面中所有 <nmp-player> 元素，为每个创建运行时、安装扩展/皮肤、加载音源
 */
export async function bootNMPv3PlusBrowser(
  root: ParentNode = document,
): Promise<ReturnType<typeof createNMPv3PlusRuntime>[]> {
  const settings = normalizedSettings();
  if (settings.syncBasePlayerApi) {
    syncBasePlayerApi(settings.apiBaseUrl);
  }
  const players = Array.from(root.querySelectorAll<HTMLElement>("nmp-player"));
  const runtimes = [];

  for (const playerElement of players) {
    const runtime = createNMPv3PlusRuntime({
      root: playerElement,
      eventTarget: playerElement,
      player: resolveNMPv3PlayerFromElement(playerElement),
      skins: officialNMPv3PlusSkins,
    });
    registerBuiltInAdapters(playerElement, runtime, settings);

    await installDeclaredExtensionPackages(playerElement, runtime, settings);

    for (const extension of enabledExtensionsFor(playerElement, settings)) {
      const factory = extensionFactories[extension];

      try {
        const plugin = await factory(playerElement, settings);

        if (plugin) {
          await runtime.installPlugin(plugin);
        }
      } catch (error) {
        console.warn(`NMPv3+ browser extension failed: ${extension}`, error);
      }
    }

    const skin =
      playerElement.getAttribute("skin") || settings.defaultSkin || "default";

    await registerDeclaredSkins(playerElement, runtime, settings);

    if (runtime.skins.get(skin)) {
      runtime.applySkin(skin, playerElement);
    }

    await loadDeclaredSource(playerElement, runtime, settings);
    await runtime.start();
    playerElement.nmpv3PlusRuntime = runtime;
    runtimes.push(runtime);
  }

  window.NMPv3PlusRuntimes = runtimes;
  window.dispatchEvent(
    new CustomEvent("nmpv3plus:ready", {
      detail: { runtimes },
    }),
  );

  return runtimes;
}

function normalizedSettings(): BrowserSettings {
  const config = window.NMPv3PlusConfig ?? {};
  const runtimeApiBaseUrl = window.NMPv3?.getGlobalConfig?.().apiBaseUrl;
  // 仅当基础播放器配置了非默认 API 地址时才继承
  const inheritedRuntimeApiBaseUrl =
    runtimeApiBaseUrl && runtimeApiBaseUrl !== DEFAULT_API_BASE_URL
      ? runtimeApiBaseUrl
      : undefined;
  // API 地址解析优先级：plus config > nmpv3 config > 全局 window 变量 > 继承自基础播放器
  const explicitApiBaseUrl =
    config.apiBaseUrl ||
    window.NMPv3Config?.apiBaseUrl ||
    window.NMPv3ApiBaseUrl ||
    window.NeteaseMiniPlayerConfig?.apiBaseUrl ||
    window.NeteaseMiniPlayerApiBaseUrl ||
    inheritedRuntimeApiBaseUrl;

  return {
    apiBaseUrl: explicitApiBaseUrl || runtimeApiBaseUrl || DEFAULT_API_BASE_URL,
    syncBasePlayerApi: Boolean(explicitApiBaseUrl),
    defaultSkin: config.defaultSkin || "default",
    enabledExtensions: normalizeExtensions(config.enabledExtensions),
    extensionPackages: normalizeExtensionPackages(config.extensionPackages),
    skinPackages: normalizeSkinPackages(config.skinPackages),
    localMusicJsonUrl: config.localMusicJsonUrl || "",
    customLyricsUrl: config.customLyricsUrl || "",
    customTranslationLyricsUrl:
      (config as { customTranslationLyricsUrl?: string })
        .customTranslationLyricsUrl || "",
    hostSyncEnabled: Boolean(config.hostSyncEnabled),
    pageLinkingEnabled: Boolean(config.pageLinkingEnabled),
  };
}

function syncBasePlayerApi(apiBaseUrl: string): void {
  if (!apiBaseUrl) {
    return;
  }

  window.NMPv3Config = {
    ...(window.NMPv3Config ?? {}),
    apiBaseUrl,
  };
  window.NMPv3ApiBaseUrl = apiBaseUrl;
  window.NeteaseMiniPlayerApiBaseUrl = apiBaseUrl;

  if (typeof window.NMPv3?.setApiBaseUrl === "function") {
    window.NMPv3.setApiBaseUrl(apiBaseUrl);
    return;
  }

  window.NMPv3?.setGlobalConfig?.({ apiBaseUrl });
}

function enabledExtensionsFor(
  root: HTMLElement,
  settings: BrowserSettings,
): ExtensionName[] {
  const selected = new Set(settings.enabledExtensions);

  for (const extension of parseExtensionAttribute(
    root.getAttribute("plus-extensions"),
  )) {
    selected.add(extension);
  }

  if (root.getAttribute("host-sync") === "true" || settings.hostSyncEnabled) {
    selected.add("host-sync");
  }

  if (shouldEnablePageLinking(root, settings)) {
    selected.add("host-sync");
  }

  if (
    root.getAttribute("source-type") ||
    root.getAttribute("source") ||
    settings.localMusicJsonUrl
  ) {
    selected.add("custom-source");
  }

  if (
    root.getAttribute("lyrics-url") ||
    root.getAttribute("translation-lyrics-url") ||
    root.getAttribute("tlyric-url") ||
    settings.customLyricsUrl ||
    settings.customTranslationLyricsUrl
  ) {
    selected.add("local-lyrics");
  }

  return Array.from(selected);
}

function shouldEnablePageLinking(
  root: HTMLElement,
  settings: BrowserSettings,
): boolean {
  return (
    root.getAttribute("page-linking") === "true" || settings.pageLinkingEnabled
  );
}

function parseExtensionAttribute(value: string | null): ExtensionName[] {
  return normalizeExtensions(value?.split(/[\s,]+/) ?? []);
}

function normalizeExtensions(values: unknown): ExtensionName[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is ExtensionName =>
    Object.prototype.hasOwnProperty.call(extensionFactories, value),
  );
}

function normalizeExtensionPackages(
  value: Array<string | BrowserExtensionPackageSetting> | undefined,
): BrowserExtensionPackageSetting[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "string"
        ? { manifestUrl: item }
        : {
            manifestUrl: item.manifestUrl,
            entryUrl: item.entryUrl,
            styleUrl: item.styleUrl,
            className: item.className,
            exportName: item.exportName,
            config: item.config,
            scopeCss: item.scopeCss,
          },
    )
    .filter((item) => Boolean(item.manifestUrl));
}

function normalizeSkinPackages(
  value: Array<string | BrowserSkinPackageSetting> | undefined,
): BrowserSkinPackageSetting[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "string"
        ? { manifestUrl: item }
        : {
            manifestUrl: item.manifestUrl,
            cssUrl: item.cssUrl,
            className: item.className,
            scopeCss: item.scopeCss,
          },
    )
    .filter((item) => Boolean(item.manifestUrl));
}

function sourceAdapterFor(root: HTMLElement, settings: BrowserSettings) {
  const sourceType = root.getAttribute("source-type");

  if (
    sourceType === "local-json" ||
    root.getAttribute("source") ||
    settings.localMusicJsonUrl
  ) {
    return createLocalJsonSourceAdapter();
  }

  const apiBaseUrl = apiBaseUrlFor(root, settings);

  if (sourceType === "netease" && apiBaseUrl) {
    return createNeteaseSourceAdapter({
      baseUrl: apiBaseUrl,
    });
  }

  if (sourceType === "custom-api" && apiBaseUrl) {
    return createCustomApiSourceAdapter({
      baseUrl: apiBaseUrl,
    });
  }

  return null;
}

function registerBuiltInAdapters(
  root: HTMLElement,
  runtime: NMPv3PlusRuntime,
  settings: BrowserSettings,
): void {
  if (root.getAttribute("source-type") !== "netease") {
    return;
  }

  const apiBaseUrl = apiBaseUrlFor(root, settings);

  if (!apiBaseUrl) {
    return;
  }

  runtime.registerLyrics(
    createNeteaseLyricsAdapter({
      baseUrl: apiBaseUrl,
    }),
  );
}

async function installDeclaredExtensionPackages(
  root: HTMLElement,
  runtime: NMPv3PlusRuntime,
  settings: BrowserSettings,
): Promise<void> {
  const extensionUrl = root.getAttribute("extension-url") || "";
  const packages = [
    ...settings.extensionPackages,
    ...(extensionUrl
      ? [
          {
            manifestUrl: extensionUrl,
            entryUrl: root.getAttribute("extension-entry-url") || undefined,
            styleUrl: root.getAttribute("extension-style-url") || undefined,
            className: root.getAttribute("extension-class") || undefined,
            exportName: root.getAttribute("extension-export") || undefined,
          },
        ]
      : []),
  ];

  for (const extensionPackage of packages) {
    try {
      const packageResult = await loadNMPv3PlusPluginPackage({
        ...extensionPackage,
        importer: window.NMPv3PlusPluginImporter,
      });
      await runtime.installPlugin(packageResult.plugin);
    } catch (error) {
      console.warn(
        `NMPv3+ browser extension package failed: ${extensionPackage.manifestUrl}`,
        error,
      );
    }
  }
}

async function registerDeclaredSkins(
  root: HTMLElement,
  runtime: NMPv3PlusRuntime,
  settings: BrowserSettings,
): Promise<void> {
  const skinUrl = root.getAttribute("skin-url") || "";
  const packages = [
    ...settings.skinPackages,
    ...(skinUrl
      ? [
          {
            manifestUrl: skinUrl,
            cssUrl: root.getAttribute("skin-css-url") || undefined,
            className: root.getAttribute("skin-class") || undefined,
          },
        ]
      : []),
  ];

  for (const skinPackage of packages) {
    try {
      runtime.registerSkin(await loadNMPv3PlusSkinPackage(skinPackage));
    } catch (error) {
      console.warn(
        `NMPv3+ browser skin package failed: ${skinPackage.manifestUrl}`,
        error,
      );
    }
  }
}

async function loadDeclaredSource(
  root: HTMLElement,
  runtime: NMPv3PlusRuntime,
  settings: BrowserSettings,
): Promise<void> {
  const input = sourceInputFor(root, settings);

  if (!input) {
    return;
  }

  const player = resolveNMPv3PlayerFromElement(root);
  await waitForBasePlayerReady(player);
  const playlist =
    input.kind === "song"
      ? {
          id: input.id,
          source: String(input.source ?? ""),
          songs: [await runtime.loadSong(input)],
        }
      : await runtime.loadPlaylist(input);
  const startIndex = input.id
    ? Math.max(
        0,
        playlist.songs.findIndex((song) => song.id === input.id),
      )
    : 0;
  const currentSong = await loadNMPv3PlusPlaylistIntoBasePlayer(
    player,
    playlist,
    {
      root,
      startIndex,
      autoplay: root.getAttribute("autoplay") === "true",
    },
  );
  await applyDeclaredLyrics(root, runtime, player, currentSong, settings);
  runtime.emit("source:loaded", {
    input,
    playlist,
    song: currentSong,
  });
}

/**
 * 等待基础播放器的 nmp-player Web Component 注册就绪
 * 通过轮询 getState 检查播放器是否结束 loading/idle 状态
 * 最多等待 80 次 × 25ms = 2 秒
 */
async function waitForBasePlayerReady(
  player: ReturnType<typeof resolveNMPv3PlayerFromElement>,
): Promise<void> {
  if (!player?.getState) {
    await nextFrame();
    await nextFrame();
    return;
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = player.getState() as { status?: string } | undefined;

    if (
      state?.status &&
      state.status !== "idle" &&
      state.status !== "loading"
    ) {
      return;
    }

    await delay(25);
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sourceInputFor(
  root: HTMLElement,
  settings: BrowserSettings,
): NMPv3PlusSourceInput | null {
  const sourceType = root.getAttribute("source-type");
  const sourceUrl = root.getAttribute("source") || settings.localMusicJsonUrl;

  if (sourceUrl) {
    return {
      source: "local-json",
      url: sourceUrl,
      id: root.getAttribute("song-id") || undefined,
    };
  }

  const sourceId =
    root.getAttribute("playlist-id") || root.getAttribute("song-id") || "";
  const sourceKind = root.getAttribute("playlist-id") ? "playlist" : "song";

  if (sourceType === "netease" && apiBaseUrlFor(root, settings) && sourceId) {
    return {
      source: "netease",
      id: sourceId,
      kind: sourceKind,
    };
  }

  if (
    sourceType === "custom-api" &&
    apiBaseUrlFor(root, settings) &&
    sourceId
  ) {
    return {
      source: "custom-api",
      id: sourceId,
      kind: sourceKind,
    };
  }

  return null;
}

function apiBaseUrlFor(root: HTMLElement, settings: BrowserSettings): string {
  return (
    root.getAttribute("api-base-url") ||
    root.dataset.apiBaseUrl ||
    settings.apiBaseUrl
  );
}

async function applyDeclaredLyrics(
  root: HTMLElement,
  runtime: NMPv3PlusRuntime,
  player: ReturnType<typeof resolveNMPv3PlayerFromElement>,
  song: NMPv3PlusSong,
  settings: BrowserSettings,
): Promise<void> {
  const declaredLyrics = declaredLyricsUrls(root, song, settings);

  if (
    !declaredLyrics.lyricUrl &&
    !declaredLyrics.translationLyricUrl &&
    song.source !== "netease"
  ) {
    return;
  }

  const lyrics =
    (await runtime
      .getLyrics({ songId: song.id, source: song.source, song })
      .catch(() => null)) ??
    (await runtime
      .getLyrics({ songId: "default", source: "static-lyrics", song })
      .catch(() => null));

  const resolvedLyrics =
    lyrics ??
    (await loadLyricsFromDeclaredUrls(song.id, declaredLyrics).catch(
      () => null,
    ));

  if (!resolvedLyrics) {
    return;
  }

  applyNMPv3PlusLyricsToBasePlayer(player, resolvedLyrics, root);
  runtime.emit("lyrics:loaded", {
    song,
    lyrics: resolvedLyrics,
  });
}

function declaredLyricsUrls(
  root: HTMLElement,
  song: NMPv3PlusSong,
  settings: BrowserSettings,
): {
  lyricUrl: string;
  translationLyricUrl: string;
} {
  return {
    lyricUrl:
      root.getAttribute("lyrics-url") ||
      settings.customLyricsUrl ||
      song.lyricUrl ||
      "",
    translationLyricUrl:
      root.getAttribute("translation-lyrics-url") ||
      root.getAttribute("tlyric-url") ||
      settings.customTranslationLyricsUrl ||
      song.translationLyricUrl ||
      "",
  };
}

async function loadLyricsFromDeclaredUrls(
  songId: string,
  urls: {
    lyricUrl: string;
    translationLyricUrl: string;
  },
) {
  if (!urls.lyricUrl && !urls.translationLyricUrl) {
    return null;
  }

  const lyric = urls.lyricUrl
    ? await fetchText(urls.lyricUrl, "local lyrics")
    : "";
  const translation = urls.translationLyricUrl
    ? await fetchText(urls.translationLyricUrl, "local translation lyrics")
    : "";

  return {
    songId,
    source: "local-lyrics-url",
    raw: {
      lyricUrl: urls.lyricUrl,
      translationLyricUrl: urls.translationLyricUrl,
    },
    lines: parseStaticLyrics({
      lyric,
      translation,
    }),
  };
}

async function fetchText(url: string, label: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NMPv3+ ${label} request failed: ${response.status}`);
  }

  return response.text();
}

async function whenReady(): Promise<void> {
  if (customElements?.whenDefined) {
    await customElements.whenDefined("nmp-player");
  }

  if (document.readyState === "loading") {
    await new Promise<void>((resolve) =>
      document.addEventListener("DOMContentLoaded", () => resolve(), {
        once: true,
      }),
    );
  }
}
