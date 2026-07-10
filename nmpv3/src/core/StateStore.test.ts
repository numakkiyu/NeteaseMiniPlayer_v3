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

  it("disables later writes after localStorage rejects a write", () => {
    const setItem = vi.fn(() => {
      throw new Error("quota exceeded");
    });
    vi.stubGlobal("localStorage", { setItem });
    const store = new StateStore();

    expect(() => store.set("state", { volume: 0.8 })).not.toThrow();
    expect(() => store.set("state", { volume: 0.5 })).not.toThrow();
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
