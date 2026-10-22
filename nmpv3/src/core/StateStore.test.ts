import { afterEach, describe, expect, it, vi } from "vitest";
import { StateStore } from "./StateStore";

describe("StateStore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back when localStorage reads are blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    });

    expect(new StateStore().get("state", { volume: 0.8 })).toEqual({
      volume: 0.8,
    });
  });

  it("retries localStorage on the next write after a rejected write", () => {
    const setItem = vi.fn(() => {
      throw new Error("quota exceeded");
    });
    vi.stubGlobal("localStorage", { setItem });
    const store = new StateStore();

    expect(() => store.set("state", { volume: 0.8 })).not.toThrow();
    expect(() => store.set("state", { volume: 0.5 })).not.toThrow();
    // 不再永久熔断：每次写入都会重新尝试 localStorage
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it("keeps rejected writes readable through the in-memory fallback", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
    });
    const store = new StateStore();

    store.set("state", { volume: 0.42 });

    expect(store.get("state", { volume: 0.8 })).toEqual({ volume: 0.42 });
  });

  it("persists again once localStorage recovers", () => {
    const setItem = vi.fn();
    const store = new StateStore();

    vi.stubGlobal("localStorage", {
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
    });
    store.set("state", { volume: 0.3 });

    vi.stubGlobal("localStorage", { setItem });
    store.set("state", { volume: 0.9 });

    expect(setItem).toHaveBeenCalledWith(
      "nmpv3:state",
      JSON.stringify({ volume: 0.9 }),
    );
  });

  it("removes a stored key without leaving a residual entry", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
    });
    const store = new StateStore();

    store.set("progress:42", 128);
    expect(store.get("progress:42", 0)).toBe(128);

    store.remove("progress:42");

    expect(storage.has("nmpv3:progress:42")).toBe(false);
    expect(store.get("progress:42", 0)).toBe(0);
  });
});
