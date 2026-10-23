import { describe, expect, it, vi } from "vitest";
import type { NMPv3PlusLogger } from "../../../packages/core/src/index";
import { NMPv3PlusRuntime } from "../../../packages/core/src/runtime/NMPv3PlusRuntime";
import { createMyPlugin } from "./index";

const createLogger = (): NMPv3PlusLogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

/** 最小根节点替身，模板插件不碰 DOM，这里只需要能让 Runtime 构造成功 */
const createRoot = () =>
  ({
    dataset: {},
    style: { setProperty: vi.fn(), removeProperty: vi.fn() },
    addEventListener: () => {},
    removeEventListener: () => {},
    append: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    isConnected: true,
    ownerDocument: {
      getElementById: () => null,
      createElement: () => ({
        dataset: {},
        style: { setProperty: vi.fn(), removeProperty: vi.fn() },
        append: () => {},
        remove: () => {},
        addEventListener: () => {},
        setAttribute: () => {},
      }),
      head: { append: () => {} },
    },
  }) as unknown as HTMLElement;

describe("minimal plugin template", () => {
  it("安装后注册命令并打印问候", async () => {
    const logger = createLogger();
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger,
      debug: false,
    });

    await runtime.installPlugin(createMyPlugin({ greeting: "hi" }));

    expect(logger.info).toHaveBeenCalled();
    expect(runtime.commands.has("my-plugin.ping")).toBe(true);
  });

  it("命令返回结果", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createMyPlugin());

    await expect(runtime.commands.execute("my-plugin.ping")).resolves.toEqual({
      ok: true,
    });
  });

  it("卸载后命令被清掉", async () => {
    const runtime = new NMPv3PlusRuntime({
      root: createRoot(),
      logger: createLogger(),
      debug: false,
    });

    await runtime.installPlugin(createMyPlugin());
    await runtime.plugins.uninstall("nmpv3-plus-extension-my-plugin");

    expect(runtime.commands.has("my-plugin.ping")).toBe(false);
  });
});
