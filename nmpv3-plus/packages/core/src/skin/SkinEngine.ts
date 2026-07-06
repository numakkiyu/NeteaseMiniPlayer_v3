import type { NMPv3PlusSkin } from "../types";

interface AppliedSkin {
  skin: NMPv3PlusSkin;
  target: HTMLElement;
  previousTokens: Map<string, string>;
  styleElement?: HTMLStyleElement;
}

/**
 * 皮肤引擎：管理皮肤注册、应用和卸载
 * 应用时将 CSS token 注入目标元素、添加 className、插入 style 标签
 * 卸载时恢复原始 token 值，实现无副作用清理
 */
export class NMPv3PlusSkinEngine {
  private readonly skins = new Map<string, NMPv3PlusSkin>();
  private applied: AppliedSkin | null = null;

  register(skin: NMPv3PlusSkin): () => void {
    if (this.skins.has(skin.name)) {
      throw new Error(`NMPv3+ skin already registered: ${skin.name}`);
    }

    this.skins.set(skin.name, skin);
    return () => this.unregister(skin.name);
  }

  unregister(name: string): boolean {
    if (this.applied?.skin.name === name) {
      this.clear();
    }

    return this.skins.delete(name);
  }

  list(): NMPv3PlusSkin[] {
    return Array.from(this.skins.values());
  }

  get(name: string): NMPv3PlusSkin | undefined {
    return this.skins.get(name);
  }

  apply(name: string, target: HTMLElement): NMPv3PlusSkin {
    const skin = this.skins.get(name);

    if (!skin) {
      throw new Error(`NMPv3+ skin not registered: ${name}`);
    }

    this.clear();
    const previousTokens = new Map<string, string>();

    for (const [token, value] of Object.entries(skin.tokens ?? {})) {
      previousTokens.set(token, target.style.getPropertyValue(token));
      target.style.setProperty(token, value);
    }

    if (skin.className) {
      target.classList.add(skin.className);
    }

    target.dataset.nmpv3PlusSkin = skin.name;
    const styleElement = this.injectCss(skin, target);
    this.applied = {
      skin,
      target,
      previousTokens,
      styleElement,
    };

    return skin;
  }

  clear(): void {
    if (!this.applied) {
      return;
    }

    const { skin, target, previousTokens, styleElement } = this.applied;

    for (const [token, previousValue] of previousTokens) {
      if (previousValue) {
        target.style.setProperty(token, previousValue);
      } else {
        target.style.removeProperty(token);
      }
    }

    if (skin.className) {
      target.classList.remove(skin.className);
    }

    delete target.dataset.nmpv3PlusSkin;
    styleElement?.remove();
    this.applied = null;
  }

  private injectCss(
    skin: NMPv3PlusSkin,
    target: HTMLElement,
  ): HTMLStyleElement | undefined {
    if (!skin.cssText || !target.ownerDocument?.head) {
      return undefined;
    }

    const styleElement = target.ownerDocument.createElement("style");
    styleElement.dataset.nmpv3PlusSkin = skin.name;
    styleElement.textContent = skin.cssText;
    target.ownerDocument.head.append(styleElement);
    return styleElement;
  }
}

export const defaultNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "default",
  displayName: "Default",
  tokens: {},
};

export const glassNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "glass",
  displayName: "Glass",
  className: "nmpv3-plus-skin-glass",
  tokens: {
    "--nmpv3-bg": "rgba(255, 255, 255, 0.72)",
    "--nmpv3-border": "rgba(255, 255, 255, 0.46)",
    "--nmpv3-shadow": "0 18px 52px rgba(18, 24, 40, 0.18)",
  },
  cssText:
    ".nmpv3-plus-skin-glass .nmpv3-player{backdrop-filter:blur(18px) saturate(1.12);}",
};
