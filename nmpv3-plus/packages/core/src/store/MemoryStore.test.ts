import { describe, expect, it, vi } from "vitest";
import { NMPv3PlusMemoryStore } from "./MemoryStore";

describe("NMPv3PlusMemoryStore", () => {
  it("notifies subscribers when a key changes or is deleted", () => {
    const store = new NMPv3PlusMemoryStore();
    const subscriber = vi.fn();
    const unsubscribe = store.subscribe<string>("mode", subscriber);

    store.set("mode", "bars");
    store.set("mode", "wave");
    store.delete("mode");
    unsubscribe();
    store.set("mode", "ambient");

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber).toHaveBeenNthCalledWith(1, "bars", undefined);
    expect(subscriber).toHaveBeenNthCalledWith(2, "wave", "bars");
    expect(subscriber).toHaveBeenNthCalledWith(3, undefined, "wave");
  });
});
