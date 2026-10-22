import type { NeteaseLyricResponse, NeteaseSongResponse } from "./types";
import { DEFAULT_API_BASE_URL } from "../config/constants";
import type { NMPv3Playlist, NMPv3Song } from "../types";
import { apiResponseCache } from "../utils/cache";
import { getWindow } from "../utils/env";

interface RawNeteaseArtist {
  name?: string;
}

/** 单次 API 请求超时（毫秒），代理挂起时避免 UI 永久停留在 loading */
const REQUEST_TIMEOUT_MS = 10_000;

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

/**
 * 网易云音乐 API 客户端
 * 所有 GET 请求均经过内存缓存（默认 5 分钟 TTL），避免频繁请求
 */
export class NeteaseApiClient {
  constructor(private readonly baseUrl = DEFAULT_API_BASE_URL) {}

  async getSong(songId: string): Promise<NMPv3Song> {
    const response = await this.getJson<{ songs?: RawNeteaseSong[] }>(
      "/song/detail",
      { ids: songId },
    );
    const song = response.songs?.[0];

    if (!song) {
      throw new Error(`NMPv3 song not found: ${songId}`);
    }

    return this.withSongUrl(normalizeSong(song));
  }

  async getPlaylist(playlistId: string): Promise<NMPv3Playlist> {
    const response = await this.getJson<{ songs?: RawNeteaseSong[] }>(
      "/playlist/track/all",
      {
        id: playlistId,
        limit: "1000",
        offset: "0",
      },
    );
    const songs = response.songs?.map((song) => normalizeSong(song)) ?? [];

    return {
      id: playlistId,
      songs,
    };
  }

  async getLyrics(songId: string): Promise<NeteaseLyricResponse> {
    return this.getJson<NeteaseLyricResponse>("/lyric", { id: songId });
  }

  async getSongUrl(songId: string, level = "exhigh"): Promise<string> {
    const response = await this.getJson<{ data?: Array<{ url?: string }> }>(
      "/song/url/v1",
      { id: songId, level },
    );
    const url = response.data?.find((item) => item.url)?.url;

    if (!url) {
      throw new Error(`NMPv3 song url not available: ${songId}`);
    }

    return ensureHttps(url);
  }

  private async withSongUrl(song: NMPv3Song): Promise<NMPv3Song> {
    try {
      return {
        ...song,
        url: await this.getSongUrl(song.id),
      };
    } catch {
      // exhigh 音质不可用时降级为 standard
      return {
        ...song,
        url: await this.getSongUrl(song.id, "standard"),
      };
    }
  }

  private async getJson<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error(
        "NMPv3 apiBaseUrl is empty. Set api-base-url on <nmp-player>, define window.NMPv3Config before loading the bundle, or call NMPv3.setApiBaseUrl(url).",
      );
    }

    const url = new URL(
      `${this.baseUrl.replace(/\/$/, "")}${path}`,
      getWindow()?.location.href ?? "http://localhost/",
    );
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );

    return apiResponseCache.getOrSet(url.toString(), async () => {
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`NMPv3 API request failed: ${response.status}`);
      }

      try {
        return (await response.json()) as T;
      } catch {
        // 代理返回 HTML 错误页等非 JSON 内容时，给出可读提示而非裸 SyntaxError
        throw new Error(
          "NMPv3 API response is not valid JSON. Check that apiBaseUrl points to a Netease API proxy.",
        );
      }
    });
  }

  /** 带超时与一次重试的 fetch，避免代理挂起时无限等待 */
  private async fetchWithRetry(url: URL): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.fetchOnce(url);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("NMPv3 API request failed");
  }

  private async fetchOnce(url: URL): Promise<Response> {
    const browserWindow = getWindow();
    const controller =
      typeof AbortController === "undefined" ? null : new AbortController();
    const timer = controller
      ? browserWindow?.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      : null;

    try {
      return await fetch(
        url,
        controller ? { signal: controller.signal } : undefined,
      );
    } catch (error) {
      if (controller?.signal.aborted) {
        throw new Error(
          `NMPv3 API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
        );
      }

      throw error;
    } finally {
      if (timer != null) {
        browserWindow?.clearTimeout(timer);
      }
    }
  }
}

function normalizeSong(song: RawNeteaseSong | NeteaseSongResponse): NMPv3Song {
  const rawSong = song as RawNeteaseSong;
  const album = rawSong.al ?? rawSong.album;
  const artists = rawSong.ar ?? rawSong.artists ?? [];

  return {
    id: String(rawSong.id),
    name: rawSong.name ?? "Unknown Song",
    artists: artists
      .map((artist) => artist.name)
      .filter(Boolean)
      .join(", "),
    album: album?.name,
    picUrl: rawSong.picUrl ?? album?.picUrl,
    duration: rawSong.duration ?? rawSong.dt,
    url: (song as NeteaseSongResponse).url,
  };
}

function ensureHttps(url: string): string {
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}
