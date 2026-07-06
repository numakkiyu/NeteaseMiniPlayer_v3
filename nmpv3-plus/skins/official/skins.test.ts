/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NMPv3PlusSkinEngine,
  parseNMPv3PlusSkinManifest,
} from "../../packages/core/src/index";
import { officialNMPv3PlusSkins } from "./index";
import {
  animeSkinCssText,
  cyberSkinCssText,
  defaultSkinCssText,
  glassSkinCssText,
  minimalSkinCssText,
  vinylSkinCssText,
} from "./styleText";

const officialSkinCss = {
  default: defaultSkinCssText,
  glass: glassSkinCssText,
  minimal: minimalSkinCssText,
  anime: animeSkinCssText,
  cyber: cyberSkinCssText,
  vinyl: vinylSkinCssText,
};

const officialSkinsDir = dirname(fileURLToPath(import.meta.url));

describe("official NMPv3+ skins", () => {
  it("registers and applies every official skin package without layout sizing tokens", () => {
    const engine = new NMPv3PlusSkinEngine();
    const target = createElementStub();

    for (const skin of officialNMPv3PlusSkins) {
      const cssText =
        officialSkinCss[skin.name as keyof typeof officialSkinCss];

      expect(parseNMPv3PlusSkinManifest(skin)).toMatchObject({
        name: skin.name,
        version: "1.0.0",
        supports: ["mini", "compact", "dock", "card", "cover"],
      });
      expect(cssText).toBeDefined();
      expect(skin.cssText).toBe(cssText);
      engine.register(skin);
      expect(Object.keys(skin.tokens ?? {})).not.toContain("width");
      expect(Object.keys(skin.tokens ?? {})).not.toContain("height");
      expect(skin.cssText ?? "").not.toMatch(
        /\b(?:width|height|min-width|min-height|max-width|max-height)\s*:/,
      );
    }

    for (const skin of officialNMPv3PlusSkins) {
      engine.apply(skin.name, target);
      expect(target.dataset.nmpv3PlusSkin).toBe(skin.name);
      if (skin.className) {
        expect(target.classList.contains(skin.className)).toBe(true);
      }
      engine.clear();
      expect(target.dataset.nmpv3PlusSkin).toBeUndefined();
      if (skin.className) {
        expect(target.classList.contains(skin.className)).toBe(false);
      }
    }

    expect(target.removed).toBe(false);
  });

  it("keeps official skin JSON, CSS files, and runtime cssText entries synchronized", () => {
    const expectedDirs = officialNMPv3PlusSkins.map((skin) => skin.name).sort();
    const actualDirs = readdirSync(officialSkinsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(actualDirs).toEqual(expectedDirs);

    for (const skin of officialNMPv3PlusSkins) {
      const jsonPath = join(officialSkinsDir, skin.name, "skin.json");
      const cssPath = join(officialSkinsDir, skin.name, "skin.css");
      const manifest = JSON.parse(readFileSync(jsonPath, "utf8")) as {
        name: string;
        displayName: string;
        version: string;
        author?: string;
        supports: string[];
        tokens?: Record<string, string>;
      };
      const cssText =
        officialSkinCss[skin.name as keyof typeof officialSkinCss];

      expect(manifest).toEqual({
        name: skin.name,
        displayName: skin.displayName,
        version: skin.version,
        author: skin.author,
        supports: skin.supports,
        tokens: skin.tokens,
      });
      expect(readFileSync(cssPath, "utf8").trim()).toBe(cssText.trim());
    }
  });
});

interface ElementStub {
  className: string;
  dataset: Record<string, string>;
  removed: boolean;
  classList: {
    add(name: string): void;
    remove(name: string): void;
    contains(name: string): boolean;
  };
  style: {
    values: Map<string, string>;
    getPropertyValue(name: string): string;
    setProperty(name: string, value: string): void;
    removeProperty(name: string): string;
  };
}

function createElementStub(): HTMLElement & ElementStub {
  const classes = new Set<string>();
  const target: ElementStub = {
    className: "",
    dataset: {},
    removed: false,
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    style: createStyleStub(),
  };

  return target as HTMLElement & ElementStub;
}

function createStyleStub(): ElementStub["style"] {
  const values = new Map<string, string>();

  return {
    values,
    getPropertyValue(name) {
      return values.get(name) ?? "";
    },
    setProperty(name, value) {
      values.set(name, value);
    },
    removeProperty(name) {
      values.delete(name);
      return "";
    },
  };
}
