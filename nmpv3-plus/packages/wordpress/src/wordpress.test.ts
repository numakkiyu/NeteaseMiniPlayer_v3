import { describe, expect, it } from "vitest";
import blockEditorSource from "../plugin/assets/block-editor.js?raw";
import blockMetadataSource from "../plugin/block.json?raw";
import wordpressBootstrapSource from "../plugin/assets/nmpv3-plus.wordpress.js?raw";
import pluginSource from "../plugin/netease-mini-player-v3-plus.php?raw";
import {
  buildNMPv3PlusWordPressPluginPackage,
  createNMPv3PlusBlockMetadata,
  createNMPv3PlusWordPressPluginPackagePlan,
  createNMPv3PlusWordPressSettingsFields,
  createNMPv3PlusWordPressBuildConfig,
  createNMPv3PlusWordPressEnqueuePlan,
  NMPV3_DEFAULT_API_BASE_URL,
  normalizeNMPv3PlusWordPressSettings,
} from "./index";

describe("NMPv3+ WordPress advanced integration", () => {
  it("keeps the v2.5-compatible API proxy as the default WordPress setting", () => {
    expect(normalizeNMPv3PlusWordPressSettings().apiBaseUrl).toBe(
      NMPV3_DEFAULT_API_BASE_URL,
    );
  });

  it("normalizes settings for skins, plugin switches, custom source, and page linking", () => {
    expect(
      normalizeNMPv3PlusWordPressSettings({
        defaultSkin: "glass",
        enabledSkins: ["glass", "glass", "vinyl"],
        enabledExtensions: ["visualizer", "host-sync", "visualizer"],
        userExtensions: [
          {
            name: "user-wave",
            entry: "extensions/user/wave/index.js",
            manifest: "extensions/user/wave/manifest.json",
            style: "extensions/user/wave/style.css",
          },
        ],
        localMusicJsonUrl: "/music/playlist.json",
        customLyricsUrl: "/lyrics/song.lrc",
        customTranslationLyricsUrl: "/lyrics/song.zh.lrc",
        userSkins: [
          {
            name: "studio-deep",
            manifest: "skins/user/studio-deep/skin.json",
            style: "skins/user/studio-deep/skin.css",
          },
        ],
        hostSyncEnabled: true,
        pageLinkingEnabled: true,
      }),
    ).toMatchObject({
      defaultSkin: "glass",
      enabledSkins: ["glass", "vinyl"],
      enabledExtensions: ["visualizer", "host-sync"],
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
      localMusicJsonUrl: "/music/playlist.json",
      customLyricsUrl: "/lyrics/song.lrc",
      customTranslationLyricsUrl: "/lyrics/song.zh.lrc",
      hostSyncEnabled: true,
      pageLinkingEnabled: true,
    });
  });

  it("builds an enqueue plan with runtime, extension assets, skin assets, and localized config", () => {
    const plan = createNMPv3PlusWordPressEnqueuePlan({
      defaultSkin: "glass",
      enabledExtensions: ["visualizer", "host-sync"],
      enabledSkins: ["glass"],
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
      hostSyncEnabled: true,
    });

    expect(plan.runtime).toMatchObject({
      handle: "nmpv3-plus-runtime",
      kind: "script",
      source: "assets/nmpv3-plus.wordpress.js",
      module: true,
      dependencies: ["nmpv3"],
    });
    expect(plan.baseRuntime).toEqual({
      handle: "nmpv3",
      kind: "script",
      source: "assets/nmpv3.min.js",
      dependencies: [],
      module: false,
    });
    expect(plan.extensions.map((asset) => asset.handle)).toEqual([
      "nmpv3-plus-extension-visualizer",
      "nmpv3-plus-extension-host-sync",
      "nmpv3-plus-extension-user-wave",
    ]);
    expect(plan.extensions.map((asset) => asset.source)).toEqual([
      "assets/extensions/official/visualizer/index.js",
      "assets/extensions/official/host-sync/index.js",
      "assets/extensions/user/user-wave/index.js",
    ]);
    expect(plan.skins).toEqual([
      {
        handle: "nmpv3-plus-skin-glass",
        kind: "skin",
        source: "assets/skins/glass.json",
        dependencies: ["nmpv3-plus-runtime"],
        module: false,
      },
      {
        handle: "nmpv3-plus-skin-studio-deep",
        kind: "skin",
        source: "assets/skins/user/studio-deep/skin.json",
        dependencies: ["nmpv3-plus-runtime"],
        module: false,
      },
    ]);
    expect(plan.localizedConfig.settings.defaultSkin).toBe("glass");
    expect(plan.localizedConfig.settings.hostSyncEnabled).toBe(true);
    expect(plan.localizedConfig.settings.apiBaseUrl).toBe(
      NMPV3_DEFAULT_API_BASE_URL,
    );
    expect(plan.localizedConfig.settings.extensionPackages).toEqual([
      {
        manifestUrl: "assets/extensions/user/user-wave/manifest.json",
        entryUrl: "assets/extensions/user/user-wave/index.js",
        styleUrl: "assets/extensions/user/user-wave/style.css",
      },
    ]);
    expect(plan.localizedConfig.settings.skinPackages).toEqual([
      {
        manifestUrl: "assets/skins/user/studio-deep/skin.json",
        cssUrl: "assets/skins/user/studio-deep/skin.css",
      },
    ]);
  });

  it("declares settings-page fields for all advanced WordPress controls", () => {
    const fields = createNMPv3PlusWordPressSettingsFields();

    expect(fields.map((field) => field.key)).toEqual([
      "apiBaseUrl",
      "defaultSkin",
      "enabledSkins",
      "enabledExtensions",
      "localMusicJsonUrl",
      "customLyricsUrl",
      "customTranslationLyricsUrl",
      "hostSyncEnabled",
      "pageLinkingEnabled",
    ]);
    expect(fields.find((field) => field.key === "defaultSkin")).toMatchObject({
      type: "select",
      options: expect.arrayContaining([{ label: "Glass", value: "glass" }]),
    });
    expect(
      fields.find((field) => field.key === "enabledExtensions"),
    ).toMatchObject({
      type: "multiselect",
      options: expect.arrayContaining([
        { label: "Visualizer", value: "visualizer" },
        { label: "Host sync", value: "host-sync" },
      ]),
    });
  });

  it("creates Gutenberg block metadata with advanced NMPv3+ attributes", () => {
    const metadata = createNMPv3PlusBlockMetadata({
      defaultSkin: "vinyl",
      localMusicJsonUrl: "/music/local.json",
      customLyricsUrl: "/lyrics/local.lrc",
      customTranslationLyricsUrl: "/lyrics/local.zh.lrc",
      pageLinkingEnabled: true,
    });

    expect(metadata.name).toBe("netease-mini-player/nmpv3-plus");
    expect(metadata.supports.html).toBe(false);
    expect(metadata.attributes.skin.default).toBe("vinyl");
    expect(metadata.attributes.localMusicJsonUrl.default).toBe(
      "/music/local.json",
    );
    expect(metadata.attributes.customLyricsUrl.default).toBe(
      "/lyrics/local.lrc",
    );
    expect(metadata.attributes.customTranslationLyricsUrl.default).toBe(
      "/lyrics/local.zh.lrc",
    );
    expect(metadata.attributes.pageLinking.default).toBe(true);
  });

  it("maps WordPress settings to the same custom build pipeline as the CLI", () => {
    expect(
      createNMPv3PlusWordPressBuildConfig({
        enabledExtensions: ["media-session"],
        enabledSkins: ["minimal"],
        userExtensions: [
          {
            name: "user-wave",
            entry: "extensions/user/wave/index.js",
            manifest: "extensions/user/wave/manifest.json",
          },
        ],
        userSkins: [
          {
            name: "studio-deep",
            manifest: "skins/user/studio-deep/skin.json",
          },
        ],
      }),
    ).toMatchObject({
      extensions: ["media-session"],
      skins: ["minimal"],
      userExtensions: [
        {
          name: "user-wave",
          entry: "extensions/user/wave/index.js",
          manifest: "extensions/user/wave/manifest.json",
        },
      ],
      userSkins: [
        {
          name: "studio-deep",
          manifest: "skins/user/studio-deep/skin.json",
        },
      ],
      output: {
        runtime: "assets/nmpv3-plus.wordpress.js",
        extensionsDir: "assets/extensions/official",
        userExtensionsDir: "assets/extensions/user",
        skinsDir: "assets/skins",
        userSkinsDir: "assets/skins/user",
        manifest: "assets/nmpv3-plus.manifest.json",
      },
    });
  });

  it("describes the installable Advanced WordPress plugin package", () => {
    expect(createNMPv3PlusWordPressPluginPackagePlan()).toEqual({
      mainFile: "packages/wordpress/plugin/netease-mini-player-v3-plus.php",
      blockMetadataFile: "packages/wordpress/plugin/block.json",
      blockEditorFile: "packages/wordpress/plugin/assets/block-editor.js",
      browserBootstrapFile:
        "packages/wordpress/plugin/assets/nmpv3-plus.wordpress.js",
      shortcodeTag: "nmpv3plus",
      settingsOption: "nmpv3plus_settings",
      settingsPageSlug: "nmpv3plus",
      blockName: "netease-mini-player/nmpv3-plus",
      requiredHooks: [
        "init",
        "admin_menu",
        "admin_init",
        "wp_enqueue_scripts",
        "enqueue_block_editor_assets",
      ],
      assetLayout: {
        baseRuntime: "assets/nmpv3.min.js",
        bootstrap: "assets/nmpv3-plus.wordpress.js",
        runtimeModule: "assets/nmpv3-plus.runtime.js",
        chunks: "assets/chunks/**",
        packages: "assets/packages/**",
        extensions: "assets/extensions/**",
        skins: "assets/skins/{skin}.json",
        skinStyles: "assets/skins/{skin}.css",
      },
    });
  });

  it("ships a real WordPress plugin file for settings, block, shortcode, and assets", () => {
    expect(pluginSource).toContain("Plugin Name: NeteaseMiniPlayer v3 Plus");
    expect(pluginSource).toContain("add_options_page(");
    expect(pluginSource).toContain("register_setting(");
    expect(pluginSource).toContain("register_block_type(");
    expect(pluginSource).toContain("add_shortcode(self::SHORTCODE");
    expect(pluginSource).toContain("wp_enqueue_script(");
    expect(pluginSource).toContain("'nmpv3'");
    expect(pluginSource).toContain("nmpv3.min.js");
    expect(pluginSource).toContain(
      "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php",
    );
    expect(pluginSource).toContain("wp_add_inline_script(");
    expect(pluginSource).toContain("'nmpv3'");
    expect(pluginSource).toContain("window.NMPv3Config");
    expect(pluginSource).toContain("nmpv3-plus.wordpress.js");
    expect(pluginSource).toContain("array('nmpv3')");
    expect(pluginSource).toContain(
      "wp_script_add_data('nmpv3-plus-runtime', 'type', 'module')",
    );
    expect(pluginSource).toContain("'Custom API'");
    expect(pluginSource).toContain("'Local music JSON'");
    expect(pluginSource).toContain("'Custom lyrics'");
    expect(pluginSource).toContain("'Custom translation lyrics'");
    expect(pluginSource).toContain("'Host page sync'");
    expect(pluginSource).toContain("'Plugin switches'");
    expect(pluginSource).toContain("'Skin selection'");
    expect(pluginSource).toContain("enqueue_block_editor_assets");
    expect(pluginSource).toContain("'nmpv3-plus-block-editor'");
    expect(pluginSource).toContain("'nmpv3-plus-runtime'");
  });

  it("ships Gutenberg block metadata and editor controls", () => {
    expect(JSON.parse(blockMetadataSource)).toMatchObject({
      apiVersion: 3,
      name: "netease-mini-player/nmpv3-plus",
      editorScript: "nmpv3-plus-block-editor",
      script: "nmpv3-plus-runtime",
      attributes: {
        source: { type: "string", default: "netease" },
        localMusicJsonUrl: { type: "string", default: "" },
        customLyricsUrl: { type: "string", default: "" },
        customTranslationLyricsUrl: { type: "string", default: "" },
        hostSync: { type: "boolean", default: false },
      },
    });

    expect(blockEditorSource).toContain(
      'wp.blocks.registerBlockType("netease-mini-player/nmpv3-plus"',
    );
    expect(blockEditorSource).toContain('label: "Local music JSON"');
    expect(blockEditorSource).toContain('label: "Custom lyrics URL"');
    expect(blockEditorSource).toContain(
      'label: "Custom translation lyrics URL"',
    );
    expect(blockEditorSource).toContain('label: "Host page sync"');
    expect(blockEditorSource).toContain('label: "Page linking"');
    expect(blockEditorSource).toContain('"nmp-player"');
    expect(blockEditorSource).toContain("createPreviewAttrs");
    expect(blockEditorSource).toContain("nmpv3plus:refresh");
    expect(blockEditorSource).not.toContain("nmpv3plus-block-placeholder");
  });

  it("renders the Gutenberg editor preview as a real configured nmp-player", () => {
    const previousWindow = globalThis.window;
    const registeredBlocks: Array<{
      name: string;
      settings: {
        edit(props: {
          clientId: string;
          attributes: Record<string, unknown>;
          setAttributes(values: Record<string, unknown>): void;
        }): unknown;
      };
    }> = [];
    const dispatchedEvents: string[] = [];

    class TestCustomEvent extends Event {
      readonly detail: unknown;

      constructor(type: string, init?: CustomEventInit) {
        super(type, init);
        this.detail = init?.detail;
      }

      initCustomEvent(): void {}
    }

    globalThis.window = {
      CustomEvent: TestCustomEvent,
      NMPv3PlusWordPress: {
        settings: {
          apiBaseUrl: "/api/netease",
          defaultSkin: "glass",
          availableSkins: [{ label: "Glass", value: "glass" }],
        },
      },
      dispatchEvent(event: Event) {
        dispatchedEvents.push(event.type);
        return true;
      },
      wp: {
        blocks: {
          registerBlockType(name: string, settings: unknown) {
            registeredBlocks.push({
              name,
              settings:
                settings as (typeof registeredBlocks)[number]["settings"],
            });
          },
        },
        element: {
          createElement(type: unknown, props: unknown, ...children: unknown[]) {
            return { type, props, children };
          },
          useEffect(effect: () => void) {
            effect();
          },
        },
        blockEditor: {
          InspectorControls: "InspectorControls",
        },
        components: {
          PanelBody: "PanelBody",
          SelectControl: "SelectControl",
          TextControl: "TextControl",
          ToggleControl: "ToggleControl",
        },
      },
    } as unknown as Window & typeof globalThis;
    globalThis.CustomEvent = TestCustomEvent as typeof CustomEvent;

    try {
      Function(blockEditorSource)();
      const block = registeredBlocks[0];
      const tree = block?.settings.edit({
        clientId: "editor-1",
        attributes: {
          source: "local-json",
          songId: "local-song",
          localMusicJsonUrl: "/music/playlist.json",
          customLyricsUrl: "/lyrics/local.lrc",
          customTranslationLyricsUrl: "/lyrics/local.zh.lrc",
          skin: "glass",
          hostSync: true,
          pageLinking: true,
        },
        setAttributes() {},
      });
      const preview = findElementNode(tree, "nmp-player");

      expect(block?.name).toBe("netease-mini-player/nmpv3-plus");
      expect(dispatchedEvents).toContain("nmpv3plus:refresh");
      expect(preview?.props).toMatchObject({
        "source-type": "local-json",
        source: "/music/playlist.json",
        "song-id": "local-song",
        "lyrics-url": "/lyrics/local.lrc",
        "translation-lyrics-url": "/lyrics/local.zh.lrc",
        skin: "glass",
        "host-sync": "true",
        "page-linking": "true",
        "api-base-url": "/api/netease",
      });
    } finally {
      globalThis.window = previousWindow;
    }
  });

  it("ships a WordPress browser bootstrap that starts Plus runtime on real nmp-player nodes", () => {
    expect(wordpressBootstrapSource).toContain(
      'from "./nmpv3-plus.runtime.js"',
    );
    expect(wordpressBootstrapSource).toContain("document.querySelectorAll");
    expect(wordpressBootstrapSource).toContain(
      "nmp-player:not([data-nmpv3-plus-ready])",
    );
    expect(wordpressBootstrapSource).toContain("createNMPv3PlusRuntime");
    expect(wordpressBootstrapSource).toContain(
      "loadNMPv3PlusPlaylistIntoBasePlayer",
    );
    expect(wordpressBootstrapSource).toContain(
      "applyNMPv3PlusLyricsToBasePlayer",
    );
    expect(wordpressBootstrapSource).toContain("loadNMPv3PlusPluginPackage");
    expect(wordpressBootstrapSource).toContain("loadNMPv3PlusSkinPackage");
    expect(wordpressBootstrapSource).toContain("loadDeclaredSource");
    expect(wordpressBootstrapSource).toContain(
      "installDeclaredExtensionPackages",
    );
    expect(wordpressBootstrapSource).toContain("registerDeclaredSkins");
    expect(wordpressBootstrapSource).toContain("runtime.applySkin");
    expect(wordpressBootstrapSource).toContain(
      'import("./extensions/official/visualizer/index.js")',
    );
    expect(wordpressBootstrapSource).toContain(
      "window.NMPv3PlusWordPressRuntimes",
    );
    expect(wordpressBootstrapSource).toContain("nmpv3plus:refresh");
    expect(wordpressBootstrapSource).toContain("syncBasePlayerApi");
    expect(wordpressBootstrapSource).toContain("window.NMPv3.setApiBaseUrl");
    expect(wordpressBootstrapSource).toContain("window.NMPv3ApiBaseUrl");
    expect(wordpressBootstrapSource).toContain(
      "window.NeteaseMiniPlayerApiBaseUrl",
    );
    expect(wordpressBootstrapSource).toContain(
      "window.NMPv3?.getGlobalConfig?.().apiBaseUrl",
    );
    expect(wordpressBootstrapSource).toContain("shouldEnablePageLinking");
    expect(wordpressBootstrapSource).toContain("pageLinking:");
    expect(wordpressBootstrapSource).toContain("translationLyricsUrl");
    expect(wordpressBootstrapSource).toContain("parseStaticLyrics");
  });

  it("materializes an installable WordPress package with NMPv3, Plus runtime, dependency trees, skins, and manifest", async () => {
    const files = new Map<string, string>([
      [
        "packages/wordpress/plugin/netease-mini-player-v3-plus.php",
        "<?php plugin",
      ],
      ["packages/wordpress/plugin/block.json", "{}"],
      ["packages/wordpress/plugin/assets/block-editor.js", "block editor"],
      ["packages/wordpress/plugin/assets/nmpv3-plus.wordpress.js", "bootstrap"],
      ["../nmpv3/dist/nmpv3.min.js", "base nmpv3"],
      [
        "dist/index.js",
        'import "./packages/core/src/index.js"; import "./chunks/runtime.js";',
      ],
      ["dist/packages/core/src/index.js", "core"],
      ["dist/extensions/official/visualizer/index.js", "visualizer"],
      [
        "extensions/official/visualizer/manifest.json",
        '{"name":"nmpv3-plus-extension-visualizer"}',
      ],
      ["extensions/official/visualizer/style.css", ".nmpv3-plus-visualizer{}"],
      ["dist/chunks/runtime.js", "chunk"],
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

    const result = await buildNMPv3PlusWordPressPluginPackage(
      {
        settings: {
          enabledExtensions: ["visualizer"],
          enabledSkins: ["glass"],
          defaultSkin: "glass",
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
        },
        outputRoot: "build/nmpv3-plus-wp",
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

    expect(
      writes.get("build/nmpv3-plus-wp/netease-mini-player-v3-plus.php"),
    ).toBe("<?php plugin");
    expect(writes.get("build/nmpv3-plus-wp/assets/nmpv3.min.js")).toBe(
      "base nmpv3",
    );
    expect(
      writes.get("build/nmpv3-plus-wp/assets/nmpv3-plus.wordpress.js"),
    ).toBe("bootstrap");
    expect(
      writes.get("build/nmpv3-plus-wp/assets/nmpv3-plus.runtime.js"),
    ).toContain("./packages/core/src/index.js");
    expect(
      writes.get("build/nmpv3-plus-wp/assets/packages/core/src/index.js"),
    ).toBe("core");
    expect(
      writes.get(
        "build/nmpv3-plus-wp/assets/extensions/official/visualizer/index.js",
      ),
    ).toBe("visualizer");
    expect(
      writes.get(
        "build/nmpv3-plus-wp/assets/extensions/user/user-wave/index.js",
      ),
    ).toBe("user-wave");
    expect(
      writes.get(
        "build/nmpv3-plus-wp/assets/extensions/official/visualizer/manifest.json",
      ),
    ).toBe('{"name":"nmpv3-plus-extension-visualizer"}');
    expect(
      writes.get(
        "build/nmpv3-plus-wp/assets/extensions/official/visualizer/style.css",
      ),
    ).toBe(".nmpv3-plus-visualizer{}");
    expect(
      writes.get(
        "build/nmpv3-plus-wp/assets/extensions/user/user-wave/manifest.json",
      ),
    ).toBe('{"name":"nmpv3-plus-extension-user-wave"}');
    expect(
      writes.get(
        "build/nmpv3-plus-wp/assets/extensions/user/user-wave/style.css",
      ),
    ).toBe(".nmpv3-player{}");
    expect(writes.get("build/nmpv3-plus-wp/assets/chunks/runtime.js")).toBe(
      "chunk",
    );
    expect(writes.get("build/nmpv3-plus-wp/assets/skins/glass.json")).toBe(
      '{"name":"glass"}',
    );
    expect(writes.get("build/nmpv3-plus-wp/assets/skins/glass.css")).toBe(
      ".nmpv3-plus-skin-glass{}",
    );
    expect(
      writes.get("build/nmpv3-plus-wp/assets/skins/user/studio-deep/skin.json"),
    ).toBe('{"name":"studio-deep"}');
    expect(
      writes.get("build/nmpv3-plus-wp/assets/skins/user/studio-deep/skin.css"),
    ).toBe(".nmpv3-player{}");
    expect(
      JSON.parse(
        writes.get("build/nmpv3-plus-wp/assets/nmpv3-plus.manifest.json") ??
          "{}",
      ),
    ).toMatchObject({
      baseRuntime: "assets/nmpv3.min.js",
      runtime: "assets/nmpv3-plus.wordpress.js",
      extensions: [
        {
          handle: "nmpv3-plus-extension-visualizer",
          source: "assets/extensions/official/visualizer/index.js",
          manifest: "assets/extensions/official/visualizer/manifest.json",
          style: "assets/extensions/official/visualizer/style.css",
        },
        {
          handle: "nmpv3-plus-extension-user-wave",
          source: "assets/extensions/user/user-wave/index.js",
          manifest: "assets/extensions/user/user-wave/manifest.json",
        },
      ],
      skins: [
        {
          handle: "nmpv3-plus-skin-glass",
          source: "assets/skins/glass.json",
          style: "assets/skins/glass.css",
        },
        {
          handle: "nmpv3-plus-skin-studio-deep",
          source: "assets/skins/user/studio-deep/skin.json",
          style: "assets/skins/user/studio-deep/skin.css",
        },
      ],
      settings: {
        defaultSkin: "glass",
      },
    });
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/extensions/official/visualizer/index.js",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/extensions/user/user-wave/index.js",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/extensions/official/visualizer/manifest.json",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/extensions/official/visualizer/style.css",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/extensions/user/user-wave/manifest.json",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/extensions/user/user-wave/style.css",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/skins/user/studio-deep/skin.json",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/skins/user/studio-deep/skin.css",
    );
    expect(result.written).toContain(
      "build/nmpv3-plus-wp/assets/skins/glass.css",
    );
  });
});

function findElementNode(
  value: unknown,
  type: string,
): {
  type: unknown;
  props: Record<string, unknown>;
  children: unknown[];
} | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const node = value as {
    type?: unknown;
    props?: Record<string, unknown>;
    children?: unknown[];
  };

  if (node.type === type) {
    return {
      type: node.type,
      props: node.props ?? {},
      children: node.children ?? [],
    };
  }

  for (const child of node.children ?? []) {
    const found = findElementNode(child, type);

    if (found) {
      return found;
    }
  }

  return null;
}
