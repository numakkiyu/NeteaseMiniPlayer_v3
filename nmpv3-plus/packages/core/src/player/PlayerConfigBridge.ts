import type {
  NMPv3PlusConfigChannel,
  NMPv3PlusPlayerConfig,
  NMPv3PlusPlayerLike,
} from "../types";

/** 配置变化事件名，由 NMPv3 播放器在 updateConfig 后派发 */
export const PLAYER_CONFIG_EVENT = "nmpv3:configchange";

/** 空快照：播放器不可用时统一返回它，避免插件到处判空 */
const EMPTY_CONFIG: NMPv3PlusPlayerConfig = Object.freeze({});

/**
 * 读取播放器配置快照
 *
 * 播放器没实现 getConfig、或者实现里抛错，都返回空对象而不是抛出，
 * 这样插件可以无条件调用。
 */
export function readPlayerConfig(
  player: NMPv3PlusPlayerLike | null | undefined,
): NMPv3PlusPlayerConfig {
  if (!player?.getConfig) {
    return EMPTY_CONFIG;
  }

  try {
    const config = player.getConfig();

    if (!config || typeof config !== "object") {
      return EMPTY_CONFIG;
    }

    return { ...config };
  } catch {
    return EMPTY_CONFIG;
  }
}

/**
 * 把补丁写回播放器
 *
 * 失败不向上抛：插件的目的是“尽力修改”，不应该因为播放器没实现某个字段就让整个插件崩掉。
 * 需要知道成功与否的调用方可以检查返回的布尔值。
 */
export async function patchPlayerConfig(
  player: NMPv3PlusPlayerLike | null | undefined,
  patch: Partial<NMPv3PlusPlayerConfig>,
): Promise<boolean> {
  if (!player?.updateConfig) {
    return false;
  }

  if (!patch || Object.keys(patch).length === 0) {
    return true;
  }

  try {
    await player.updateConfig(patch as Record<string, unknown>);
    return true;
  } catch {
    return false;
  }
}

export interface PlayerConfigChannelOptions {
  /** 取当前播放器，可能为 null（尚未挂载） */
  getPlayer: () => NMPv3PlusPlayerLike | null;
  /** 接收 nmpv3:configchange 的事件目标，通常是播放器根节点 */
  getEventTarget?: () => EventTarget | null;
  /** 配置写入前的归一化钩子，可用于裁剪未知字段 */
  sanitize?: (
    patch: Partial<NMPv3PlusPlayerConfig>,
  ) => Partial<NMPv3PlusPlayerConfig>;
}

/**
 * 创建插件可用的配置通道
 *
 * - get：每次实时向播放器要最新快照，避免持有过期副本
 * - patch：写入并广播，失败只返回 false
 * - subscribe：监听 NMPv3 的 configchange 事件；底层不支持时退化为空订阅
 */
export function createPlayerConfigChannel(
  options: PlayerConfigChannelOptions,
): NMPv3PlusConfigChannel {
  const listeners = new Set<
    (next: NMPv3PlusPlayerConfig, previous: NMPv3PlusPlayerConfig) => void
  >();

  let previousSnapshot = EMPTY_CONFIG;
  let boundTarget: EventTarget | null = null;
  let detach: (() => void) | null = null;

  const notify = (next: NMPv3PlusPlayerConfig) => {
    const previous = previousSnapshot;
    previousSnapshot = next;

    // 复制一份再遍历，回调里取消订阅不会打断本轮派发
    for (const listener of Array.from(listeners)) {
      try {
        listener(next, previous);
      } catch {
        // 单个订阅者出错不影响其他订阅者
      }
    }
  };

  const handleConfigChange = () => {
    notify(readPlayerConfig(options.getPlayer()));
  };

  const ensureBound = () => {
    const target = options.getEventTarget?.() ?? null;

    if (target === boundTarget) {
      return;
    }

    detach?.();
    detach = null;
    boundTarget = target;

    if (!target || typeof target.addEventListener !== "function") {
      return;
    }

    target.addEventListener(PLAYER_CONFIG_EVENT, handleConfigChange);
    detach = () => {
      target.removeEventListener(PLAYER_CONFIG_EVENT, handleConfigChange);
    };
  };

  return {
    get(): NMPv3PlusPlayerConfig {
      /*
       * 纯读取，不推进 previousSnapshot。
       * 上一次值只由 notify 维护，否则「读一次再改配置」会让订阅者收到的
       * previous 变成读到的值，而不是真正的上一份配置。
       */
      return readPlayerConfig(options.getPlayer());
    },

    async patch(patch: Partial<NMPv3PlusPlayerConfig>): Promise<void> {
      const player = options.getPlayer();
      const sanitized = options.sanitize ? options.sanitize(patch) : patch;
      const applied = await patchPlayerConfig(player, sanitized);

      if (applied) {
        // 底层可能派发事件，这里也主动刷一次，保证没有事件支持时订阅仍然可靠
        notify(readPlayerConfig(player));
      }
    },

    subscribe(handler): () => void {
      ensureBound();
      listeners.add(handler);

      return () => {
        listeners.delete(handler);

        if (listeners.size === 0) {
          detach?.();
          detach = null;
          boundTarget = null;
        }
      };
    },
  };
}

/** 供测试与诊断：判断某个播放器是否具备配置读写能力 */
export function supportsPlayerConfig(
  player: NMPv3PlusPlayerLike | null | undefined,
): boolean {
  return Boolean(player?.getConfig && player?.updateConfig);
}
