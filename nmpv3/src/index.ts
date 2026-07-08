import { DEFAULT_API_BASE_URL } from "./config/constants";
import {
  getGlobalConfig as readGlobalConfig,
  refreshGlobalConfigFromWindow,
  resolveConfigWithGlobal,
  setGlobalApiBaseUrl as setRuntimeGlobalApiBaseUrl,
  setGlobalConfig as setRuntimeGlobalConfig,
} from "./config/globalConfig";
import { mergeConfig } from "./config/normalizeConfig";
import { NMPv3PlayerInstance } from "./core/NMPv3Player";
import { globalAudioManager } from "./core/GlobalAudioManager";
import { NMPv3Element } from "./element/NMPv3Element";
import { parseShortcode } from "./shortcode/parseShortcode";
import { readLegacyV2Config } from "./shortcode/legacyV2";
import { nmpv3Css } from "./styles/nmpv3.css";
import { injectStyleOnce, resolveTarget } from "./utils/dom";
import { getDocument, getWindow } from "./utils/env";
import type { NMPv3Config, NMPv3Global, NMPv3Player } from "./types";

export * from "./types";
export * from "./jsx";
export { DEFAULT_API_BASE_URL };
export { parseLrc } from "./lyric/parseLrc";
export { syncLyric } from "./lyric/syncLyric";

let autoInitScheduled = false;

/**
 * 注册 Web Component 并注入全局样式
 * 多次调用安全（幂等操作）
 */
export function defineNMPv3(): void {
  injectStyleOnce("nmpv3-style", nmpv3Css);

  const registry = getWindow()?.customElements;

  if (registry && !registry.get("nmp-player")) {
    registry.define("nmp-player", NMPv3Element);
  }
}

export function createNMPv3Player(
  target: string | HTMLElement,
  config: Partial<NMPv3Config>,
): NMPv3Player {
  defineNMPv3();
  const player = new NMPv3PlayerInstance(
    resolveTarget(target),
    resolveConfigWithGlobal(config),
  );
  globalAudioManager.add(player);
  return player;
}

export function init(root?: ParentNode): NMPv3Player[] {
  const scope = root ?? getDocument();

  if (!scope) {
    return globalAudioManager.all();
  }

  defineNMPv3();
  refreshGlobalConfigFromWindow();
  upgradeLegacy(scope);
  processShortcodes(scope);
  return globalAudioManager.all();
}

export function upgradeLegacy(root?: ParentNode): void {
  const scope = root ?? getDocument();

  if (!scope) {
    return;
  }

  scope
    .querySelectorAll<HTMLElement>(".netease-mini-player")
    .forEach((element) => {
      if (element.dataset.nmpv3Upgraded === "true") {
        return;
      }

      element.dataset.nmpv3Upgraded = "true";
      element.dataset.nmpv2Upgraded = "true";
      createNMPv3Player(element, readLegacyV2Config(element));
    });
}

/**
 * 扫描 DOM 中的短码文本节点并替换为 nmp-player 元素
 * 支持 {nmpv3:songId} 和 {nmpv3:song=xxx,theme=dark} 格式
 */
export function processShortcodes(root?: ParentNode): void {
  const doc = getDocument();
  const scope = root ?? doc;

  if (!doc || !scope) {
    return;
  }

  const showText = doc.defaultView?.NodeFilter.SHOW_TEXT ?? 4;
  const walker = doc.createTreeWalker(scope, showText);
  const replacements: Array<[Text, DocumentFragment]> = [];

  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    const content = text.textContent ?? "";

    if (!content.includes("{nmpv")) {
      continue;
    }

    const parent = text.parentElement;

    if (parent && ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
      continue;
    }

    const fragment = doc.createDocumentFragment();
    const shortcodePattern = /\{(?:nmpv3|nmpv2):[^}]+}/g;
    let lastIndex = 0;
    let hasShortcode = false;
    let match: RegExpExecArray | null;

    while ((match = shortcodePattern.exec(content))) {
      const config = parseShortcode(match[0]);

      if (!config) {
        continue;
      }

      hasShortcode = true;

      if (match.index > lastIndex) {
        fragment.append(
          doc.createTextNode(content.slice(lastIndex, match.index)),
        );
      }

      const element = doc.createElement("nmp-player");
      element.dataset.nmpv3ShortcodeUpgraded = "true";
      applyAttributes(element, config);
      fragment.append(element);
      lastIndex = match.index + match[0].length;
    }

    if (hasShortcode) {
      if (lastIndex < content.length) {
        fragment.append(doc.createTextNode(content.slice(lastIndex)));
      }

      replacements.push([text, fragment]);
    }
  }

  for (const [text, fragment] of replacements) {
    text.parentNode?.replaceChild(fragment, text);
  }
}

/**
 * 全局配置（对所有播放器实例生效）
 * 更新后自动同步到所有已存在的播放器
 */
export function setGlobalConfig(config: Partial<NMPv3Config>): void {
  const patch = mergeConfig(config);
  setRuntimeGlobalConfig(patch);

  for (const player of globalAudioManager.all()) {
    void player.updateConfig(patch);
  }
}

export function setApiBaseUrl(apiBaseUrl: string): void {
  setRuntimeGlobalApiBaseUrl(apiBaseUrl);

  for (const player of globalAudioManager.all()) {
    void player.updateConfig({ apiBaseUrl });
  }
}

export function getGlobalConfig(): NMPv3Config {
  return readGlobalConfig();
}

export const NMPv3: NMPv3Global = {
  version: "3.0.0-alpha.1",
  init,
  create: createNMPv3Player,
  upgradeLegacy,
  processShortcodes,
  getPlayers: globalAudioManager.all,
  pauseAll: globalAudioManager.pauseAll,
  setGlobalConfig,
  setApiBaseUrl,
  getGlobalConfig,
  defaultApiBaseUrl: DEFAULT_API_BASE_URL,
};

const browserWindow = getWindow();

if (browserWindow) {
  browserWindow.NMPv3 = NMPv3;
  browserWindow.NeteaseMiniPlayer = NMPv3;
  scheduleAutoInit();
}

function applyAttributes(
  element: HTMLElement,
  config: Partial<NMPv3Config>,
): void {
  if (config.songId) {
    element.setAttribute("song-id", config.songId);
  }

  if (config.playlistId) {
    element.setAttribute("playlist-id", config.playlistId);
  }

  if (config.theme) {
    element.setAttribute("theme", config.theme);
  }

  if (config.layout) {
    element.setAttribute("layout", config.layout);
  }

  if (typeof config.embed === "boolean") {
    element.setAttribute("embed", String(config.embed));
  }

  if (config.embedMode) {
    element.setAttribute("embed-mode", config.embedMode);
  }

  if (config.position) {
    element.setAttribute("position", config.position);
  }

  if (typeof config.volume === "number") {
    element.setAttribute("volume", String(config.volume));
  }

  if (config.apiBaseUrl) {
    element.setAttribute("api-base-url", config.apiBaseUrl);
  }

  if (typeof config.autoplay === "boolean") {
    element.setAttribute("autoplay", String(config.autoplay));
  }

  if (typeof config.showLyrics === "boolean") {
    element.setAttribute("lyric", String(config.showLyrics));
  }

  if (typeof config.showPlaylist === "boolean") {
    element.setAttribute("playlist", String(config.showPlaylist));
  }

  if (typeof config.defaultMinimized === "boolean") {
    element.setAttribute("default-minimized", String(config.defaultMinimized));
  }

  if (typeof config.autoPauseOnHidden === "boolean") {
    element.setAttribute(
      "auto-pause-on-hidden",
      String(config.autoPauseOnHidden),
    );
  }

  if (typeof config.remember === "boolean") {
    element.setAttribute("remember", String(config.remember));
  }

  if (config.storageKey) {
    element.setAttribute("storage-key", config.storageKey);
  }

  if (typeof config.draggable === "boolean") {
    element.setAttribute("draggable", String(config.draggable));
  }

  if (typeof config.hotkeys === "boolean") {
    element.setAttribute("hotkeys", String(config.hotkeys));
  }

  if (typeof config.idleOpacity === "number") {
    element.setAttribute("idle-opacity", String(config.idleOpacity));
  }
}

function scheduleAutoInit(): void {
  const doc = getDocument();

  if (autoInitScheduled || !doc) {
    return;
  }

  autoInitScheduled = true;

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", () => init(doc), { once: true });
  } else {
    init(doc);
  }
}
