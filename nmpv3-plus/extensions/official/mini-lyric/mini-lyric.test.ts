import { describe, expect, it, vi } from "vitest";
import type { NMPv3PlusLogger } from "../../../packages/core/src/index";
import { NMPv3PlusRuntime } from "../../../packages/core/src/runtime/NMPv3PlusRuntime";
import { createMiniLyricPlugin, findActiveLyricLine } from "./index";

const createLogger = (): NMPv3PlusLogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

/** 最小根节点替身：插槽只需要 createElement / append */
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

describe("findActiveLyricLine", () => {
  const lines = [
    { time: 0, text: "a" },
    { time: 5, text: "b" },
    { time: 12, text: "c" },
    { time: 30, text: "d" },
  ];

  it("返回最后一个 time <= currentTime 的行", () => {
    expect(findActiveLyricLine(lines, 0)?.text).toBe("a");
    expect(findActiveLyricLine(lines, 4.9)?.text).toBe("a");
    expect(findActiveLyricLine(lines, 5)?.text).toBe("b");
    expect(findActiveLyricLine(lines, 20)?.text).toBe("c");
  });

  it("时间超过最后一行时停在最后一行", () => {
    expect(findActiveLyricLine(lines, 999)?.text).toBe("d");
  });

  it("时间早于第一行返回 null", () => {
    expect(findActiveLyricLine([{ time: 5, text: "x" }], 1)).toBeNull();
  });

  it("空歌词或非法时间返回 null", () => {
    expect(findActiveLyricLine([], 10)).toBeNull();
    expect(findActiveLyricLine(lines, Number.NaN)).toBeNull();
    expect(findActiveLyricLine(lines, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("大歌词量下结果与线性扫描一致", () => {
    const big = Array.from({ length: 500 }, (_, index) => ({
      time: index * 2,
      text: `line-${index}`,
    }));

    for (const probe of [0, 1, 99, 100, 500, 998, 999.5]) {
      const expected =
        [...big].reverse().find((line) => line.time <= probe) ?? null;
      expect(findActiveLyricLine(big, probe)?.text).toBe(expected?.text);
    }
  });
});

describe("createMiniLyricPlugin", () => {
  it("注册 overlay 插槽、命令与快捷键", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createMiniLyricPlugin());

    expect(runtime.slots.list()).toContain("overlay");
    expect(runtime.commands.has("mini-lyric.toggle")).toBe(true);
    expect(runtime.shortcuts.list()).toContain("ctrl+shift+l");
  });

  it("可关闭快捷键与自定义按键", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(
      createMiniLyricPlugin({ shortcut: "ctrl+alt+y" }),
    );

    expect(runtime.shortcuts.list()).toContain("ctrl+alt+y");
    expect(runtime.shortcuts.list()).not.toContain("ctrl+shift+l");
  });

  it("命令切换返回新的可见状态", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createMiniLyricPlugin({ visible: true }));

    await expect(runtime.commands.execute("mini-lyric.toggle")).resolves.toBe(
      false,
    );
    await expect(runtime.commands.execute("mini-lyric.toggle")).resolves.toBe(
      true,
    );
  });

  it("卸载后插槽与命令一起清理", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createMiniLyricPlugin());
    await runtime.plugins.uninstall("nmpv3-plus-extension-mini-lyric");

    expect(runtime.commands.has("mini-lyric.toggle")).toBe(false);
    expect(runtime.slots.list()).not.toContain("overlay");
  });
});
