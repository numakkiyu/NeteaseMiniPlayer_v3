import { describe, expect, it, vi } from "vitest";
import { NMPv3PlusEventBus } from "../event/EventBus";
import { NMPv3PlusMemoryStore } from "../store/MemoryStore";
import type { NMPv3PlusLogger, NMPv3PlusPluginContext } from "../types";
import { defineNMPv3PlusPlugin, NMPv3PlusPluginManager } from "./PluginManager";

describe("NMPv3PlusPluginManager", () => {
  it("installs a plugin with a real context and runs cleanup on uninstall", async () => {
    const events = new NMPv3PlusEventBus();
    const cleanup = vi.fn();
    const logger = createSilentLogger();
    const plugin = defineNMPv3PlusPlugin({
      name: "test-plugin",
      setup(ctx) {
        ctx.store.set("plugin-ready", true);
        ctx.emit("plugin:setup", { ok: true });
        return cleanup;
      },
    });
    const store = new NMPv3PlusMemoryStore();
    let emitted = false;
    events.on("plugin:setup", () => {
      emitted = true;
    });
    const manager = new NMPv3PlusPluginManager(
      () =>
        ({
          root: null,
          player: null,
          audio: null,
          api: null,
          store,
          source: {
            loadSong: vi.fn(),
            loadPlaylist: vi.fn(),
            register: vi.fn(),
          },
          lyrics: {
            getLyrics: vi.fn(),
            register: vi.fn(),
          },
          on: events.on.bind(events),
          emit: events.emit.bind(events),
          getPart: vi.fn(),
          setToken: vi.fn(),
          logger,
        }) as NMPv3PlusPluginContext,
      logger,
    );

    await manager.install(plugin);

    expect(manager.list()).toHaveLength(1);
    expect(store.get("plugin-ready", false)).toBe(true);
    expect(emitted).toBe(true);

    expect(manager.uninstall("test-plugin")).toBe(true);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(manager.list()).toHaveLength(0);
  });

  it("rejects duplicate plugin names", async () => {
    const logger = createSilentLogger();
    const plugin = defineNMPv3PlusPlugin({
      name: "duplicate",
      setup() {
        return undefined;
      },
    });
    const manager = new NMPv3PlusPluginManager(
      () => ({ root: null, logger }) as NMPv3PlusPluginContext,
      logger,
    );

    await manager.install(plugin);

    await expect(manager.install(plugin)).rejects.toThrow(
      "NMPv3+ plugin already installed: duplicate",
    );
  });
});

function createSilentLogger(): NMPv3PlusLogger {
  return {
    info() {},
    warn() {},
    error() {},
  };
}
