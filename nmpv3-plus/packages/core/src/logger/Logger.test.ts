import { afterEach, describe, expect, it, vi } from "vitest";
import { NMPv3PlusConsoleLogger } from "./Logger";

describe("NMPv3PlusConsoleLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes debug output by default and can be disabled explicitly", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    new NMPv3PlusConsoleLogger().info("ready");
    new NMPv3PlusConsoleLogger(false).info("hidden");

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith("[NMPv3+] ready");
  });
});
