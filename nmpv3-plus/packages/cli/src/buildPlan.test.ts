import { describe, expect, it } from "vitest";
import {
  addNMPv3PlusPackagesToConfig,
  buildNMPv3PlusDeployPackage,
  generateNMPv3PlusHtmlTags,
  resolveNMPv3PlusBuildPlan,
  serializeNMPv3PlusBuildManifest,
} from "./index";

describe("NMPv3+ build plan CLI core", () => {
  it("adds official extension and skin names to a build config", () => {
    const result = addNMPv3PlusPackagesToConfig(
      {
        extensions: ["visualizer"],
        skins: ["default"],
        output: {
          runtime: "deploy/nmpv3-plus.runtime.js",
          bootstrap: "deploy/nmpv3-plus.bootstrap.js",
          extensionsDir: "deploy/extensions/official",
        },
      },
      ["host-sync", "custom-source", "glass", "visualizer"],
    );

    expect(result.addedExtensions).toEqual(["host-sync", "custom-source"]);
    expect(result.addedSkins).toEqual(["glass"]);
    expect(result.config).toMatchObject({
      extensions: ["visualizer", "host-sync", "custom-source"],
      skins: ["default", "glass"],
      output: {
        runtime: "deploy/nmpv3-plus.runtime.js",
        bootstrap: "deploy/nmpv3-plus.bootstrap.js",
        extensionsDir: "deploy/extensions/official",
      },
    });
  });

  it("rejects unknown package names during add", () => {
    expect(() =>
      addNMPv3PlusPackagesToConfig({}, ["visualizer", "missing-package"]),
    ).toThrow("Unknown NMPv3+ package: missing-package");
  });

  it("resolves selected official extensions and skins into deployable assets", () => {
    const plan = resolveNMPv3PlusBuildPlan({
      extensions: ["visualizer", "host-sync"],
      skins: ["glass", "vinyl"],
      output: {
        runtime: "public/nmpv3-plus.runtime.js",
        bootstrap: "public/nmpv3-plus.bootstrap.js",
        extensionsDir: "public/extensions/official",
        skinsDir: "public/skins",
        manifest: "public/nmpv3-plus.manifest.json",
      },
    });

    expect(plan.runtime.output).toBe("public/nmpv3-plus.runtime.js");
    expect(plan.bootstrap.output).toBe("public/nmpv3-plus.bootstrap.js");
    expect(plan.extensions.map((asset) => asset.output)).toEqual([
      "public/extensions/official/visualizer/index.js",
      "public/extensions/official/host-sync/index.js",
    ]);
    expect(plan.extensionManifests.map((asset) => asset.output)).toEqual([
      "public/extensions/official/visualizer/manifest.json",
      "public/extensions/official/host-sync/manifest.json",
    ]);
    expect(plan.extensionStyles.map((asset) => asset.output)).toEqual([
      "public/extensions/official/visualizer/style.css",
    ]);
    expect(plan.skins.map((asset) => asset.output)).toEqual([
      "public/skins/glass.json",
      "public/skins/vinyl.json",
    ]);
    expect(plan.skinStyles.map((asset) => asset.output)).toEqual([
      "public/skins/glass.css",
      "public/skins/vinyl.css",
    ]);
    expect(plan.htmlTags).toContain(
      '<script type="module" src="/public/nmpv3-plus.bootstrap.js"></script>',
    );
    expect(plan.htmlTags).toContain(
      '<script type="module" src="/public/extensions/official/visualizer/index.js"></script>',
    );
    expect(plan.htmlTags).toContain(
      '<link rel="preload" as="fetch" href="/public/skins/glass.json" crossorigin>',
    );
  });

  it("accepts Windows-style output paths while preserving the required ESM layout", () => {
    const plan = resolveNMPv3PlusBuildPlan({
      extensions: ["visualizer"],
      output: {
        runtime: "D:\\Temp\\nmpv3-plus\\deploy\\nmpv3-plus.runtime.js",
        bootstrap: "D:\\Temp\\nmpv3-plus\\deploy\\nmpv3-plus.bootstrap.js",
        extensionsDir: "D:\\Temp\\nmpv3-plus\\deploy\\extensions\\official",
        packagesDir: "D:\\Temp\\nmpv3-plus\\deploy\\packages",
        chunksDir: "D:\\Temp\\nmpv3-plus\\deploy\\chunks",
        manifest: "D:\\Temp\\nmpv3-plus\\deploy\\nmpv3-plus.manifest.json",
      },
    });

    expect(plan.extensions[0]?.output).toBe(
      "D:/Temp/nmpv3-plus/deploy/extensions/official/visualizer/index.js",
    );
    expect(plan.dependencyTrees).toContainEqual({
      name: "extensions",
      source: "dist/extensions",
      output: "D:/Temp/nmpv3-plus/deploy/extensions",
    });
  });

  it("serializes a deterministic manifest for custom deployments", () => {
    const plan = resolveNMPv3PlusBuildPlan({
      extensions: ["media-session"],
      skins: ["minimal"],
      userExtensions: [
        {
          name: "user-wave",
          entry: "extensions/user/wave/index.js",
          manifest: "extensions/user/wave/manifest.json",
          style: "extensions/user/wave/style.css",
        },
      ],
      userSkins: [
        {
          name: "studio-deep",
          manifest: "skins/user/studio-deep/skin.json",
          style: "skins/user/studio-deep/skin.css",
        },
      ],
    });
    const manifest = JSON.parse(serializeNMPv3PlusBuildManifest(plan)) as {
      runtime: string;
      bootstrap: string;
      extensions: Array<{
        name: string;
        output: string;
        manifest: string;
        style?: string;
      }>;
      skins: Array<{ name: string; output: string; style?: string }>;
      dependencyTrees: Array<{ name: string; source: string; output: string }>;
      htmlTags: string[];
    };

    expect(manifest.runtime).toBe("dist/nmpv3-plus.runtime.js");
    expect(manifest.bootstrap).toBe("dist/nmpv3-plus.bootstrap.js");
    expect(manifest.extensions).toEqual([
      {
        name: "media-session",
        output: "dist/extensions/official/media-session/index.js",
        manifest: "dist/extensions/official/media-session/manifest.json",
      },
      {
        name: "user-wave",
        output: "dist/extensions/user/user-wave/index.js",
        manifest: "dist/extensions/user/user-wave/manifest.json",
        style: "dist/extensions/user/user-wave/style.css",
      },
    ]);
    expect(manifest.skins).toEqual([
      {
        name: "minimal",
        output: "dist/skins/minimal.json",
        style: "dist/skins/minimal.css",
      },
      {
        name: "studio-deep",
        output: "dist/skins/user/studio-deep/skin.json",
        style: "dist/skins/user/studio-deep/skin.css",
      },
    ]);
    expect(manifest.dependencyTrees).toEqual([
      { name: "packages", source: "dist/packages", output: "dist/packages" },
      {
        name: "extensions",
        source: "dist/extensions",
        output: "dist/extensions",
      },
      { name: "chunks", source: "dist/chunks", output: "dist/chunks" },
    ]);
    expect(
      generateNMPv3PlusHtmlTags({ extensions: ["media-session"] }),
    ).toContain("/dist/extensions/official/media-session/index.js");
  });

  it("rejects unknown official names and malformed user packages instead of silently producing fake assets", () => {
    expect(() =>
      resolveNMPv3PlusBuildPlan({ extensions: ["missing-extension"] }),
    ).toThrow("Unknown NMPv3+ extension: missing-extension");
    expect(() =>
      resolveNMPv3PlusBuildPlan({ skins: ["missing-skin"] }),
    ).toThrow("Unknown NMPv3+ skin: missing-skin");
    expect(() =>
      resolveNMPv3PlusBuildPlan({
        output: {
          runtime: "public/nmpv3-plus.runtime.js",
          bootstrap: "public/nmpv3-plus.bootstrap.js",
          extensionsDir: "public/plugins",
        },
      }),
    ).toThrow(
      "NMPv3+ extensionsDir must preserve Vite ESM layout: public/extensions/official",
    );
    expect(() =>
      resolveNMPv3PlusBuildPlan({
        userExtensions: [
          {
            name: "bad-extension",
            entry: "",
            manifest: "extensions/user/bad/manifest.json",
          },
        ],
      }),
    ).toThrow(
      "NMPv3+ user extension requires entry and manifest: bad-extension",
    );
    expect(() =>
      resolveNMPv3PlusBuildPlan({
        userSkins: [{ name: "bad-skin", manifest: "" }],
      }),
    ).toThrow("NMPv3+ user skin requires manifest: bad-skin");
    expect(() =>
      resolveNMPv3PlusBuildPlan({
        userSkins: [
          { name: "dup", manifest: "skins/user/dup/skin.json" },
          { name: "dup", manifest: "skins/user/dup-2/skin.json" },
        ],
      }),
    ).toThrow("Duplicate NMPv3+ user skin package: dup");
  });

  it("materializes a deployable package by copying runtime, dependency trees, extensions, skins, and manifest", async () => {
    const files = new Map<string, string>([
      ["dist/index.js", 'import "./packages/core/src/index.js";'],
      ["dist/browser.js", 'import "./packages/core/src/index.js";'],
      ["dist/extensions/official/visualizer/index.js", "visualizer"],
      [
        "extensions/official/visualizer/manifest.json",
        '{"name":"nmpv3-plus-extension-visualizer"}',
      ],
      ["extensions/official/visualizer/style.css", ".nmpv3-plus-visualizer{}"],
      ["dist/extensions/official/host-sync/index.js", "host-sync"],
      ["dist/packages/core/src/index.js", "core"],
      ["dist/chunks/dom.js", "chunk"],
      ["skins/official/glass/skin.json", '{"name":"glass"}'],
      ["skins/official/glass/skin.css", ".nmpv3-plus-skin-glass{}"],
      ["extensions/user/wave/index.js", "user-wave"],
      [
        "extensions/user/wave/manifest.json",
        '{"name":"nmpv3-plus-extension-user-wave"}',
      ],
      ["extensions/user/wave/style.css", ".nmpv3-player{}"],
      ["skins/user/studio-deep/skin.json", '{"name":"studio-deep"}'],
      ["skins/user/studio-deep/skin.css", ".nmpv3-player{}"],
    ]);
    const writes = new Map<string, string>();

    const result = await buildNMPv3PlusDeployPackage(
      {
        extensions: ["visualizer"],
        skins: ["glass"],
        userExtensions: [
          {
            name: "user-wave",
            entry: "extensions/user/wave/index.js",
            manifest: "extensions/user/wave/manifest.json",
            style: "extensions/user/wave/style.css",
          },
        ],
        userSkins: [
          {
            name: "studio-deep",
            manifest: "skins/user/studio-deep/skin.json",
            style: "skins/user/studio-deep/skin.css",
          },
        ],
        output: {
          runtime: "public/nmpv3-plus.runtime.js",
          bootstrap: "public/nmpv3-plus.bootstrap.js",
          extensionsDir: "public/extensions/official",
          skinsDir: "public/skins",
          manifest: "public/nmpv3-plus.manifest.json",
        },
      },
      {
        async readText(path) {
          const contents = files.get(path);
          if (contents == null) {
            throw new Error(`missing ${path}`);
          }
          return contents;
        },
        async writeText(path, contents) {
          writes.set(path, contents);
        },
        async listFiles(path) {
          return Array.from(files.keys()).filter((file) =>
            file.startsWith(`${path}/`),
          );
        },
      },
    );

    expect(writes.get("public/nmpv3-plus.runtime.js")).toContain(
      "./packages/core/src/index.js",
    );
    expect(writes.get("public/nmpv3-plus.bootstrap.js")).toContain(
      "./packages/core/src/index.js",
    );
    expect(writes.get("public/extensions/official/visualizer/index.js")).toBe(
      "visualizer",
    );
    expect(writes.get("public/extensions/user/user-wave/index.js")).toBe(
      "user-wave",
    );
    expect(
      writes.get("public/extensions/official/visualizer/manifest.json"),
    ).toBe('{"name":"nmpv3-plus-extension-visualizer"}');
    expect(writes.get("public/extensions/official/visualizer/style.css")).toBe(
      ".nmpv3-plus-visualizer{}",
    );
    expect(writes.get("public/extensions/user/user-wave/manifest.json")).toBe(
      '{"name":"nmpv3-plus-extension-user-wave"}',
    );
    expect(writes.get("public/extensions/user/user-wave/style.css")).toBe(
      ".nmpv3-player{}",
    );
    expect(writes.get("public/packages/core/src/index.js")).toBe("core");
    expect(writes.get("public/chunks/dom.js")).toBe("chunk");
    expect(writes.get("public/skins/glass.json")).toBe('{"name":"glass"}');
    expect(writes.get("public/skins/glass.css")).toBe(
      ".nmpv3-plus-skin-glass{}",
    );
    expect(writes.get("public/skins/user/studio-deep/skin.json")).toBe(
      '{"name":"studio-deep"}',
    );
    expect(writes.get("public/skins/user/studio-deep/skin.css")).toBe(
      ".nmpv3-player{}",
    );
    expect(
      JSON.parse(writes.get("public/nmpv3-plus.manifest.json") ?? "{}"),
    ).toMatchObject({
      runtime: "public/nmpv3-plus.runtime.js",
      bootstrap: "public/nmpv3-plus.bootstrap.js",
      extensions: [
        {
          name: "visualizer",
          output: "public/extensions/official/visualizer/index.js",
          manifest: "public/extensions/official/visualizer/manifest.json",
          style: "public/extensions/official/visualizer/style.css",
        },
        {
          name: "user-wave",
          output: "public/extensions/user/user-wave/index.js",
          manifest: "public/extensions/user/user-wave/manifest.json",
          style: "public/extensions/user/user-wave/style.css",
        },
      ],
      skins: [
        {
          name: "glass",
          output: "public/skins/glass.json",
          style: "public/skins/glass.css",
        },
        {
          name: "studio-deep",
          output: "public/skins/user/studio-deep/skin.json",
          style: "public/skins/user/studio-deep/skin.css",
        },
      ],
      dependencyTrees: [
        {
          name: "packages",
          source: "dist/packages",
          output: "public/packages",
        },
        {
          name: "extensions",
          source: "dist/extensions",
          output: "public/extensions",
        },
        { name: "chunks", source: "dist/chunks", output: "public/chunks" },
      ],
    });
    expect(result.written).toContain("public/nmpv3-plus.runtime.js");
    expect(result.written).toContain("public/nmpv3-plus.bootstrap.js");
    expect(result.written).toContain(
      "public/extensions/official/visualizer/index.js",
    );
    expect(result.written).toContain(
      "public/extensions/official/visualizer/manifest.json",
    );
    expect(result.written).toContain(
      "public/extensions/official/visualizer/style.css",
    );
    expect(result.written).toContain(
      "public/extensions/user/user-wave/index.js",
    );
    expect(result.written).toContain(
      "public/extensions/user/user-wave/manifest.json",
    );
    expect(result.written).toContain(
      "public/extensions/user/user-wave/style.css",
    );
    expect(result.written).toContain("public/packages/core/src/index.js");
    expect(result.written).toContain("public/chunks/dom.js");
    expect(result.written).toContain("public/skins/glass.json");
    expect(result.written).toContain("public/skins/glass.css");
    expect(result.written).toContain("public/skins/user/studio-deep/skin.json");
    expect(result.written).toContain("public/skins/user/studio-deep/skin.css");
    expect(result.written[result.written.length - 1]).toBe(
      "public/nmpv3-plus.manifest.json",
    );
  });
});
