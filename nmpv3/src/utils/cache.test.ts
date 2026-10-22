import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "./cache";

describe("MemoryCache", () => {
  it("returns cached values within the TTL", async () => {
    const cache = new MemoryCache();
    const load = vi.fn(async () => "value");

    await expect(cache.getOrSet("key", load)).resolves.toBe("value");
    await expect(cache.getOrSet("key", load)).resolves.toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent requests for the same key", async () => {
    const cache = new MemoryCache();
    let resolveLoad: (value: string) => void = () => {};
    const load = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const first = cache.getOrSet("key", load);
    const second = cache.getOrSet("key", load);
    const third = cache.getOrSet("key", load);

    expect(load).toHaveBeenCalledTimes(1);

    resolveLoad("shared");

    await expect(Promise.all([first, second, third])).resolves.toEqual([
      "shared",
      "shared",
      "shared",
    ]);
  });

  it("retries after a rejected load instead of caching the failure", async () => {
    const cache = new MemoryCache();
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce("recovered");

    await expect(cache.getOrSet("key", load)).rejects.toThrow("network");
    await expect(cache.getOrSet("key", load)).resolves.toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("evicts the least recently used entry, not the oldest inserted", () => {
    const cache = new MemoryCache({ maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    // 命中 a 使其成为最近使用，b 成为最久未使用
    expect(cache.get("a")).toBe(1);

    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("expires entries after the TTL", () => {
    vi.useFakeTimers();
    const cache = new MemoryCache({ ttlMs: 1000 });

    try {
      cache.set("key", "value");
      vi.advanceTimersByTime(1001);

      expect(cache.get("key")).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
