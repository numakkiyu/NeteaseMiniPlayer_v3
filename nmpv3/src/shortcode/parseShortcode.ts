import type { NMPv3Config } from "../types";

/**
 * 解析短码字符串为播放器配置
 * 格式: {nmpv3:key=value,key=value} 或 {nmpv3:songId}
 * 首个无键值对被当作 songId 处理
 */
export function parseShortcode(input: string): Partial<NMPv3Config> | null {
  const match = input.trim().match(/^\{(?:nmpv3|nmpv2):([\s\S]+)}$/);

  if (!match) {
    return null;
  }

  const config: Record<string, string | boolean | number> = {};
  let hasEmbedIntent = false;
  let hasPositionIntent = false;

  match[1].split(",").forEach((part, index) => {
    const [rawKey, rawValue] = part.split("=").map((value) => value.trim());

    if (!rawKey) {
      return;
    }

    if (index === 0 && rawValue == null && /^\d+$/.test(rawKey)) {
      config.songId = rawKey;
      return;
    }

    const key = normalizeKey(rawKey);
    const value = normalizeValue(rawValue ?? "");

    if (key === "position") {
      hasPositionIntent = true;
    }

    if (key === "playlistId" || key === "songId") {
      config[key] = value === true ? rawKey : String(value);
      return;
    }

    if (key === "embed") {
      hasEmbedIntent = true;
      if (value === "article" || value === "page") {
        config.embed = value === "article";
        config.embedMode = value;
      } else {
        config.embed = value;
        config.embedMode = value === true ? "article" : "page";
      }
      return;
    }

    if (key === "embedMode") {
      hasEmbedIntent = true;
      config.embedMode = value === "article" || value === "page" ? value : "";
      return;
    }

    if (key === "autoPause") {
      config.autoPauseOnHidden = value === true ? false : true;
      return;
    }

    if (key === "idleOpacity" || key === "volume") {
      config[key] = Number(value);
      return;
    }

    config[key] = value;
  });

  if (!hasEmbedIntent) {
    const position = typeof config.position === "string" ? config.position : "";
    const shouldUseArticleEmbed = !hasPositionIntent || position === "static";
    config.embed = shouldUseArticleEmbed;
    config.embedMode = shouldUseArticleEmbed ? "article" : "page";
  }

  return config as Partial<NMPv3Config>;
}

function normalizeKey(key: string): string {
  if (key === "song" || key === "song-id") {
    return "songId";
  }

  if (key === "playlist" || key === "playlist-id") {
    return "playlistId";
  }

  if (key === "lyric") {
    return "showLyrics";
  }

  if (key === "minimized") {
    return "defaultMinimized";
  }

  if (key === "api-base-url") {
    return "apiBaseUrl";
  }

  if (key === "embed-mode") {
    return "embedMode";
  }

  if (key === "auto-pause") {
    return "autoPause";
  }

  if (key === "auto-pause-on-hidden") {
    return "autoPauseOnHidden";
  }

  if (key === "storage-key") {
    return "storageKey";
  }

  if (key === "idle-opacity") {
    return "idleOpacity";
  }

  return key;
}

function normalizeValue(value: string): string | boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}
