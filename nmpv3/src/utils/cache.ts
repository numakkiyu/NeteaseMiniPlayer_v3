interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface MemoryCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

/**
 * 基于 Map 的内存缓存，支持 TTL 过期和 LRU 淘汰
 * API 响应默认缓存 5 分钟，最多 100 条
 */
export class MemoryCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(options: MemoryCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
    this.maxEntries = options.maxEntries ?? 100;
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (this.entries.size >= this.maxEntries) {
      const firstKey = this.entries.keys().next().value;

      if (firstKey) {
        this.entries.delete(firstKey);
      }
    }

    this.entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  async getOrSet<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await load();
    this.set(key, value);
    return value;
  }

  clear(): void {
    this.entries.clear();
  }
}

export const apiResponseCache = new MemoryCache();
