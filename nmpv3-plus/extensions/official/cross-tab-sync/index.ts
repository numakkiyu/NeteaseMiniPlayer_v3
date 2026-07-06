import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";

export interface NMPv3PlusCrossTabSyncOptions {
  channelName?: string;
  events?: string[];
  instanceId?: string;
}

interface CrossTabMessage {
  event: string;
  payload?: unknown;
  source: string;
}

export function createCrossTabSyncPlugin(
  options: NMPv3PlusCrossTabSyncOptions = {},
): NMPv3PlusPlugin {
  const events = options.events ?? ["play", "pause", "songchange"];
  const instanceId = options.instanceId ?? createInstanceId();

  return {
    name: "nmpv3-plus-extension-cross-tab-sync",
    version: "1.0.0",
    setup(ctx) {
      if (typeof BroadcastChannel === "undefined") {
        ctx.logger.warn("Cross-tab sync requires BroadcastChannel.");
        return undefined;
      }

      const channel = new BroadcastChannel(
        options.channelName ?? "nmpv3-plus-sync",
      );
      const stops = events.map((event) =>
        ctx.on(event, (payload) => {
          channel.postMessage({
            event,
            payload,
            source: instanceId,
          } satisfies CrossTabMessage);
        }),
      );

      channel.onmessage = (message: MessageEvent<CrossTabMessage>) => {
        const data = message.data;

        // 忽略自己的消息，避免回声循环
        if (!data || data.source === instanceId) {
          return;
        }

        ctx.emit(`remote:${data.event}`, data.payload);

        // 收到远程的 play/pause 指令时直接控制本地播放器
        if (data.event === "pause") {
          ctx.player?.pause?.();
        } else if (data.event === "play") {
          void ctx.player?.play?.();
        }
      };

      return () => {
        stops.forEach((stop) => stop());
        channel.close();
      };
    },
  };
}

function createInstanceId(): string {
  return `nmpv3-plus-${Math.random().toString(36).slice(2)}`;
}
