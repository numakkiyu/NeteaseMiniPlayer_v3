import { describe, expect, it, vi } from "vitest";
import { NMPv3PlusEventBus } from "./EventBus";

describe("NMPv3PlusEventBus", () => {
  it("runs every handler even when one handler throws", () => {
    const bus = new NMPv3PlusEventBus();
    const first = vi.fn(() => {
      throw new Error("first failed");
    });
    const second = vi.fn();

    bus.on("play", first);
    bus.on("play", second);

    expect(() => bus.emit("play", { ok: true })).toThrow("first failed");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ ok: true });
  });
});
