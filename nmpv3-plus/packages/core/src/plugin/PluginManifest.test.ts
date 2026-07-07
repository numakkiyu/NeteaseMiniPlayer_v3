import { describe, expect, it } from "vitest";
import {
  createNMPv3PlusSkinFromManifest,
  defineNMPv3PlusPluginPackage,
  parseNMPv3PlusExtensionManifest,
  parseNMPv3PlusSkinManifest,
} from "./PluginManifest";

describe("NMPv3+ manifest contracts", () => {
  it("validates extension manifests and binds them to real plugin factories", () => {
    const manifest = parseNMPv3PlusExtensionManifest({
      name: "nmpv3-plus-extension-visualizer",
      displayName: "Visualizer",
      version: "1.0.0",
      entry: "./index.ts",
      type: "visual",
      description: "Adds a visualizer.",
      dependencies: {
        "nmpv3-plus-extension-cover-color": ">=1.0.0",
      },
      configSchema: {
        mode: {
          type: "string",
          enum: ["bars", "wave", "ambient"],
          default: "bars",
        },
      },
    });
    const plugin = {
      name: "nmpv3-plus-extension-visualizer",
      setup() {},
    };

    expect(
      defineNMPv3PlusPluginPackage({ manifest, plugin }).plugin,
    ).toMatchObject({
      name: "nmpv3-plus-extension-visualizer",
      version: "1.0.0",
      manifest: {
        displayName: "Visualizer",
        type: "visual",
        dependencies: {
          "nmpv3-plus-extension-cover-color": ">=1.0.0",
        },
      },
    });
  });

  it("rejects invalid dependency declarations", () => {
    expect(() =>
      parseNMPv3PlusExtensionManifest({
        name: "nmpv3-plus-extension-bad",
        displayName: "Bad",
        version: "1.0.0",
        entry: "./index.ts",
        type: "utility",
        description: "Bad dependency manifest.",
        dependencies: {
          "nmpv3-plus-extension-host-sync": 1,
        },
      }),
    ).toThrow(
      "Invalid NMPv3+ manifest dependency range: nmpv3-plus-extension-host-sync",
    );
  });

  it("rejects plugin packages whose factory name does not match the manifest", () => {
    expect(() =>
      defineNMPv3PlusPluginPackage({
        manifest: {
          name: "nmpv3-plus-extension-host-sync",
          displayName: "Host Sync",
          version: "1.0.0",
          entry: "./index.ts",
          type: "host",
          description: "Mirrors state into a host page.",
        },
        plugin: {
          name: "wrong-plugin",
          setup() {},
        },
      }),
    ).toThrow(
      "NMPv3+ plugin name does not match manifest: wrong-plugin !== nmpv3-plus-extension-host-sync",
    );
  });

  it("turns skin manifests into runtime skins without layout sizing side effects", () => {
    const skin = createNMPv3PlusSkinFromManifest(
      {
        name: "glass",
        displayName: "Glass",
        version: "1.0.0",
        supports: ["mini", "compact", "dock", "card", "cover"],
        tokens: {
          "--nmpv3-bg": "rgba(255, 255, 255, 0.72)",
          "--nmpv3-radius": "20px",
        },
      },
      {
        className: "nmpv3-plus-skin-glass",
        cssText:
          ".nmpv3-plus-skin-glass .nmpv3-player{backdrop-filter:blur(18px);}",
      },
    );

    expect(parseNMPv3PlusSkinManifest(skin)).toMatchObject({
      name: "glass",
      supports: ["mini", "compact", "dock", "card", "cover"],
    });
    expect(Object.keys(skin.tokens ?? {})).not.toContain("width");
    expect(skin.cssText).not.toMatch(/\b(?:width|height)\s*:/);
  });
});
