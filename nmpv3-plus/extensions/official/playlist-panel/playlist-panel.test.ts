import { describe, expect, it, vi } from "vitest";
import type { NMPv3PlusLogger } from "../../../packages/core/src/index";
import { NMPv3PlusRuntime } from "../../../packages/core/src/runtime/NMPv3PlusRuntime";
import { createPlaylistPanelPlugin } from "./index";

const createLogger = (): NMPv3PlusLogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createRoot = () => {
  const makeElement = () => {
    const element = {
      children: [] as unknown[],
      dataset: {} as Record<string, string>,
      className: "",
      textContent: "",
      style: { setProperty: vi.fn(), removeProperty: vi.fn() },
      ownerDocument: null as unknown,
      append: (...nodes: unknown[]) => {
        element.children.push(...nodes);
      },
      remove: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      isConnected: true,
    };
    return element;
  };

  const doc = {
    getElementById: () => null,
    createElement: () => {
      const element = makeElement();
      element.ownerDocument = doc;
      return element;
    },
    head: makeElement(),
  };

  const root = makeElement();
  root.ownerDocument = doc;
  return root as unknown as HTMLElement;
};

describe("createPlaylistPanelPlugin", () => {
  it("注册 panel 插槽、命令与快捷键", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createPlaylistPanelPlugin());

    expect(runtime.slots.list()).toContain("panel");
    expect(runtime.commands.has("playlist-panel.toggle")).toBe(true);
    expect(runtime.commands.has("playlist-panel.playIndex")).toBe(true);
    expect(runtime.shortcuts.list()).toContain("ctrl+shift+o");
  });

  it("toggle 命令翻转展开状态", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createPlaylistPanelPlugin({ open: false }));

    await expect(
      runtime.commands.execute("playlist-panel.toggle"),
    ).resolves.toBe(true);
    await expect(
      runtime.commands.execute("playlist-panel.toggle"),
    ).resolves.toBe(false);
  });

  it("切歌命令在歌单为空时安全无事", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createPlaylistPanelPlugin());

    // 没有播放器也没有歌单，命令不应该抛错
    await expect(
      runtime.commands.execute("playlist-panel.playIndex", 2),
    ).resolves.toBeUndefined();
  });

  it("emits playlistchange 后不抛错", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createPlaylistPanelPlugin());

    expect(() =>
      runtime.emit("playlistchange", {
        playlist: {
          songs: [
            { id: "1", name: "A" },
            { id: "2", name: "B" },
          ],
        },
      }),
    ).not.toThrow();
  });

  it("可自定义显示上限与快捷键", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(
      createPlaylistPanelPlugin({ limit: 5, shortcut: "ctrl+alt+l" }),
    );

    expect(runtime.shortcuts.list()).toContain("ctrl+alt+l");
    expect(runtime.shortcuts.list()).not.toContain("ctrl+shift+o");
  });

  it("卸载后命令与插槽一起清理", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createPlaylistPanelPlugin());
    await runtime.plugins.uninstall("nmpv3-plus-extension-playlist-panel");

    expect(runtime.commands.has("playlist-panel.toggle")).toBe(false);
    expect(runtime.slots.list()).not.toContain("panel");
  });
});
