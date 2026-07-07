import { describe, expect, it, vi } from "vitest";
import { NMPv3PlusEventBus } from "../event/EventBus";
import { NMPv3PlusMemoryStore } from "../store/MemoryStore";
import type { NMPv3PlusLogger, NMPv3PlusPluginContext } from "../types";
import {
  defineNMPv3PlusPlugin,
  NMPv3PlusPluginManager,
  sortPluginsByDependencies,
} from "./PluginManager";

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

    await expect(manager.uninstall("test-plugin")).resolves.toBe(true);
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

  it("sorts plugin install order by dependency declarations", async () => {
    const ordered = sortPluginsByDependencies([
      {
        name: "visualizer",
        version: "1.0.0",
        dependencies: {
          "cover-color": ">=1.0.0",
        },
        setup() {},
      },
      {
        name: "cover-color",
        version: "1.0.0",
        setup() {},
      },
    ]);

    expect(ordered.map((plugin) => plugin.name)).toEqual([
      "cover-color",
      "visualizer",
    ]);
  });

  it("rolls back an installAll batch when a later plugin fails", async () => {
    const cleanupBase = vi.fn(async () => {});
    const cleanupMiddle = vi.fn();
    const logger = createSilentLogger();
    const manager = new NMPv3PlusPluginManager(
      () => ({ root: null, logger }) as NMPv3PlusPluginContext,
      logger,
    );

    await expect(
      manager.installAll([
        {
          name: "base",
          version: "1.0.0",
          setup() {
            return cleanupBase;
          },
        },
        {
          name: "middle",
          version: "1.0.0",
          dependencies: { base: "^1.0.0" },
          setup() {
            return cleanupMiddle;
          },
        },
        {
          name: "broken",
          version: "1.0.0",
          dependencies: { middle: "~1.0.0" },
          setup() {
            throw new Error("broken setup");
          },
        },
      ]),
    ).rejects.toThrow("broken setup");

    expect(cleanupMiddle).toHaveBeenCalledTimes(1);
    expect(cleanupBase).toHaveBeenCalledTimes(1);
    expect(manager.list()).toHaveLength(0);
  });

  it("rejects dependency cycles and unsatisfied direct installs", async () => {
    expect(() =>
      sortPluginsByDependencies([
        {
          name: "a",
          dependencies: { b: "*" },
          setup() {},
        },
        {
          name: "b",
          dependencies: { a: "*" },
          setup() {},
        },
      ]),
    ).toThrow("NMPv3+ plugin dependency cycle");

    const logger = createSilentLogger();
    const manager = new NMPv3PlusPluginManager(
      () => ({ root: null, logger }) as NMPv3PlusPluginContext,
      logger,
    );

    await expect(
      manager.install({
        name: "needs-host",
        dependencies: {
          "host-sync": ">=1.0.0",
        },
        setup() {},
      }),
    ).rejects.toThrow(
      "NMPv3+ plugin dependency not installed: needs-host requires host-sync@>=1.0.0",
    );
  });

  it("rejects dependencies that were installed but failed setup", async () => {
    const logger = createSilentLogger();
    const manager = new NMPv3PlusPluginManager(
      () => ({ root: null, logger }) as NMPv3PlusPluginContext,
      logger,
    );

    await expect(
      manager.install({
        name: "failed-base",
        version: "1.0.0",
        setup() {
          throw new Error("setup failed");
        },
      }),
    ).rejects.toThrow("setup failed");

    await expect(
      manager.install({
        name: "dependent",
        dependencies: { "failed-base": "^1.0.0" },
        setup() {},
      }),
    ).rejects.toThrow(
      "NMPv3+ plugin dependency is not ready: dependent requires failed-base@^1.0.0",
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
