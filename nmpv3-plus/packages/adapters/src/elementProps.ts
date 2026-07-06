export interface NMPv3PlusElementConfig {
  songId?: string;
  playlistId?: string;
  sourceType?: string;
  source?: string;
  skin?: string;
  skinUrl?: string;
  theme?: string;
  layout?: string;
  plusLayout?: "card" | "cover";
  plusExtensions?: string[] | string;
  extensionUrl?: string;
  extensionEntryUrl?: string;
  extensionStyleUrl?: string;
  position?: string;
  lyric?: boolean;
  lyricsUrl?: string;
  translationLyricsUrl?: string;
  playlist?: boolean;
  apiBaseUrl?: string;
  hostSync?: boolean;
  pageLinking?: boolean;
}

export type NMPv3PlusElementAttrs = Record<string, string | boolean>;

export interface NMPv3PlusElementPlan {
  tagName: "nmp-player";
  attrs: NMPv3PlusElementAttrs;
  html: string;
  events: Record<string, string>;
  clientOnly: boolean;
  requiredImports: string[];
}

export const nmpv3PlusElementEvents = {
  ready: "nmpv3:ready",
  play: "nmpv3:play",
  pause: "nmpv3:pause",
  songchange: "nmpv3:songchange",
  playlistchange: "nmpv3:playlistchange",
  error: "nmpv3:error",
} as const;

export function toNMPv3PlusElementAttrs(
  config: NMPv3PlusElementConfig,
): NMPv3PlusElementAttrs {
  const attrs: NMPv3PlusElementAttrs = {};

  setAttr(attrs, "song-id", config.songId);
  setAttr(attrs, "playlist-id", config.playlistId);
  setAttr(attrs, "source-type", config.sourceType);
  setAttr(attrs, "source", config.source);
  setAttr(attrs, "skin", config.skin);
  setAttr(attrs, "skin-url", config.skinUrl);
  setAttr(attrs, "theme", config.theme);
  setAttr(attrs, "layout", config.layout);
  setAttr(attrs, "plus-layout", config.plusLayout);
  setAttr(attrs, "plus-extensions", normalizeListAttr(config.plusExtensions));
  setAttr(attrs, "extension-url", config.extensionUrl);
  setAttr(attrs, "extension-entry-url", config.extensionEntryUrl);
  setAttr(attrs, "extension-style-url", config.extensionStyleUrl);
  setAttr(attrs, "position", config.position);
  setAttr(attrs, "lyric", config.lyric);
  setAttr(attrs, "lyrics-url", config.lyricsUrl);
  setAttr(attrs, "translation-lyrics-url", config.translationLyricsUrl);
  setAttr(attrs, "playlist", config.playlist);
  setAttr(attrs, "api-base-url", config.apiBaseUrl);
  setAttr(attrs, "host-sync", config.hostSync);
  setAttr(attrs, "page-linking", config.pageLinking);

  return attrs;
}

/**
 * 框架适配器核心：将 NMPv3+ 配置转为 <nmp-player> DOM 属性
 * 同时生成完整的元素计划（含 HTML 序列化、事件映射、客户端导入）
 */
export function createNMPv3PlusElementPlan(
  config: NMPv3PlusElementConfig,
): NMPv3PlusElementPlan {
  const attrs = toNMPv3PlusElementAttrs(config);

  return {
    tagName: "nmp-player",
    attrs,
    html: renderNMPv3PlusElement(attrs),
    events: { ...nmpv3PlusElementEvents },
    clientOnly: true,
    requiredImports: [
      "@netease-mini-player/v3/auto",
      "@netease-mini-player/v3-plus",
    ],
  };
}

export function renderNMPv3PlusElement(attrs: NMPv3PlusElementAttrs): string {
  const serializedAttrs = Object.entries(attrs)
    .map(([name, value]) =>
      typeof value === "boolean"
        ? `${name}="${String(value)}"`
        : `${name}="${escapeHtmlAttr(value)}"`,
    )
    .join(" ");

  return serializedAttrs
    ? `<nmp-player ${serializedAttrs}></nmp-player>`
    : "<nmp-player></nmp-player>";
}

function setAttr(
  attrs: NMPv3PlusElementAttrs,
  name: string,
  value: string | boolean | undefined,
): void {
  if (value !== undefined && value !== "") {
    attrs[name] = value;
  }
}

function normalizeListAttr(
  value: string[] | string | undefined,
): string | undefined {
  return Array.isArray(value) ? value.filter(Boolean).join(",") : value;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
