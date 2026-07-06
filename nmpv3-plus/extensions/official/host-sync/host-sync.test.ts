import { describe, expect, it, vi } from "vitest";
import { createNMPv3PlusRuntime } from "../../../packages/core/src/index";
import { createHostSyncPlugin } from "./index";

describe("createHostSyncPlugin", () => {
  it("applies custom template rules through the core HostBridge rule engine", async () => {
    const target = createHostElementStub();
    const root = {
      ownerDocument: {
        documentElement: target,
      },
    } as unknown as HTMLElement;
    const runtime = createNMPv3PlusRuntime({
      root,
      bridgeNMPv3Events: false,
    });

    await runtime.installPlugin(
      createHostSyncPlugin({
        rules: [
          {
            on: "songchange",
            attribute: {
              "data-current-song": "{{song.id}}",
            },
            className: {
              "nmp-is-playing": "{{player.isPlaying}}",
            },
            style: {
              "--site-accent": "{{song.themeColor}}",
            },
          },
        ],
      }),
    );

    runtime.emit("songchange", {
      song: {
        id: "host-sync-song",
        themeColor: "#00c2ff",
      },
      player: {
        isPlaying: true,
      },
    });

    expect(target.setAttribute).toHaveBeenCalledWith(
      "data-current-song",
      "host-sync-song",
    );
    expect(target.classList.toggle).toHaveBeenCalledWith(
      "nmp-is-playing",
      true,
    );
    expect(target.style.setProperty).toHaveBeenCalledWith(
      "--site-accent",
      "#00c2ff",
    );
  });
});

function createHostElementStub(): HTMLElement {
  return {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    classList: {
      toggle: vi.fn(),
    },
    style: {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
    },
  } as unknown as HTMLElement;
}
