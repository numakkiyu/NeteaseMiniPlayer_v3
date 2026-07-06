import type {
  NMPv3PlusPlugin,
  NMPv3PlusSong,
} from "../../../packages/core/src/index";

export interface NMPv3PlusPwaCacheOptions {
  cacheName?: string;
  urls?: string[];
  cacheSongAssets?: boolean;
}

export async function cacheNMPv3PlusUrls(
  cacheStorage: CacheStorage,
  cacheName: string,
  urls: string[],
): Promise<string[]> {
  const cleanUrls = Array.from(new Set(urls.filter(Boolean)));

  if (cleanUrls.length === 0) {
    return [];
  }

  const cache = await cacheStorage.open(cacheName);
  await cache.addAll(cleanUrls);
  return cleanUrls;
}

export function createPwaCachePlugin(
  options: NMPv3PlusPwaCacheOptions = {},
): NMPv3PlusPlugin {
  const cacheName = options.cacheName ?? "nmpv3-plus-cache-v1";
  const urls = options.urls ?? [];
  const cacheSongAssets = options.cacheSongAssets ?? true;

  return {
    name: "nmpv3-plus-extension-pwa-cache",
    version: "1.0.0",
    async setup(ctx) {
      const cacheStorage = globalThis.caches;

      if (!cacheStorage) {
        ctx.logger.warn("PWA cache extension requires the Cache API.");
        return undefined;
      }

      await cacheNMPv3PlusUrls(cacheStorage, cacheName, urls);

      if (!cacheSongAssets) {
        return undefined;
      }

      const stopSongChange = ctx.on<Partial<NMPv3PlusSong>>(
        "songchange",
        (song) => {
          // 自动缓存当前歌曲的封面和音频 URL
          const songUrls = [song.picUrl, song.url].filter(
            (url): url is string => Boolean(url),
          );

          void cacheNMPv3PlusUrls(cacheStorage, cacheName, songUrls).catch(
            (error: unknown) => {
              ctx.logger.warn("Failed to cache NMPv3+ song assets", error);
            },
          );
        },
      );

      return () => stopSongChange();
    },
  };
}
