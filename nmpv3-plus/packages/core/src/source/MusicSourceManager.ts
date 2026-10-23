import type {
  NMPv3PlusPlaylist,
  NMPv3PlusSong,
  NMPv3PlusSourceAdapter,
  NMPv3PlusSourceInput,
} from "../types";

/**
 * 音乐源适配器管理器
 * 按优先级排序查找可用适配器，内置网易云、本地 JSON、静态歌单、手动数据和自定义 API 五种适配器
 */
export class NMPv3PlusMusicSourceManager {
  private readonly adapters = new Map<string, NMPv3PlusSourceAdapter>();

  register(adapter: NMPv3PlusSourceAdapter): () => void {
    if (this.adapters.has(adapter.name)) {
      throw new Error(
        `NMPv3+ source adapter already registered: ${adapter.name}`,
      );
    }

    this.adapters.set(adapter.name, adapter);
    return () => this.unregister(adapter.name);
  }

  unregister(name: string): boolean {
    return this.adapters.delete(name);
  }

  list(): NMPv3PlusSourceAdapter[] {
    return this.sortedAdapters();
  }

  /**
   * 判断适配器是否接手某个输入
   *
   * canHandle 由第三方实现，抛错一律视为「不接手」，
   * 这样一个写坏的适配器不会拖垮整个解析链。
   */
  private canHandleSafely(
    adapter: NMPv3PlusSourceAdapter,
    input: NMPv3PlusSourceInput,
  ): boolean {
    try {
      return Boolean(adapter.canHandle(input));
    } catch {
      return false;
    }
  }

  resolve(input: NMPv3PlusSourceInput): NMPv3PlusSourceAdapter | null {
    if (input.source) {
      const adapter = this.adapters.get(input.source);
      if (adapter && this.canHandleSafely(adapter, input)) {
        return adapter;
      }
    }

    return (
      this.sortedAdapters().find((adapter) =>
        this.canHandleSafely(adapter, input),
      ) ?? null
    );
  }

  /**
   * 列出所有可以接手该输入的适配器，按「显式指定 > 数值优先级」排序
   *
   * 用于失败降级：前一个适配器抛错时接着试下一个。
   */
  private candidatesFor(
    input: NMPv3PlusSourceInput,
    method: "getSong" | "getPlaylist",
  ): NMPv3PlusSourceAdapter[] {
    const ordered: NMPv3PlusSourceAdapter[] = [];
    const seen = new Set<string>();

    const push = (adapter: NMPv3PlusSourceAdapter | undefined) => {
      if (!adapter || seen.has(adapter.name)) {
        return;
      }
      if (typeof adapter[method] !== "function") {
        return;
      }
      if (!this.canHandleSafely(adapter, input)) {
        return;
      }
      seen.add(adapter.name);
      ordered.push(adapter);
    };

    if (input.source) {
      push(this.adapters.get(input.source));
    }

    for (const adapter of this.sortedAdapters()) {
      push(adapter);
    }

    return ordered;
  }

  async loadSong(input: NMPv3PlusSourceInput): Promise<NMPv3PlusSong> {
    const candidates = this.candidatesFor(input, "getSong");

    if (candidates.length === 0) {
      throw new Error(
        `NMPv3+ cannot load song from source: ${input.source ?? "unknown"}`,
      );
    }

    let lastError: unknown = null;

    for (const adapter of candidates) {
      try {
        return await adapter.getSong!(input);
      } catch (error) {
        // 记录后继续尝试下一个适配器，全部失败才把最后一个错误抛给调用方
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(
          `NMPv3+ cannot load song from source: ${input.source ?? "unknown"}`,
        );
  }

  async loadPlaylist(input: NMPv3PlusSourceInput): Promise<NMPv3PlusPlaylist> {
    const candidates = this.candidatesFor(input, "getPlaylist");

    if (candidates.length === 0) {
      throw new Error(
        `NMPv3+ cannot load playlist from source: ${input.source ?? "unknown"}`,
      );
    }

    let lastError: unknown = null;

    for (const adapter of candidates) {
      try {
        return await adapter.getPlaylist!(input);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(
          `NMPv3+ cannot load playlist from source: ${input.source ?? "unknown"}`,
        );
  }

  private sortedAdapters(): NMPv3PlusSourceAdapter[] {
    return Array.from(this.adapters.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }
}

interface RawNeteaseArtist {
  name?: string;
}

interface RawNeteaseAlbum {
  name?: string;
  picUrl?: string;
}

interface RawNeteaseSong {
  id: number | string;
  name?: string;
  ar?: RawNeteaseArtist[];
  artists?: RawNeteaseArtist[];
  al?: RawNeteaseAlbum;
  album?: RawNeteaseAlbum;
  picUrl?: string;
  duration?: number;
  dt?: number;
}

export function createNeteaseSourceAdapter(options: {
  baseUrl: string;
  level?: string;
}): NMPv3PlusSourceAdapter {
  const level = options.level ?? "exhigh";

  return {
    name: "netease",
    priority: 11,
    canHandle(input) {
      return input.source === "netease";
    },
    async getSong(input) {
      const id = requireId(input.id, "netease song");
      const response = await fetchJson<{ songs?: RawNeteaseSong[] }>(
        buildUrl(options.baseUrl, "/song/detail", { ids: id }),
      );
      const song = response.songs?.[0];

      if (!song) {
        throw new Error(`NMPv3+ netease song not found: ${id}`);
      }

      const normalized = normalizeNeteaseSong(song);
      return {
        ...normalized,
        url: await fetchNeteaseSongUrl(options.baseUrl, normalized.id, level),
      };
    },
    async getPlaylist(input) {
      const id = requireId(input.id, "netease playlist");
      const response = await fetchJson<{ songs?: RawNeteaseSong[] }>(
        buildUrl(options.baseUrl, "/playlist/track/all", {
          id,
          limit: "1000",
          offset: "0",
        }),
      );
      const songs = (response.songs ?? []).map((song) =>
        normalizeNeteaseSong(song),
      );
      const urls = await fetchNeteaseSongUrls(
        options.baseUrl,
        songs.map((song) => song.id),
        level,
      );

      return {
        id,
        source: "netease",
        raw: response,
        songs: songs.map((song) => ({
          ...song,
          url: urls.get(song.id) ?? song.url,
        })),
      };
    },
  };
}

export function createLocalJsonSourceAdapter(): NMPv3PlusSourceAdapter {
  return {
    name: "local-json",
    priority: 10,
    canHandle(input) {
      return (
        input.source === "local-json" ||
        isPlaylistData(input.data) ||
        isNonEmptyString(input.url)
      );
    },
    async getSong(input) {
      const playlist = await this.getPlaylist?.(input);
      const songId = input.id;
      const song =
        (songId
          ? playlist?.songs.find((candidate) => candidate.id === songId)
          : playlist?.songs[0]) ?? null;

      if (!song) {
        throw new Error(
          `NMPv3+ local-json song not found: ${songId ?? "first"}`,
        );
      }

      return song;
    },
    async getPlaylist(input) {
      const data = isPlaylistData(input.data)
        ? input.data
        : await fetchPlaylistData(input.url);

      if (!isPlaylistData(data)) {
        throw new Error("NMPv3+ local-json source requires playlist data");
      }

      return normalizePlaylist(data, "local-json");
    },
  };
}

export function createStaticPlaylistSourceAdapter(
  playlist: NMPv3PlusPlaylist,
): NMPv3PlusSourceAdapter {
  return {
    name: "static-playlist",
    priority: 9,
    canHandle(input) {
      return input.source === "static-playlist";
    },
    async getSong(input) {
      const song =
        (input.id
          ? playlist.songs.find((candidate) => candidate.id === input.id)
          : playlist.songs[0]) ?? null;

      if (!song) {
        throw new Error(
          `NMPv3+ static-playlist song not found: ${input.id ?? "first"}`,
        );
      }

      return {
        ...song,
        source: "static-playlist",
      };
    },
    async getPlaylist() {
      return {
        ...playlist,
        source: "static-playlist",
        songs: playlist.songs.map((song) => ({
          ...song,
          source: "static-playlist",
        })),
      };
    },
  };
}

export function createManualSourceAdapter(
  songs: NMPv3PlusSong[] = [],
): NMPv3PlusSourceAdapter {
  return {
    name: "manual",
    priority: 8,
    canHandle(input) {
      return (
        input.source === "manual" ||
        isSongData(input.data) ||
        Array.isArray(input.data)
      );
    },
    async getSong(input) {
      const candidates = normalizeManualSongs(input.data, songs);
      const song =
        (input.id
          ? candidates.find((candidate) => candidate.id === input.id)
          : candidates[0]) ?? null;

      if (!song) {
        throw new Error(`NMPv3+ manual song not found: ${input.id ?? "first"}`);
      }

      return song;
    },
    async getPlaylist(input) {
      const normalizedSongs = normalizeManualSongs(input.data, songs);

      return {
        id: input.id,
        name: typeof input.name === "string" ? input.name : "Manual playlist",
        source: "manual",
        raw: input.data ?? songs,
        songs: normalizedSongs,
      };
    },
  };
}

export function createCustomApiSourceAdapter(options: {
  name?: string;
  baseUrl: string;
  playlistPath?: string;
  songPath?: string;
}): NMPv3PlusSourceAdapter {
  const name = options.name ?? "custom-api";
  const playlistPath = options.playlistPath ?? "/playlist";
  const songPath = options.songPath ?? "/song";

  return {
    name,
    priority: 7,
    canHandle(input) {
      return input.source === name || input.source === "custom-api";
    },
    async getSong(input) {
      const id = requireId(input.id, "custom-api song");
      const data = await fetchJson(
        `${joinUrl(options.baseUrl, songPath)}/${encodeURIComponent(id)}`,
      );

      if (!isSongData(data)) {
        throw new Error("NMPv3+ custom-api song response is invalid");
      }

      return normalizeSongData(data, name);
    },
    async getPlaylist(input) {
      const id = requireId(input.id, "custom-api playlist");
      const data = await fetchJson(
        `${joinUrl(options.baseUrl, playlistPath)}/${encodeURIComponent(id)}`,
      );

      if (!isPlaylistData(data)) {
        throw new Error("NMPv3+ custom-api playlist response is invalid");
      }

      return normalizePlaylist(data, name);
    },
  };
}

function isPlaylistData(value: unknown): value is {
  id?: string;
  name?: string;
  songs: Array<Partial<NMPv3PlusSong> & { id: string; name: string }>;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { songs?: unknown }).songs)
  );
}

async function fetchPlaylistData(url: unknown): Promise<unknown> {
  if (!isNonEmptyString(url)) {
    return undefined;
  }

  return fetchJson(url);
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NMPv3+ source request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchNeteaseSongUrl(
  baseUrl: string,
  songId: string,
  level: string,
): Promise<string> {
  const urls = await fetchNeteaseSongUrls(baseUrl, [songId], level);
  const url = urls.get(songId);

  if (!url) {
    // 高音质失败时降级为 standard
    const fallbackUrls = await fetchNeteaseSongUrls(
      baseUrl,
      [songId],
      "standard",
    );
    const fallbackUrl = fallbackUrls.get(songId);

    if (fallbackUrl) {
      return fallbackUrl;
    }

    throw new Error(`NMPv3+ netease song url not available: ${songId}`);
  }

  return url;
}

async function fetchNeteaseSongUrls(
  baseUrl: string,
  songIds: string[],
  level: string,
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(songIds.filter(Boolean)));
  const urls = new Map<string, string>();

  if (uniqueIds.length === 0) {
    return urls;
  }

  const response = await fetchJson<{
    data?: Array<{ id?: number | string; url?: string }>;
  }>(
    buildUrl(baseUrl, "/song/url/v1", {
      id: uniqueIds.join(","),
      level,
    }),
  );

  for (const item of response.data ?? []) {
    if (item.id != null && item.url) {
      urls.set(String(item.id), ensureHttps(item.url));
    }
  }

  return urls;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isSongData(value: unknown): value is Partial<NMPv3PlusSong> & {
  id: string;
  name: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}

function normalizePlaylist(
  value: {
    id?: string;
    name?: string;
    songs: Array<Partial<NMPv3PlusSong> & { id: string; name: string }>;
  },
  source: string,
): NMPv3PlusPlaylist {
  return {
    id: value.id,
    name: value.name,
    source,
    raw: value,
    songs: value.songs.map((song) => normalizeSongData(song, source)),
  };
}

function normalizeNeteaseSong(song: RawNeteaseSong): NMPv3PlusSong {
  const album = song.al ?? song.album;
  const artists = song.ar ?? song.artists ?? [];

  return {
    id: String(song.id),
    name: song.name ?? "Unknown Song",
    artists: artists
      .map((artist) => artist.name)
      .filter(Boolean)
      .join(", "),
    album: album?.name,
    picUrl: song.picUrl ?? album?.picUrl,
    duration: song.duration ?? song.dt,
    source: "netease",
    raw: song,
  };
}

function normalizeManualSongs(
  data: unknown,
  fallback: NMPv3PlusSong[],
): NMPv3PlusSong[] {
  const rawSongs = Array.isArray(data)
    ? data
    : isSongData(data)
      ? [data]
      : fallback;

  return rawSongs
    .filter(isSongData)
    .map((song) => normalizeSongData(song, "manual"));
}

function normalizeSongData(
  song: Partial<NMPv3PlusSong> & { id: string; name: string },
  source: string,
): NMPv3PlusSong {
  return {
    ...song,
    id: String(song.id),
    name: song.name,
    source,
    raw: song,
  };
}

function requireId(id: string | undefined, subject: string): string {
  if (!id) {
    throw new Error(`NMPv3+ ${subject} requires an id`);
  }

  return id;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
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

function ensureHttps(url: string): string {
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}
