import { describe, expect, it, vi } from "vitest";
import type { NMPv3PlusLogger } from "../types";
import {
  NMPv3PlusCommandRegistry,
  NMPv3PlusShortcutRegistry,
  parseShortcut,
} from "./CommandRegistry";

const createLogger = (): NMPv3PlusLogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("parseShortcut", () => {
  it("解析单键", () => {
    expect(parseShortcut("k")).toEqual({
      key: "k",
      ctrl: false,
      meta: false,
      alt: false,
      shift: false,
    });
  });

  it("解析组合键并统一小写", () => {
    expect(parseShortcut("Ctrl+Shift+K")).toEqual({
      key: "k",
      ctrl: true,
      meta: false,
      alt: false,
      shift: true,
    });
  });

  it("识别 cmd / option 别名", () => {
    expect(parseShortcut("cmd+option+p")).toEqual({
      key: "p",
      ctrl: false,
      meta: true,
      alt: true,
      shift: false,
    });
  });

  it("空串与只有修饰键的写法返回 null", () => {
    expect(parseShortcut("")).toBeNull();
    expect(parseShortcut("   ")).toBeNull();
    expect(parseShortcut("ctrl+")).toBeNull();
  });

  it("未知修饰键返回 null 而不是猜一个", () => {
    expect(parseShortcut("hyper+k")).toBeNull();
  });
});

describe("NMPv3PlusCommandRegistry", () => {
  it("注册后可通过 id 执行", async () => {
    const registry = new NMPv3PlusCommandRegistry(createLogger());
    const handler = vi.fn((arg?: unknown) => `got:${String(arg)}`);

    registry.register({ id: "demo.echo", handler });

    await expect(registry.execute("demo.echo", 1)).resolves.toBe("got:1");
    expect(handler).toHaveBeenCalledWith(1);
  });

  it("重复注册同一 id 抛错", () => {
    const registry = new NMPv3PlusCommandRegistry(createLogger());
    registry.register({ id: "demo.a", handler: vi.fn() });

    expect(() => registry.register({ id: "demo.a", handler: vi.fn() })).toThrow(
      /already registered/,
    );
  });

  it("缺少 id 或 handler 时注册失败", () => {
    const registry = new NMPv3PlusCommandRegistry(createLogger());

    expect(() => registry.register({ id: " ", handler: vi.fn() })).toThrow(
      /id is required/,
    );
    expect(() =>
      registry.register({
        id: "demo.b",
        handler: undefined as unknown as () => void,
      }),
    ).toThrow(/must be a function/);
  });

  it("注销后不再可执行", async () => {
    const registry = new NMPv3PlusCommandRegistry(createLogger());
    const dispose = registry.register({ id: "demo.c", handler: vi.fn() });

    dispose();

    await expect(registry.execute("demo.c")).rejects.toThrow(/not found/);
  });

  it("executeSafe 吞掉错误只记日志", async () => {
    const logger = createLogger();
    const registry = new NMPv3PlusCommandRegistry(logger);

    registry.register({
      id: "demo.boom",
      handler: () => {
        throw new Error("boom");
      },
    });

    await expect(registry.executeSafe("demo.boom")).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it("list 返回 id 与标题，且不暴露内部引用", () => {
    const registry = new NMPv3PlusCommandRegistry(createLogger());
    registry.register({ id: "demo.d", title: "D", handler: vi.fn() });

    const list = registry.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("demo.d");
    expect(list[0].title).toBe("D");
  });
});

describe("NMPv3PlusShortcutRegistry", () => {
  const createEventTarget = () => {
    const listeners = new Map<string, Set<(event: KeyboardEvent) => void>>();
    return {
      addEventListener: (
        type: string,
        handler: (event: KeyboardEvent) => void,
      ) => {
        if (!listeners.has(type)) {
          listeners.set(type, new Set());
        }
        listeners.get(type)!.add(handler);
      },
      removeEventListener: (
        type: string,
        handler: (event: KeyboardEvent) => void,
      ) => {
        listeners.get(type)?.delete(handler);
      },
      dispatch: (event: KeyboardEvent) => {
        listeners.get("keydown")?.forEach((handler) => handler(event));
      },
      size: () => listeners.get("keydown")?.size ?? 0,
    };
  };

  const keydown = (init: Partial<KeyboardEvent>): KeyboardEvent =>
    ({
      key: "k",
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      defaultPrevented: false,
      target: null,
      preventDefault: vi.fn(),
      ...init,
    }) as unknown as KeyboardEvent;

  it("匹配组合键后触发并阻止默认行为", () => {
    const target = createEventTarget();
    const registry = new NMPv3PlusShortcutRegistry(createLogger());
    const handler = vi.fn();

    registry.attach(target as unknown as HTMLElement);
    registry.register({ keys: "ctrl+k", handler });

    const event = keydown({ ctrlKey: true });
    target.dispatch(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("修饰键不匹配时不触发", () => {
    const target = createEventTarget();
    const registry = new NMPv3PlusShortcutRegistry(createLogger());
    const handler = vi.fn();

    registry.attach(target as unknown as HTMLElement);
    registry.register({ keys: "ctrl+k", handler });

    target.dispatch(keydown({ shiftKey: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("输入框内默认不触发", () => {
    const target = createEventTarget();
    const registry = new NMPv3PlusShortcutRegistry(createLogger());
    const handler = vi.fn();

    registry.attach(target as unknown as HTMLElement);
    registry.register({ keys: "k", handler });

    const input = { tagName: "INPUT", isContentEditable: false };
    target.dispatch(keydown({ target: input as unknown as EventTarget }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("allowInEditable 时输入框内也触发", () => {
    const target = createEventTarget();
    const registry = new NMPv3PlusShortcutRegistry(createLogger());
    const handler = vi.fn();

    registry.attach(target as unknown as HTMLElement);
    registry.register({ keys: "k", handler, allowInEditable: true });

    const input = { tagName: "INPUT", isContentEditable: false };
    target.dispatch(keydown({ target: input as unknown as EventTarget }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("无法解析的绑定被忽略并记日志", () => {
    const logger = createLogger();
    const registry = new NMPv3PlusShortcutRegistry(logger);
    const dispose = registry.register({ keys: "hyper+x", handler: vi.fn() });

    expect(logger.warn).toHaveBeenCalled();
    expect(registry.list()).toHaveLength(0);
    expect(() => dispose()).not.toThrow();
  });

  it("处理函数抛错不影响后续绑定", () => {
    const target = createEventTarget();
    const logger = createLogger();
    const registry = new NMPv3PlusShortcutRegistry(logger);
    const second = vi.fn();

    registry.attach(target as unknown as HTMLElement);
    registry.register({
      keys: "k",
      handler: () => {
        throw new Error("boom");
      },
    });
    registry.register({ keys: "j", handler: second });

    expect(() => target.dispatch(keydown({ key: "k" }))).not.toThrow();
    target.dispatch(keydown({ key: "j" }));

    expect(logger.error).toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("目标缺少 addEventListener 时不抛错", () => {
    const registry = new NMPv3PlusShortcutRegistry(createLogger());

    expect(() => registry.attach({} as unknown as HTMLElement)).not.toThrow();
    expect(registry.list()).toHaveLength(0);
  });
});
