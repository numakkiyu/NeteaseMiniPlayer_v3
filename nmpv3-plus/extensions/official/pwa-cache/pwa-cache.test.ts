import { afterEach, describe, expect, it, vi } from "vitest";
import { createNMPv3PlusRuntime } from "../../../packages/core/src/index";
import { cacheNMPv3PlusUrls, createPwaCachePlugin } from "./index";

describe("PWA cache extension", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caches unique configured URLs through Cache API", async () => {
    const cache = { addAll: vi.fn(async () => undefined) };
    const cacheStorage = {
      open: vi.fn(async () => cache),
    } as unknown as CacheStorage;

    await expect(
      cacheNMPv3PlusUrls(cacheStorage, "unit-cache", [
        "/a.js",
        "/a.js",
        "/b.css",
      ]),
    ).resolves.toEqual(["/a.js", "/b.css"]);
    expect(cacheStorage.open).toHaveBeenCalledWith("unit-cache");
    expect(cache.addAll).toHaveBeenCalledWith(["/a.js", "/b.css"]);
  });

  it("caches runtime URLs and song assets when installed", async () => {
    const cache = { addAll: vi.fn(async () => undefined) };
    const cacheStorage = {
      open: vi.fn(async () => cache),
    };
    vi.stubGlobal("caches", cacheStorage);
    const runtime = createNMPv3PlusRuntime();

    await runtime.installPlugin(
      createPwaCachePlugin({
        cacheName: "nmp-test",
        urls: ["/dist/index.js"],
      }),
    );
    runtime.emit("songchange", {
      picUrl: "/covers/a.jpg",
      url: "/music/a.mp3",
    });
    await Promise.resolve();

    expect(cache.addAll).toHaveBeenCalledWith(["/dist/index.js"]);
    expect(cache.addAll).toHaveBeenCalledWith([
      "/covers/a.jpg",
      "/music/a.mp3",
    ]);
  });

  it("warns without failing when Cache API is unavailable", async () => {
    const warn = vi.fn();
    const runtime = createNMPv3PlusRuntime({
      logger: {
        info: vi.fn(),
        warn,
        error: vi.fn(),
      },
    });

    await runtime.installPlugin(createPwaCachePlugin());

    expect(warn).toHaveBeenCalledWith(
      "PWA cache extension requires the Cache API.",
    );
  });
});
