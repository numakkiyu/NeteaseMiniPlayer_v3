export interface NMPv3PlusPhpPlayerConfig {
  song?: string;
  playlist?: string;
  source?:
    "netease" | "local-json" | "static-playlist" | "custom-api" | "manual";
  localMusicJson?: string;
  lyrics?: string;
  translationLyrics?: string;
  skin?: string;
  extensions?: string[];
  apiBaseUrl?: string;
  hostSync?: boolean;
  pageLinking?: boolean;
  layout?: "mini" | "compact" | "dock" | "card" | "cover";
}

export interface NMPv3PlusPhpRuntimeConfig {
  apiBaseUrl?: string;
  enabledExtensions?: string[];
  enabledSkins?: string[];
  defaultSkin?: string;
  localMusicJsonUrl?: string;
  customLyricsUrl?: string;
  customTranslationLyricsUrl?: string;
  hostSyncEnabled?: boolean;
  pageLinkingEnabled?: boolean;
}

export function createNMPv3PlusPhpAttributes(
  config: NMPv3PlusPhpPlayerConfig,
): Record<string, string> {
  const attrs: Record<string, string> = {};

  setAttr(attrs, "song-id", config.song);
  setAttr(attrs, "playlist-id", config.playlist);
  setAttr(attrs, "source-type", config.source);
  setAttr(attrs, "source", config.localMusicJson);
  setAttr(attrs, "lyrics-url", config.lyrics);
  setAttr(attrs, "translation-lyrics-url", config.translationLyrics);
  setAttr(attrs, "skin", config.skin);
  setAttr(attrs, "plus-extensions", config.extensions?.join(","));
  setAttr(attrs, "api-base-url", config.apiBaseUrl);
  setAttr(attrs, "host-sync", boolAttr(config.hostSync));
  setAttr(attrs, "page-linking", boolAttr(config.pageLinking));
  setAttr(attrs, "layout", config.layout);

  return attrs;
}

export function renderNMPv3PlusPhpPlayer(
  config: NMPv3PlusPhpPlayerConfig,
): string {
  const attrs = createNMPv3PlusPhpAttributes(config);
  const serialized = Object.entries(attrs)
    .map(([name, value]) => `${name}="${escapeHtmlAttribute(value)}"`)
    .join(" ");

  return serialized
    ? `<nmp-player ${serialized}></nmp-player>`
    : "<nmp-player></nmp-player>";
}

export function renderNMPv3PlusShortcode(
  config: NMPv3PlusPhpPlayerConfig,
): string {
  const attrs = createNMPv3PlusPhpAttributes(config);
  const serialized = Object.entries(attrs)
    .map(
      ([name, value]) =>
        `${toShortcodeKey(name)}="${escapeShortcodeValue(value)}"`,
    )
    .join(" ");

  return serialized ? `[nmpv3plus ${serialized}]` : "[nmpv3plus]";
}

export function serializeNMPv3PlusPhpRuntimeConfig(
  config: NMPv3PlusPhpRuntimeConfig,
): string {
  return JSON.stringify(
    {
      apiBaseUrl: config.apiBaseUrl ?? "",
      enabledExtensions: config.enabledExtensions ?? [],
      enabledSkins: config.enabledSkins ?? [],
      defaultSkin: config.defaultSkin ?? "default",
      localMusicJsonUrl: config.localMusicJsonUrl ?? "",
      customLyricsUrl: config.customLyricsUrl ?? "",
      customTranslationLyricsUrl: config.customTranslationLyricsUrl ?? "",
      hostSyncEnabled: Boolean(config.hostSyncEnabled),
      pageLinkingEnabled: Boolean(config.pageLinkingEnabled),
    },
    null,
    2,
  );
}

function setAttr(
  attrs: Record<string, string>,
  name: string,
  value: string | undefined,
): void {
  if (value) {
    attrs[name] = value;
  }
}

function boolAttr(value: boolean | undefined): string | undefined {
  if (typeof value !== "boolean") {
    return undefined;
  }

  return value ? "true" : "false";
}

function toShortcodeKey(name: string): string {
  return name.replace(/-/g, "_");
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeShortcodeValue(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/\]/g, "&#93;");
}
