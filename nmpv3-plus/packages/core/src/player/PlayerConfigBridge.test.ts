import { describe, expect, it, vi } from "vitest";
import type { NMPv3PlusPlayerLike } from "../types";
import {
  PLAYER_CONFIG_EVENT,
  createPlayerConfigChannel,
  patchPlayerConfig,
  readPlayerConfig,
  supportsPlayerConfig,
} from "./PlayerConfigBridge";

const createPlayer = (
  overrides: Partial<NMPv3PlusPlayerLike> = {},
): NMPv3PlusPlayerLike => ({
  getConfig: () => ({ palette: "jade", scale: 5 }),
  updateConfig: vi.fn(async () => {}),
  ...overrides,
});

describe("readPlayerConfig", () => {
  it("读取并复制快照，避免调用方改到播放器内部对象", () => {
    const internal = { palette: "jade" };
    const player = createPlayer({ getConfig: () => internal });

    const snapshot = readPlayerConfig(player);
    snapshot.palette = "iris";

    expect(internal.palette).toBe("jade");
  });

  it("播放器不支持时返回空对象而不是抛错", () => {
    expect(readPlayerConfig(null)).toEqual({});
    expect(readPlayerConfig({} as NMPv3PlusPlayerLike)).toEqual({});
  });

  it("getConfig 抛错时降级为空对象", () => {
    const player = createPlayer({
      getConfig: () => {
        throw new Error("boom");
      },
    });

    expect(readPlayerConfig(player)).toEqual({});
  });

  it("返回非对象时也不崩", () => {
    const player = createPlayer({
      getConfig: () => "oops" as unknown as Record<string, unknown>,
    });

    expect(readPlayerConfig(player)).toEqual({});
  });
});

describe("patchPlayerConfig", () => {
  it("转发配置补丁", async () => {
    const updateConfig = vi.fn(async () => {});
    const player = createPlayer({ updateConfig });

    await expect(patchPlayerConfig(player, { volume: 0.5 })).resolves.toBe(true);
    expect(updateConfig).toHaveBeenCalledWith({ volume: 0.5 });
  });

  it("空补丁不触发写入", async () => {
    const updateConfig = vi.fn(async () => {});
    const player = createPlayer({ updateConfig });

    await expect(patchPlayerConfig(player, {})).resolves.toBe(true);
    expect(updateConfig).not.toHaveBeenCalled();
  });

  it("播放器不支持时返回 false", async () => {
    await expect(patchPlayerConfig(null, { volume: 1 })).resolves.toBe(false);
  });

  it("写入抛错时返回 false 而不冒泡", async () => {
    const player = createPlayer({
      updateConfig: async () => {
        throw new Error("boom");
      },
    });

    await expect(patchPlayerConfig(player, { volume: 1 })).resolves.toBe(false);
  });
});

describe("supportsPlayerConfig", () => {
  it("同时具备读写才算支持", () => {
    expect(supportsPlayerConfig(createPlayer())).toBe(true);
    expect(supportsPlayerConfig(createPlayer({ getConfig: undefined }))).toBe(
      false,
    );
    expect(supportsPlayerConfig(null)).toBe(false);
  });
});

describe("createPlayerConfigChannel", () => {
  it("get 实时读取最新配置", () => {
    let config: Record<string, unknown> = { palette: "dawn" };
    const channel = createPlayerConfigChannel({
      getPlayer: () => createPlayer({ getConfig: () => config }),
    });

    expect(channel.get().palette).toBe("dawn");
    config = { palette: "amber" };
    expect(channel.get().palette).toBe("amber");
  });

  it("patch 成功后通知订阅者", async () => {
    const updateConfig = vi.fn(async () => {});
    const channel = createPlayerConfigChannel({
      getPlayer: () => createPlayer({ updateConfig }),
    });
    const handler = vi.fn();

    channel.subscribe(handler);
    await channel.patch({ volume: 0.3 });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("播放器派发 configchange 时通知订阅者", () => {
    const listeners = new Set<(event: Event) => void>();
    const target = {
      addEventListener: (_: string, handler: (event: Event) => void) => {
        listeners.add(handler);
      },
      removeEventListener: (_: string, handler: (event: Event) => void) => {
        listeners.delete(handler);
      },
      dispatch: () => listeners.forEach((handler) => handler({} as Event)),
    };

    const channel = createPlayerConfigChannel({
      getPlayer: () => createPlayer(),
      getEventTarget: () => target as unknown as EventTarget,
    });
    const handler = vi.fn();

    channel.subscribe(handler);
    target.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(PLAYER_CONFIG_EVENT).toBe("nmpv3:configchange");
  });

  it("取消订阅后不再收到通知", async () => {
    const channel = createPlayerConfigChannel({
      getPlayer: () => createPlayer(),
    });
    const handler = vi.fn();

    const dispose = channel.subscribe(handler);
    dispose();
    await channel.patch({ volume: 0.2 });

    expect(handler).not.toHaveBeenCalled();
  });

  it("单个订阅者抛错不影响其他订阅者", async () => {
    const channel = createPlayerConfigChannel({
      getPlayer: () => createPlayer(),
    });
    const second = vi.fn();

    channel.subscribe(() => {
      throw new Error("boom");
    });
    channel.subscribe(second);

    await channel.patch({ volume: 0.1 });

    expect(second).toHaveBeenCalledTimes(1);
  });

  it("没有播放器时 get 返回空对象、patch 静默失败", async () => {
    const channel = createPlayerConfigChannel({ getPlayer: () => null });

    expect(channel.get()).toEqual({});
    await expect(channel.patch({ volume: 1 })).resolves.toBeUndefined();
  });

  it("sanitize 可以裁剪未知字段", async () => {
    const updateConfig = vi.fn(async () => {});
    const channel = createPlayerConfigChannel({
      getPlayer: () => createPlayer({ updateConfig }),
      sanitize: (patch) => ({ volume: patch.volume as number }),
    });

    await channel.patch({ volume: 0.4, hack: true });

    expect(updateConfig).toHaveBeenCalledWith({ volume: 0.4 });
  });
});
