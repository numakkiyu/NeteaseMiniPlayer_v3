import type {
  NMPv3PlusHostBridgeRule,
  NMPv3PlusPlugin,
} from "../../../packages/core/src/index";
import { applyNMPv3PlusHostBridgeRule } from "../../../packages/core/src/index";

export interface NMPv3PlusHostSyncOptions {
  target?: HTMLElement | null;
  rules?: NMPv3PlusHostBridgeRule[];
  pageLinking?: boolean;
  pageLinkParam?: string;
  history?: Pick<History, "replaceState"> | null;
  location?: Pick<Location, "href" | "pathname" | "search" | "hash"> | null;
}

export function createHostSyncPlugin(
  options: NMPv3PlusHostSyncOptions = {},
): NMPv3PlusPlugin {
  return {
    name: "nmpv3-plus-extension-host-sync",
    version: "1.0.0",
    setup(ctx) {
      const target = options.target ?? ctx.root?.ownerDocument?.documentElement;

      if (!target) {
        ctx.logger.warn("Host sync extension requires a host target.");
        return undefined;
      }

      const rules = options.rules ?? defaultHostSyncRules();
      const stops = rules.flatMap((rule) => {
        const event = rule.on ?? rule.event;

        if (!event) {
          return [];
        }

        return [
          ctx.on(event, (payload) =>
            applyNMPv3PlusHostBridgeRule(target, rule, payload),
          ),
        ];
      });

      if (options.pageLinking) {
        stops.push(
          ctx.on("songchange", (payload) =>
            applyPageLinking(target, payload, options),
          ),
        );
      }

      return () => {
        stops.forEach((stop) => stop());
      };
    },
  };
}

function applyPageLinking(
  target: HTMLElement,
  payload: unknown,
  options: NMPv3PlusHostSyncOptions,
): void {
  const song = songInfoFromPayload(payload);

  if (!song.id) {
    return;
  }

  target.setAttribute("data-nmpv3-plus-linked-song", song.id);

  if (song.name) {
    target.setAttribute("data-nmpv3-plus-linked-title", song.name);
  }

  if (song.picUrl) {
    target.style.setProperty("--nmpv3-plus-linked-cover-url", song.picUrl);
  }

  const view = target.ownerDocument?.defaultView;
  const history = options.history ?? view?.history;
  const location = options.location ?? view?.location;

  if (!history || !location) {
    return;
  }

  // 使用 replaceState 而非 pushState，避免产生大量历史记录
  const nextUrl = linkedUrl(
    location,
    options.pageLinkParam ?? "nmp_song",
    song.id,
  );
  history.replaceState(null, "", nextUrl);
}

function linkedUrl(
  location: Pick<Location, "href" | "pathname" | "search" | "hash">,
  param: string,
  songId: string,
): string {
  const url = new URL(location.href || "https://nmpv3.local/");
  url.searchParams.set(param, songId);
  return `${url.pathname}${url.search}${url.hash}`;
}

function defaultHostSyncRules(): NMPv3PlusHostBridgeRule[] {
  return [
    {
      event: "songchange",
      attribute: "data-nmpv3-plus-song",
      map: (payload) => songNameFromPayload(payload),
    },
    {
      event: "play",
      className: "nmpv3-plus-is-playing",
    },
    {
      event: "pause",
      className: "nmpv3-plus-is-playing",
      map: () => false,
    },
    {
      event: "cover-color",
      token: "--nmpv3-plus-cover-color",
      map: (payload) => (typeof payload === "string" ? payload : null),
    },
  ];
}

function songNameFromPayload(payload: unknown): string | null {
  return songInfoFromPayload(payload).name ?? null;
}

function songInfoFromPayload(payload: unknown): {
  id?: string;
  name?: string;
  picUrl?: string;
} {
  if (typeof payload !== "object" || payload === null) {
    return {};
  }

  if ("song" in payload && typeof payload.song === "object" && payload.song) {
    return songInfoFromPayload(payload.song);
  }

  const record = payload as Record<string, unknown>;

  return {
    id:
      typeof record.id === "string" || typeof record.id === "number"
        ? String(record.id)
        : undefined,
    name:
      typeof record.name === "string" || typeof record.name === "number"
        ? String(record.name)
        : undefined,
    picUrl: typeof record.picUrl === "string" ? record.picUrl : undefined,
  };
}
