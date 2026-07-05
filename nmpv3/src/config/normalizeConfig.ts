import { defaultConfig } from "./defaultConfig";
import type {
  NMPv3Config,
  NMPv3EmbedMode,
  NMPv3Layout,
  NMPv3Position,
  NMPv3Theme,
} from "../types";

const themes: NMPv3Theme[] = ["auto", "light", "dark"];
const layouts: NMPv3Layout[] = ["mini", "compact", "dock"];
const embedModes: NMPv3EmbedMode[] = ["page", "article"];
const positions: NMPv3Position[] = [
  "static",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/**
 * 将用户传入的松散配置规范化为完整的 NMPv3Config
 * 处理枚举校验、embed/article 互斥逻辑、数值边界裁剪
 */
export function normalizeConfig(
  config: Partial<NMPv3Config> = {},
): NMPv3Config {
  const requestedEmbedMode = normalizeEnumOrUndefined(
    config.embedMode,
    embedModes,
  );
  const embedMode =
    requestedEmbedMode ??
    (normalizeBoolean(config.embed, defaultConfig.embed)
      ? "article"
      : defaultConfig.embedMode);
  const embed = embedMode === "article";
  const isArticleEmbed = embedMode === "article";
  const layout = normalizeEnum(
    config.layout,
    layouts,
    isArticleEmbed ? "mini" : defaultConfig.layout,
  );
  const position = isArticleEmbed
    ? "static"
    : normalizeEnum(config.position, positions, defaultConfig.position);

  return {
    ...defaultConfig,
    ...config,
    theme: normalizeEnum(config.theme, themes, defaultConfig.theme),
    layout,
    embed,
    embedMode,
    position,
    volume: normalizeVolume(config.volume),
    autoplay: normalizeBoolean(config.autoplay, defaultConfig.autoplay),
    showLyrics: normalizeBoolean(config.showLyrics, defaultConfig.showLyrics),
    showPlaylist: isArticleEmbed
      ? false
      : normalizeBoolean(config.showPlaylist, defaultConfig.showPlaylist),
    defaultMinimized: isArticleEmbed
      ? false
      : normalizeBoolean(
          config.defaultMinimized,
          defaultConfig.defaultMinimized,
        ),
    autoPauseOnHidden: normalizeBoolean(
      config.autoPauseOnHidden,
      defaultConfig.autoPauseOnHidden,
    ),
    remember: normalizeBoolean(config.remember, defaultConfig.remember),
    storageKey: config.storageKey || undefined,
    draggable: isArticleEmbed
      ? false
      : normalizeBoolean(config.draggable, defaultConfig.draggable),
    hotkeys: normalizeBoolean(config.hotkeys, defaultConfig.hotkeys),
    idleOpacity: normalizeOpacity(config.idleOpacity),
    apiBaseUrl: config.apiBaseUrl ?? defaultConfig.apiBaseUrl,
  };
}

export function mergeConfig(
  ...configs: Array<Partial<NMPv3Config> | undefined>
): Partial<NMPv3Config> {
  const merged: Partial<NMPv3Config> = {};

  for (const config of configs) {
    if (!config) {
      continue;
    }

    for (const [key, value] of Object.entries(config) as Array<
      [keyof NMPv3Config, NMPv3Config[keyof NMPv3Config] | undefined]
    >) {
      if (value !== undefined) {
        merged[key] = value as never;
      }
    }
  }

  return merged;
}

/**
 * 从 DOM 元素的 HTML 属性和 dataset 中提取播放器配置
 * 兼容 v2 的 auto-pause 旧属性（语义反转：auto-pause=true → autoPauseOnHidden=false）
 */
export function configFromElement(element: HTMLElement): Partial<NMPv3Config> {
  const embedConfig = readEmbedConfig(element);
  const legacyAutoPause = booleanAttribute(element, "auto-pause");
  const autoPauseOnHidden =
    legacyAutoPause == null
      ? booleanAttribute(element, "auto-pause-on-hidden")
      : !legacyAutoPause;

  return {
    songId: element.getAttribute("song-id") ?? element.dataset.songId,
    playlistId:
      element.getAttribute("playlist-id") ?? element.dataset.playlistId,
    theme: (element.getAttribute("theme") as NMPv3Theme | null) ?? undefined,
    layout: (element.getAttribute("layout") as NMPv3Layout | null) ?? undefined,
    ...embedConfig,
    position:
      (element.getAttribute("position") as NMPv3Position | null) ?? undefined,
    volume: numberAttribute(element, "volume"),
    apiBaseUrl:
      element.getAttribute("api-base-url") ?? element.dataset.apiBaseUrl,
    autoplay: booleanAttribute(element, "autoplay"),
    showLyrics: booleanAttribute(element, "lyric", "showLyrics"),
    showPlaylist: booleanAttribute(element, "playlist", "showPlaylist"),
    defaultMinimized: booleanAttribute(element, "default-minimized"),
    autoPauseOnHidden,
    remember: booleanAttribute(element, "remember"),
    storageKey:
      element.getAttribute("storage-key") ?? element.dataset.storageKey,
    draggable: booleanAttribute(element, "draggable"),
    hotkeys: booleanAttribute(element, "hotkeys"),
    idleOpacity: numberAttribute(element, "idle-opacity"),
  };
}

function readEmbedConfig(element: HTMLElement): Partial<NMPv3Config> {
  const rawEmbed =
    element.getAttribute("embed") ?? element.dataset.embed ?? undefined;
  const rawMode =
    element.getAttribute("embed-mode") ?? element.dataset.embedMode ?? rawEmbed;

  if (rawMode === "article" || rawMode === "page") {
    return {
      embed: rawMode === "article",
      embedMode: rawMode,
    };
  }

  if (rawEmbed == null) {
    return {};
  }

  return {
    embed: rawEmbed !== "false",
    embedMode: rawEmbed === "false" ? "page" : "article",
  };
}

function normalizeEnum<T extends string>(
  value: T | undefined,
  allowed: T[],
  fallback: T,
): T {
  return value && allowed.includes(value) ? value : fallback;
}

function normalizeEnumOrUndefined<T extends string>(
  value: T | undefined,
  allowed: T[],
): T | undefined {
  return value && allowed.includes(value) ? value : undefined;
}

function normalizeVolume(volume: number | undefined): number {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return defaultConfig.volume;
  }

  return Math.min(1, Math.max(0, volume));
}

function normalizeOpacity(opacity: number | undefined): number {
  if (typeof opacity !== "number" || Number.isNaN(opacity)) {
    return defaultConfig.idleOpacity;
  }

  return Math.min(1, Math.max(0.1, opacity));
}

function normalizeBoolean(
  value: boolean | undefined,
  fallback: boolean,
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function booleanAttribute(
  element: HTMLElement,
  attributeName: string,
  datasetName?: string,
): boolean | undefined {
  const raw =
    element.getAttribute(attributeName) ??
    element.dataset[datasetName ?? toDatasetKey(attributeName)];

  if (raw == null) {
    return undefined;
  }

  return raw !== "false";
}

function numberAttribute(
  element: HTMLElement,
  attributeName: string,
): number | undefined {
  const raw =
    element.getAttribute(attributeName) ??
    element.dataset[toDatasetKey(attributeName)];

  if (raw == null || raw.trim() === "") {
    return undefined;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function toDatasetKey(attributeName: string): string {
  return attributeName.replace(/-([a-z])/g, (_, char: string) =>
    char.toUpperCase(),
  );
}
