import { describe, expect, it, vi } from "vitest";
import type {
  NMPv3PlusLogger,
  NMPv3PlusPlayerLike,
} from "../../../packages/core/src/index";
import { NMPv3PlusRuntime } from "../../../packages/core/src/runtime/NMPv3PlusRuntime";
import { createToolbarActionsPlugin } from "./index";

const createLogger = (): NMPv3PlusLogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

/**
 * 最小可用的播放器替身
 *
 * 只实现插件关心的读写配置能力，其余方法缺省。
 */
const createPlayer = (initial: Record<string, unknown> = {}) => {
  let config: Record<string, unknown> = { palette: "dawn", scale: 5, ...initial };
  const player: NMPv3PlusPlayerLike = {
    getConfig: () => ({ ...config }),
    updateConfig: vi.fn(async (patch: Record<string, unknown>) => {
      config = { ...config, ...patch };
    }),
  };

  return {
    player,
    read: () => ({ ...config }),
  };
};

/** 造一个够用的根节点：只需要 createElement / append / querySelector */
const createRoot = () => {
  const children: any[] = [];

  const makeElement = (tag: string): any => {
    const element: any = {
      tagName: tag.toUpperCase(),
      children: [] as any[],
      dataset: {} as Record<string, string>,
      style: {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        getPropertyValue: vi.fn(() => ""),
      },
      classList: { add: vi.fn(), remove: vi.fn() },
      ownerDocument: null as any,
      append: (...nodes: any[]) => {
        element.children.push(...nodes);
      },
      remove: () => {},
      querySelector: (selector: string) => {
        for (const child of element.children) {
          if (selector.startsWith("[data-") && child.dataset) {
            const key = selector.slice(9, -2);
            if (key in child.dataset) {
              return child;
            }
          }
          if (selector.startsWith(".") && child.className === selector.slice(1)) {
            return child;
          }
          const nested = child.querySelector?.(selector);
          if (nested) {
            return nested;
          }
        }
        return null;
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      get isConnected() {
        return true;
      },
    };

    return element;
  };

  const doc = {
    createElement: (tag: string) => {
      const element = makeElement(tag);
      element.ownerDocument = doc;
      return element;
    },
    head: makeElement("head"),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  const root = makeElement("div");
  root.ownerDocument = doc;
  root.children = children;
  root.appendChild = root.append;

  return { root, doc };
};

describe("toolbar-actions 样板插件", () => {
  it("安装后注册插槽、命令与快捷键", async () => {
    const logger = createLogger();
    const { player } = createPlayer();
    const { root } = createRoot();

    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger,
      debug: false,
    });

    await runtime.installPlugin(createToolbarActionsPlugin());

    expect(runtime.slots.list()).toContain("toolbar");
    expect(runtime.commands.has("toolbar-actions.cyclePalette")).toBe(true);
    expect(runtime.commands.has("toolbar-actions.setScale")).toBe(true);
    expect(runtime.shortcuts.list()).toContain("ctrl+shift+p");
  });

  it("命令能改播放器配色并跳过固定色板", async () => {
    const { player, read } = createPlayer({ palette: "dawn" });
    const { root } = createRoot();
    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createToolbarActionsPlugin());
    await runtime.commands.execute("toolbar-actions.cyclePalette");

    expect(read().palette).toBe("jade");
    expect(read().paletteFollowHost).toBe(false);
  });

  it("缩放命令把档位限制在 1-10", async () => {
    const { player, read } = createPlayer({ scale: 10 });
    const { root } = createRoot();
    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createToolbarActionsPlugin());

    await runtime.commands.execute("toolbar-actions.setScale", 99);
    expect(read().scale).toBe(10);

    await runtime.commands.execute("toolbar-actions.setScale", -3);
    expect(read().scale).toBe(1);

    await runtime.commands.execute("toolbar-actions.setScale", 6.4);
    expect(read().scale).toBe(6);
  });

  it("色板循环能绕回第一位", async () => {
    const { player, read } = createPlayer({ palette: "mono" });
    const { root } = createRoot();
    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createToolbarActionsPlugin());
    await runtime.commands.execute("toolbar-actions.cyclePalette");

    expect(read().palette).toBe("dawn");
  });

  it("可以关掉快捷键注册", async () => {
    const { player } = createPlayer();
    const { root } = createRoot();
    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(
      createToolbarActionsPlugin({ shortcuts: false }),
    );

    expect(runtime.shortcuts.list()).not.toContain("ctrl+shift+p");
  });

  it("卸载后命令与插槽一起清掉", async () => {
    const { player } = createPlayer();
    const { root } = createRoot();
    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createToolbarActionsPlugin());
    expect(runtime.commands.has("toolbar-actions.cyclePalette")).toBe(true);

    await runtime.plugins.uninstall("official-toolbar-actions");

    expect(runtime.commands.has("toolbar-actions.cyclePalette")).toBe(false);
    expect(runtime.slots.list()).not.toContain("toolbar");
  });

  it("自定义色板顺序生效", async () => {
    const { player, read } = createPlayer({ palette: "a" });
    const { root } = createRoot();
    const runtime = new NMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
      player,
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(
      createToolbarActionsPlugin({ palettes: ["a", "b", "c"] }),
    );
    await runtime.commands.execute("toolbar-actions.cyclePalette");

    expect(read().palette).toBe("b");
  });
});
