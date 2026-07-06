import { describe, expect, it, vi } from "vitest";
import { NMPv3PlusEventBus } from "../event/EventBus";
import { NMPv3PlusHostBridge } from "./HostBridge";

describe("NMPv3PlusHostBridge", () => {
  it("maps player events into host attributes, classes, and tokens", () => {
    const target = createHostElementStub();
    const events = new NMPv3PlusEventBus();
    const bridge = new NMPv3PlusHostBridge(events, {
      target,
      rules: [
        {
          event: "songchange",
          attribute: "data-current-song",
          map: (payload) =>
            typeof payload === "object" && payload !== null && "name" in payload
              ? String(payload.name)
              : null,
        },
        {
          event: "play",
          className: "is-playing",
        },
        {
          event: "cover-color",
          token: "--page-accent",
          map: (payload) => String(payload),
        },
      ],
    });

    bridge.start();
    events.emit("songchange", { name: "Host Song" });
    events.emit("play");
    events.emit("cover-color", "#ff6b35");

    expect(target.setAttribute).toHaveBeenCalledWith(
      "data-current-song",
      "Host Song",
    );
    expect(target.classList.toggle).toHaveBeenCalledWith("is-playing", true);
    expect(target.style.setProperty).toHaveBeenCalledWith(
      "--page-accent",
      "#ff6b35",
    );

    bridge.stop();
    expect(events.listenerCount("play")).toBe(0);
  });

  it("supports template-based style, class, and attribute maps", () => {
    const target = createHostElementStub();
    const events = new NMPv3PlusEventBus();
    const bridge = new NMPv3PlusHostBridge(events, {
      target,
      rules: [
        {
          on: "songchange",
          attribute: {
            "data-song-id": "{{song.id}}",
            "data-song-title": "{{song.name}}",
          },
          style: {
            "--site-accent": "{{song.themeColor}}",
            "--site-cover": "url({{song.picUrl}})",
          },
          className: {
            "nmp-has-song": "{{song.id}}",
            "nmp-is-playing": "{{player.isPlaying}}",
          },
        },
      ],
    });

    bridge.start();
    events.emit("songchange", {
      song: {
        id: "song-42",
        name: "Template Song",
        themeColor: "#ff6b35",
        picUrl: "https://example.test/cover.jpg",
      },
      player: {
        isPlaying: true,
      },
    });

    expect(target.setAttribute).toHaveBeenCalledWith("data-song-id", "song-42");
    expect(target.setAttribute).toHaveBeenCalledWith(
      "data-song-title",
      "Template Song",
    );
    expect(target.style.setProperty).toHaveBeenCalledWith(
      "--site-accent",
      "#ff6b35",
    );
    expect(target.style.setProperty).toHaveBeenCalledWith(
      "--site-cover",
      "url(https://example.test/cover.jpg)",
    );
    expect(target.classList.toggle).toHaveBeenCalledWith("nmp-has-song", true);
    expect(target.classList.toggle).toHaveBeenCalledWith(
      "nmp-is-playing",
      true,
    );
  });

  it("can resolve a host target from a selector", () => {
    const target = createHostElementStub();
    const events = new NMPv3PlusEventBus();
    const root = {
      querySelector: vi.fn((selector: string) =>
        selector === "body" ? target : null,
      ),
    } as unknown as ParentNode;
    const bridge = new NMPv3PlusHostBridge(events, {
      target: "body",
      root,
      rules: [
        {
          event: "themechange",
          token: {
            "--site-theme": "{{theme}}",
          },
        },
      ],
    });

    bridge.start();
    events.emit("themechange", { theme: "dark" });

    expect(root.querySelector).toHaveBeenCalledWith("body");
    expect(target.style.setProperty).toHaveBeenCalledWith(
      "--site-theme",
      "dark",
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
