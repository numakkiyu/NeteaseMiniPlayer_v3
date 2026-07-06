import type {
  NMPv3PlusLyricsAdapter,
  NMPv3PlusLyricsInput,
  NMPv3PlusLyricsResult,
  NMPv3PlusLyricLine,
} from "../types";

/**
 * 歌词适配器管理器
 * 按优先级排序查找可用适配器，支持按 source 精确匹配
 * 内置网易云 API 适配器和静态歌词适配器
 */
export class NMPv3PlusLyricsAdapterManager {
  private readonly adapters = new Map<string, NMPv3PlusLyricsAdapter>();

  register(adapter: NMPv3PlusLyricsAdapter): () => void {
    if (this.adapters.has(adapter.name)) {
      throw new Error(
        `NMPv3+ lyrics adapter already registered: ${adapter.name}`,
      );
    }

    this.adapters.set(adapter.name, adapter);
    return () => this.unregister(adapter.name);
  }

  unregister(name: string): boolean {
    return this.adapters.delete(name);
  }

  list(): NMPv3PlusLyricsAdapter[] {
    return this.sortedAdapters();
  }

  resolve(input: NMPv3PlusLyricsInput): NMPv3PlusLyricsAdapter | null {
    if (input.source) {
      const adapter = this.adapters.get(input.source);
      if (adapter?.canHandle(input)) {
        return adapter;
      }
    }

    return (
      this.sortedAdapters().find((adapter) => adapter.canHandle(input)) ?? null
    );
  }

  async getLyrics(input: NMPv3PlusLyricsInput): Promise<NMPv3PlusLyricsResult> {
    const adapter = this.resolve(input);

    if (!adapter) {
      throw new Error(`NMPv3+ cannot load lyrics: ${input.songId}`);
    }

    return adapter.getLyrics(input);
  }

  private sortedAdapters(): NMPv3PlusLyricsAdapter[] {
    return Array.from(this.adapters.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }
}

export function createNeteaseLyricsAdapter(options: {
  baseUrl: string;
}): NMPv3PlusLyricsAdapter {
  return {
    name: "netease",
    priority: 9,
    canHandle(input) {
      return input.source === "netease" || input.song?.source === "netease";
    },
    async getLyrics(input) {
      const response = await fetchJson<{
        lrc?: { lyric?: string };
        tlyric?: { lyric?: string };
      }>(buildUrl(options.baseUrl, "/lyric", { id: input.songId }));

      return {
        songId: input.songId,
        source: "netease",
        lines: parseStaticLyrics(response),
        raw: response,
      };
    },
  };
}

export function createStaticLyricsAdapter(
  lyrics: Record<string, NMPv3PlusStaticLyricsValue>,
): NMPv3PlusLyricsAdapter {
  return {
    name: "static-lyrics",
    priority: 10,
    canHandle(input) {
      return input.source === "static-lyrics" || input.songId in lyrics;
    },
    async getLyrics(input) {
      const value = lyrics[input.songId];

      if (!value) {
        throw new Error(`NMPv3+ static lyrics not found: ${input.songId}`);
      }

      return {
        songId: input.songId,
        source: "static-lyrics",
        lines: parseStaticLyrics(value),
        raw: value,
      };
    },
  };
}

export type NMPv3PlusStaticLyricsValue =
  | string
  | NMPv3PlusLyricLine[]
  | {
      lines?: NMPv3PlusLyricLine[];
      lyric?: string;
      translation?: string;
      lrc?: { lyric?: string };
      tlyric?: { lyric?: string };
    };

/**
 * 解析多种格式的静态歌词数据为统一行数组
 * 支持字符串 LRC、结构化行数组、对象（含 lyric/translation/lrc/tlyric 字段）
 */
export function parseStaticLyrics(
  value: NMPv3PlusStaticLyricsValue,
): NMPv3PlusLyricLine[] {
  if (Array.isArray(value)) {
    return normalizeJsonLines(value);
  }

  if (typeof value === "string") {
    return parseTextLyrics(value);
  }

  if (Array.isArray(value.lines)) {
    return normalizeJsonLines(value.lines);
  }

  const lyric = value.lyric ?? value.lrc?.lyric ?? "";
  const translation = value.translation ?? value.tlyric?.lyric ?? "";
  const lines = parseTextLyrics(lyric);
  const translatedLines = parseTextLyrics(translation);

  if (translatedLines.length === 0) {
    return lines;
  }

  return mergeTranslation(lines, translatedLines);
}

function parseLrc(input: string): NMPv3PlusLyricLine[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?]\s*(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      time: toSeconds(match[1] ?? "0", match[2] ?? "0", match[3]),
      text: match[4] ?? "",
    }))
    .sort((a, b) => a.time - b.time);
}

function parseTextLyrics(input: string): NMPv3PlusLyricLine[] {
  if (!input.trim()) {
    return [];
  }

  const lrc = parseLrc(input);

  if (lrc.length > 0) {
    return lrc;
  }

  // 非 LRC 格式时按行拆分，每行按索引赋值时间
  return input
    .split(/\r?\n/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      time: index,
      text,
    }));
}

function normalizeJsonLines(lines: NMPv3PlusLyricLine[]): NMPv3PlusLyricLine[] {
  return lines
    .map((line) => ({
      time: Number.isFinite(line.time) ? line.time : 0,
      text: line.text ?? "",
      translation: line.translation,
    }))
    .sort((a, b) => a.time - b.time);
}

function mergeTranslation(
  lines: NMPv3PlusLyricLine[],
  translatedLines: NMPv3PlusLyricLine[],
): NMPv3PlusLyricLine[] {
  if (lines.length === 0) {
    return translatedLines.map((line) => ({
      time: line.time,
      text: "",
      translation: line.text,
    }));
  }

  return lines.map((line, index) => {
    const translated =
      translatedLines.find((candidate) => candidate.time === line.time) ??
      translatedLines[index];

    return {
      ...line,
      translation: translated?.text,
    };
  });
}

function toSeconds(
  minutes: string,
  seconds: string,
  milliseconds = "0",
): number {
  return (
    Number(minutes) * 60 +
    Number(seconds) +
    Number(milliseconds.padEnd(3, "0")) / 1000
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NMPv3+ lyrics request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function buildUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string>,
): string {
  const url = new URL(
    `${baseUrl.replace(/\/$/, "")}${path}`,
    globalThis.location?.href ?? "http://localhost/",
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
