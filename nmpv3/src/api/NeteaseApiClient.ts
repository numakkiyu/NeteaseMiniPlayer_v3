import type { NeteaseLyricResponse, NeteaseSongResponse } from "./types";
import { DEFAULT_API_BASE_URL } from "../config/constants";
import type { NMPv3Playlist, NMPv3Song } from "../types";
import { apiResponseCache } from "../utils/cache";
import { getWindow } from "../utils/env";

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
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`NMPv3 API request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    });
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
