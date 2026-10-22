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
  /** 正在加载中的 Promise，用于合并同一 key 的并发请求 */
  private readonly inflight = new Map<string, Promise<unknown>>();

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

    // LRU：命中后重排到 Map 末尾（Map 保持插入顺序）
    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    // 已存在的 key 先删除，保证重排到末尾而不是保留旧插入位置
    this.entries.delete(key);

    while (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;

      if (oldestKey === undefined) {
        break;
      }

      this.entries.delete(oldestKey);
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

    // 同一 key 的并发调用共享同一个 in-flight Promise，避免重复请求
    const pending = this.inflight.get(key) as Promise<T> | undefined;

    if (pending) {
      return pending;
    }

    const request = (async () => {
      try {
        const value = await load();
        this.set(key, value);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, request);

    return request;
  }

  clear(): void {
    this.entries.clear();
    this.inflight.clear();
  }
}

export const apiResponseCache = new MemoryCache();
