import { configFromElement } from "../config/normalizeConfig";
import { resolveConfigWithGlobal } from "../config/globalConfig";
import { globalAudioManager } from "../core/GlobalAudioManager";
import { NMPv3PlayerInstance } from "../core/NMPv3Player";
import type { NMPv3Config, NMPv3Player } from "../types";

/**
 * Web Component: <nmp-player>
 * 属性变化时自动同步到播放器实例，支持声明式配置
 */
export class NMPv3Element extends HTMLElement {
  static observedAttributes = [
    "song-id",
    "playlist-id",
    "theme",
    "layout",
    "embed",
    "embed-mode",
    "position",
    "volume",
    "api-base-url",
    "autoplay",
    "lyric",
    "playlist",
    "default-minimized",
    "auto-pause-on-hidden",
    "auto-pause",
    "remember",
    "storage-key",
    "draggable",
    "hotkeys",
    "idle-opacity",
  ];

  private player: NMPv3Player | null = null;

  connectedCallback(): void {
    if (!this.player) {
      this.player = new NMPv3PlayerInstance(
        this,
        resolveConfigWithGlobal(configFromElement(this)),
      );
      globalAudioManager.add(this.player);
    }
  }

  disconnectedCallback(): void {
    if (this.player) {
      globalAudioManager.remove(this.player);
    }

    this.player?.destroy();
    this.player = null;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) {
      return;
    }

    if (!this.isConnected || !this.player) {
      return;
    }

    void this.player.updateConfig(this.configPatchForChangedAttribute(name));
  }

  private configPatchForChangedAttribute(name: string): Partial<NMPv3Config> {
    const current = resolveConfigWithGlobal(configFromElement(this));
    const patch: Partial<NMPv3Config> = {};

    for (const key of attributeConfigKeys[name] ?? []) {
      patch[key] = current[key] as never;
    }

    return patch;
  }
}

const attributeConfigKeys: Record<string, Array<keyof NMPv3Config>> = {
  "song-id": ["songId"],
  "playlist-id": ["playlistId"],
  theme: ["theme"],
  layout: ["layout"],
  embed: ["embed", "embedMode"],
  "embed-mode": ["embed", "embedMode"],
  position: ["position"],
  volume: ["volume"],
  "api-base-url": ["apiBaseUrl"],
  autoplay: ["autoplay"],
  lyric: ["showLyrics"],
  playlist: ["showPlaylist"],
  "default-minimized": ["defaultMinimized"],
  "auto-pause-on-hidden": ["autoPauseOnHidden"],
  "auto-pause": ["autoPauseOnHidden"],
  remember: ["remember"],
  "storage-key": ["storageKey"],
  draggable: ["draggable"],
  hotkeys: ["hotkeys"],
  "idle-opacity": ["idleOpacity"],
};
