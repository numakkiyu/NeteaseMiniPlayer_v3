import {
  resolveNMPv3PlusBuildPlan,
  type NMPv3PlusBuildAsset,
  type NMPv3PlusBuildConfig,
  type NMPv3PlusBuildPlan,
  type NMPv3PlusBuildUserExtensionPackage,
  type NMPv3PlusBuildUserSkinPackage,
} from "../../cli/src/index";

export interface NMPv3PlusWordPressSettings {
  apiBaseUrl?: string;
  defaultSkin?: string;
  enabledExtensions?: string[];
  enabledSkins?: string[];
  localMusicJsonUrl?: string;
  customLyricsUrl?: string;
  customTranslationLyricsUrl?: string;
  hostSyncEnabled?: boolean;
  pageLinkingEnabled?: boolean;
  userExtensions?: NMPv3PlusBuildUserExtensionPackage[];
  userSkins?: NMPv3PlusBuildUserSkinPackage[];
}

export interface NMPv3PlusWordPressAsset {
  handle: string;
  kind: "script" | "skin";
  source: string;
  dependencies: string[];
  module: boolean;
}

export interface NMPv3PlusWordPressEnqueuePlan {
  baseRuntime: NMPv3PlusWordPressAsset;
  runtime: NMPv3PlusWordPressAsset;
  extensions: NMPv3PlusWordPressAsset[];
  skins: NMPv3PlusWordPressAsset[];
  localizedConfig: {
    objectName: string;
    settings: NMPv3PlusWordPressRuntimeSettings;
  };
}

export interface NMPv3PlusWordPressRuntimeSettings extends Required<NMPv3PlusWordPressSettings> {
  extensionPackages: NMPv3PlusWordPressExtensionPackageSetting[];
  skinPackages: NMPv3PlusWordPressSkinPackageSetting[];
}

export interface NMPv3PlusWordPressExtensionPackageSetting {
  manifestUrl: string;
  entryUrl?: string;
  styleUrl?: string;
}

export interface NMPv3PlusWordPressSkinPackageSetting {
  manifestUrl: string;
  cssUrl?: string;
}

export interface NMPv3PlusWordPressSettingsField {
  key: keyof NMPv3PlusWordPressSettings;
  label: string;
  type: "text" | "url" | "select" | "multiselect" | "toggle";
  description: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

export interface NMPv3PlusBlockMetadata {
  apiVersion: 3;
  name: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  supports: {
    html: boolean;
  };
  attributes: Record<string, NMPv3PlusBlockAttribute>;
  editorScript: string;
  script: string;
}

export interface NMPv3PlusBlockAttribute {
  type: "string" | "boolean";
  default?: string | boolean;
}

export interface NMPv3PlusWordPressPluginPackagePlan {
  mainFile: string;
  blockMetadataFile: string;
  blockEditorFile: string;
  browserBootstrapFile: string;
  shortcodeTag: "nmpv3plus";
  settingsOption: "nmpv3plus_settings";
  settingsPageSlug: "nmpv3plus";
  blockName: "netease-mini-player/nmpv3-plus";
  requiredHooks: string[];
  assetLayout: {
    baseRuntime: string;
    bootstrap: string;
    runtimeModule: string;
    chunks: string;
    packages: string;
    extensions: string;
    skins: string;
    skinStyles: string;
  };
}

export interface NMPv3PlusWordPressPackageSources {
  nmpv3BrowserBundle: string;
  plusRuntimeModule: string;
  plusDistPackagesDir: string;
  plusDistExtensionsDir: string;
  plusDistChunksDir: string;
  pluginMainFile: string;
  blockMetadataFile: string;
  blockEditorFile: string;
  browserBootstrapFile: string;
}

export interface NMPv3PlusWordPressPackageConfig {
  settings?: NMPv3PlusWordPressSettings;
  outputRoot?: string;
  sources?: Partial<NMPv3PlusWordPressPackageSources>;
}

export interface NMPv3PlusWordPressPackageIO {
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;
}

export interface NMPv3PlusWordPressPackageResult {
  packageRoot: string;
  written: string[];
  manifest: string;
  enqueuePlan: NMPv3PlusWordPressEnqueuePlan;
}

export const NMPV3_DEFAULT_API_BASE_URL =
  "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php";

export const defaultNMPv3PlusWordPressSettings: Required<NMPv3PlusWordPressSettings> =
  {
    apiBaseUrl: NMPV3_DEFAULT_API_BASE_URL,
    defaultSkin: "default",
    enabledExtensions: [],
    enabledSkins: ["default"],
    localMusicJsonUrl: "",
    customLyricsUrl: "",
    customTranslationLyricsUrl: "",
    hostSyncEnabled: false,
    pageLinkingEnabled: false,
    userExtensions: [],
    userSkins: [],
  };

export const nmpv3PlusWordPressExtensionOptions = [
  { label: "Advanced layouts", value: "advanced-layouts" },
  { label: "Visualizer", value: "visualizer" },
  { label: "Host sync", value: "host-sync" },
  { label: "Cover color", value: "cover-color" },
  { label: "Cross-tab sync", value: "cross-tab-sync" },
  { label: "Media Session", value: "media-session" },
  { label: "Custom source", value: "custom-source" },
  { label: "Local lyrics", value: "local-lyrics" },
  { label: "PWA cache", value: "pwa-cache" },
];

export const nmpv3PlusWordPressSkinOptions = [
  { label: "Default", value: "default" },
  { label: "Glass", value: "glass" },
  { label: "Minimal", value: "minimal" },
  { label: "Anime", value: "anime" },
  { label: "Cyber", value: "cyber" },
  { label: "Vinyl", value: "vinyl" },
];

export function createNMPv3PlusWordPressSettingsFields(): NMPv3PlusWordPressSettingsField[] {
  return [
    {
      key: "apiBaseUrl",
      label: "API base URL",
      type: "url",
      description: "NeteaseCloudMusicApi-compatible endpoint for NetEase data.",
    },
    {
      key: "defaultSkin",
      label: "Default skin",
      type: "select",
      description: "Default NMPv3+ skin applied to new blocks.",
      options: nmpv3PlusWordPressSkinOptions,
    },
    {
      key: "enabledSkins",
      label: "Enabled skins",
      type: "multiselect",
      description: "Skin packages available to editors and shortcodes.",
      options: nmpv3PlusWordPressSkinOptions,
    },
    {
      key: "enabledExtensions",
      label: "Enabled extensions",
      type: "multiselect",
      description: "Plugin files included in the custom deployment plan.",
      options: nmpv3PlusWordPressExtensionOptions,
    },
    {
      key: "localMusicJsonUrl",
      label: "Local music JSON",
      type: "url",
      description: "Default local-json playlist URL for custom-source blocks.",
    },
    {
      key: "customLyricsUrl",
      label: "Custom lyrics URL",
      type: "url",
      description: "Default LRC lyrics URL used by local-lyrics integration.",
    },
    {
      key: "customTranslationLyricsUrl",
      label: "Custom translation lyrics URL",
      type: "url",
      description:
        "Default translated LRC URL merged with the custom lyrics URL.",
    },
    {
      key: "hostSyncEnabled",
      label: "Host page sync",
      type: "toggle",
      description: "Mirror player state into host page attributes and tokens.",
    },
    {
      key: "pageLinkingEnabled",
      label: "Page linking",
      type: "toggle",
      description: "Allow blocks to opt into host page linkage behavior.",
    },
  ];
}

export function normalizeNMPv3PlusWordPressSettings(
  settings: NMPv3PlusWordPressSettings = {},
): Required<NMPv3PlusWordPressSettings> {
  return {
    ...defaultNMPv3PlusWordPressSettings,
    ...settings,
    enabledExtensions: unique(settings.enabledExtensions ?? []),
    enabledSkins: unique(settings.enabledSkins ?? ["default"]),
    defaultSkin: settings.defaultSkin || "default",
    hostSyncEnabled: Boolean(settings.hostSyncEnabled),
    pageLinkingEnabled: Boolean(settings.pageLinkingEnabled),
    userExtensions: settings.userExtensions ?? [],
    userSkins: settings.userSkins ?? [],
  };
}

export function createNMPv3PlusWordPressBuildConfig(
  settings: NMPv3PlusWordPressSettings,
): NMPv3PlusBuildConfig {
  const normalized = normalizeNMPv3PlusWordPressSettings(settings);

  return {
    extensions: normalized.enabledExtensions,
    skins: normalized.enabledSkins,
    userExtensions: normalized.userExtensions,
    userSkins: normalized.userSkins,
    output: {
      runtime: "assets/nmpv3-plus.wordpress.js",
      extensionsDir: "assets/extensions/official",
      userExtensionsDir: "assets/extensions/user",
      skinsDir: "assets/skins",
      userSkinsDir: "assets/skins/user",
      manifest: "assets/nmpv3-plus.manifest.json",
    },
  };
}

export function createNMPv3PlusWordPressEnqueuePlan(
  settings: NMPv3PlusWordPressSettings = {},
  buildPlan: NMPv3PlusBuildPlan = resolveNMPv3PlusBuildPlan(
    createNMPv3PlusWordPressBuildConfig(settings),
  ),
): NMPv3PlusWordPressEnqueuePlan {
  const normalized = normalizeNMPv3PlusWordPressSettings(settings);

  return {
    baseRuntime: {
      handle: "nmpv3",
      kind: "script",
      source: "assets/nmpv3.min.js",
      dependencies: [],
      module: false,
    },
    runtime: {
      ...toWordPressAsset(buildPlan.runtime, ["nmpv3"]),
      source: "assets/nmpv3-plus.wordpress.js",
    },
    extensions: buildPlan.extensions.map((asset) =>
      toWordPressAsset(asset, ["nmpv3-plus-runtime"]),
    ),
    skins: buildPlan.skins.map((asset) =>
      toWordPressAsset(asset, ["nmpv3-plus-runtime"]),
    ),
    localizedConfig: {
      objectName: "NMPv3PlusWordPress",
      settings: createWordPressRuntimeSettings(normalized),
    },
  };
}

function createWordPressRuntimeSettings(
  settings: Required<NMPv3PlusWordPressSettings>,
): NMPv3PlusWordPressRuntimeSettings {
  return {
    ...settings,
    extensionPackages: settings.userExtensions.map((extension) => ({
      manifestUrl: `assets/extensions/user/${extension.name}/manifest.json`,
      entryUrl: `assets/extensions/user/${extension.name}/index.js`,
      styleUrl: extension.style
        ? `assets/extensions/user/${extension.name}/style.css`
        : undefined,
    })),
    skinPackages: settings.userSkins.map((skin) => ({
      manifestUrl: `assets/skins/user/${skin.name}/skin.json`,
      cssUrl: skin.style
        ? `assets/skins/user/${skin.name}/skin.css`
        : undefined,
    })),
  };
}

export function createNMPv3PlusBlockAttributes(
  settings: NMPv3PlusWordPressSettings = {},
): Record<string, NMPv3PlusBlockAttribute> {
  const normalized = normalizeNMPv3PlusWordPressSettings(settings);

  return {
    source: { type: "string", default: "netease" },
    songId: { type: "string", default: "" },
    playlistId: { type: "string", default: "" },
    localMusicJsonUrl: {
      type: "string",
      default: normalized.localMusicJsonUrl,
    },
    customLyricsUrl: {
      type: "string",
      default: normalized.customLyricsUrl,
    },
    customTranslationLyricsUrl: {
      type: "string",
      default: normalized.customTranslationLyricsUrl,
    },
    skin: { type: "string", default: normalized.defaultSkin },
    hostSync: { type: "boolean", default: normalized.hostSyncEnabled },
    pageLinking: { type: "boolean", default: normalized.pageLinkingEnabled },
  };
}

export function createNMPv3PlusBlockMetadata(
  settings: NMPv3PlusWordPressSettings = {},
): NMPv3PlusBlockMetadata {
  return {
    apiVersion: 3,
    name: "netease-mini-player/nmpv3-plus",
    title: "NMPv3+ Player",
    category: "widgets",
    icon: "format-audio",
    description:
      "Advanced NeteaseMiniPlayer block with skins, extensions, custom source, lyrics, and host sync settings.",
    supports: {
      html: false,
    },
    attributes: createNMPv3PlusBlockAttributes(settings),
    editorScript: "nmpv3-plus-block-editor",
    script: "nmpv3-plus-runtime",
  };
}

export function createNMPv3PlusWordPressPluginPackagePlan(): NMPv3PlusWordPressPluginPackagePlan {
  return {
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
  };
}

export async function buildNMPv3PlusWordPressPluginPackage(
  config: NMPv3PlusWordPressPackageConfig,
  io: NMPv3PlusWordPressPackageIO,
): Promise<NMPv3PlusWordPressPackageResult> {
  const outputRoot = trimPath(config.outputRoot ?? "wordpress/nmpv3-plus");
  const assetsRoot = joinPath(outputRoot, "assets");
  const settings = normalizeNMPv3PlusWordPressSettings(config.settings);
  const enqueuePlan = createNMPv3PlusWordPressEnqueuePlan(settings);
  const sources = {
    ...defaultWordPressPackageSources,
    ...config.sources,
  };
  const written: string[] = [];

  await copyFile(
    io,
    written,
    sources.pluginMainFile,
    joinPath(outputRoot, "netease-mini-player-v3-plus.php"),
  );
  await copyFile(
    io,
    written,
    sources.blockMetadataFile,
    joinPath(outputRoot, "block.json"),
  );
  await copyFile(
    io,
    written,
    sources.blockEditorFile,
    joinPath(assetsRoot, "block-editor.js"),
  );
  await copyFile(
    io,
    written,
    sources.browserBootstrapFile,
    joinPath(assetsRoot, "nmpv3-plus.wordpress.js"),
  );
  await copyFile(
    io,
    written,
    sources.nmpv3BrowserBundle,
    joinPath(assetsRoot, "nmpv3.min.js"),
  );
  await copyFile(
    io,
    written,
    sources.plusRuntimeModule,
    joinPath(assetsRoot, "nmpv3-plus.runtime.js"),
  );

  await copyTree(
    io,
    written,
    sources.plusDistPackagesDir,
    joinPath(assetsRoot, "packages"),
  );
  await copyTree(
    io,
    written,
    sources.plusDistExtensionsDir,
    joinPath(assetsRoot, "extensions"),
  );
  await copyTree(
    io,
    written,
    sources.plusDistChunksDir,
    joinPath(assetsRoot, "chunks"),
  );

  for (const skin of settings.enabledSkins) {
    await copyFile(
      io,
      written,
      resolveKnownSkinSource(skin),
      joinPath(assetsRoot, "skins", `${skin}.json`),
    );
    await copyFile(
      io,
      written,
      resolveKnownSkinStyleSource(skin),
      joinPath(assetsRoot, "skins", `${skin}.css`),
    );
  }

  for (const extension of settings.enabledExtensions) {
    await copyFile(
      io,
      written,
      resolveKnownExtensionManifestSource(extension),
      joinPath(
        assetsRoot,
        "extensions",
        "official",
        extension,
        "manifest.json",
      ),
    );

    const extensionStyle = resolveKnownExtensionStyleSource(extension);

    if (extensionStyle) {
      await copyFile(
        io,
        written,
        extensionStyle,
        joinPath(assetsRoot, "extensions", "official", extension, "style.css"),
      );
    }
  }

  for (const extension of settings.userExtensions) {
    const outputDir = joinPath(
      assetsRoot,
      "extensions",
      "user",
      extension.name,
    );

    await copyFile(
      io,
      written,
      extension.entry,
      joinPath(outputDir, "index.js"),
    );
    await copyFile(
      io,
      written,
      extension.manifest,
      joinPath(outputDir, "manifest.json"),
    );

    if (extension.style) {
      await copyFile(
        io,
        written,
        extension.style,
        joinPath(outputDir, "style.css"),
      );
    }
  }

  for (const skin of settings.userSkins) {
    const outputDir = joinPath(assetsRoot, "skins", "user", skin.name);

    await copyFile(
      io,
      written,
      skin.manifest,
      joinPath(outputDir, "skin.json"),
    );

    if (skin.style) {
      await copyFile(io, written, skin.style, joinPath(outputDir, "skin.css"));
    }
  }

  const manifest = serializeWordPressPackageManifest({
    settings,
    enqueuePlan,
    written,
  });
  await io.writeText(
    joinPath(assetsRoot, "nmpv3-plus.manifest.json"),
    manifest,
  );
  written.push(joinPath(assetsRoot, "nmpv3-plus.manifest.json"));

  return {
    packageRoot: outputRoot,
    written,
    manifest,
    enqueuePlan,
  };
}

function toWordPressAsset(
  asset: NMPv3PlusBuildAsset,
  dependencies: string[],
): NMPv3PlusWordPressAsset {
  return {
    handle:
      asset.kind === "runtime"
        ? "nmpv3-plus-runtime"
        : `nmpv3-plus-${asset.kind}-${asset.name}`,
    kind: asset.kind === "skin" ? "skin" : "script",
    source: asset.output,
    dependencies,
    module: asset.kind !== "skin",
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

const defaultWordPressPackageSources: NMPv3PlusWordPressPackageSources = {
  nmpv3BrowserBundle: "../nmpv3/dist/nmpv3.min.js",
  plusRuntimeModule: "dist/index.js",
  plusDistPackagesDir: "dist/packages",
  plusDistExtensionsDir: "dist/extensions",
  plusDistChunksDir: "dist/chunks",
  pluginMainFile: "packages/wordpress/plugin/netease-mini-player-v3-plus.php",
  blockMetadataFile: "packages/wordpress/plugin/block.json",
  blockEditorFile: "packages/wordpress/plugin/assets/block-editor.js",
  browserBootstrapFile:
    "packages/wordpress/plugin/assets/nmpv3-plus.wordpress.js",
};

async function copyFile(
  io: NMPv3PlusWordPressPackageIO,
  written: string[],
  source: string,
  output: string,
): Promise<void> {
  await io.writeText(output, await io.readText(source));
  written.push(output);
}

async function copyTree(
  io: NMPv3PlusWordPressPackageIO,
  written: string[],
  sourceDir: string,
  outputDir: string,
): Promise<void> {
  const files = (await io.listFiles(sourceDir)).slice().sort();

  if (files.length === 0) {
    throw new Error(
      `NMPv3+ WordPress package source directory is empty: ${sourceDir}`,
    );
  }

  for (const file of files) {
    await copyFile(
      io,
      written,
      file,
      joinPath(outputDir, relativePath(sourceDir, file)),
    );
  }
}

function serializeWordPressPackageManifest(input: {
  settings: Required<NMPv3PlusWordPressSettings>;
  enqueuePlan: NMPv3PlusWordPressEnqueuePlan;
  written: string[];
}): string {
  return `${JSON.stringify(
    {
      version: "3.0.0-alpha.0",
      baseRuntime: input.enqueuePlan.baseRuntime.source,
      runtime: input.enqueuePlan.runtime.source,
      extensions: input.enqueuePlan.extensions.map((asset) => ({
        handle: asset.handle,
        source: asset.source,
        manifest: asset.source.replace(/\/index\.js$/, "/manifest.json"),
        style: resolveExtensionStyleOutput(asset.source, input.settings),
      })),
      skins: input.enqueuePlan.skins.map((asset) => ({
        handle: asset.handle,
        source: asset.source,
        style: resolveSkinStyleOutput(asset.source, input.settings),
      })),
      settings: input.settings,
      files: input.written,
    },
    null,
    2,
  )}\n`;
}

function resolveKnownSkinSource(name: string): string {
  const source = knownWordPressSkins.get(name);

  if (!source) {
    throw new Error(`Unknown NMPv3+ WordPress skin: ${name}`);
  }

  return source;
}

function resolveKnownSkinStyleSource(name: string): string {
  const source = knownWordPressSkinStyles.get(name);

  if (!source) {
    throw new Error(`Unknown NMPv3+ WordPress skin style: ${name}`);
  }

  return source;
}

function resolveKnownExtensionManifestSource(name: string): string {
  const source = knownWordPressExtensionManifests.get(name);

  if (!source) {
    throw new Error(`Unknown NMPv3+ WordPress extension manifest: ${name}`);
  }

  return source;
}

function resolveKnownExtensionStyleSource(name: string): string | undefined {
  return knownWordPressExtensionStyles.get(name);
}

const knownWordPressExtensionManifests = new Map<string, string>([
  ["advanced-layouts", "extensions/official/advanced-layouts/manifest.json"],
  ["visualizer", "extensions/official/visualizer/manifest.json"],
  ["host-sync", "extensions/official/host-sync/manifest.json"],
  ["cover-color", "extensions/official/cover-color/manifest.json"],
  ["cross-tab-sync", "extensions/official/cross-tab-sync/manifest.json"],
  ["media-session", "extensions/official/media-session/manifest.json"],
  ["custom-source", "extensions/official/custom-source/manifest.json"],
  ["local-lyrics", "extensions/official/local-lyrics/manifest.json"],
  ["pwa-cache", "extensions/official/pwa-cache/manifest.json"],
]);

const knownWordPressExtensionStyles = new Map<string, string>([
  ["advanced-layouts", "extensions/official/advanced-layouts/style.css"],
  ["visualizer", "extensions/official/visualizer/style.css"],
]);

const knownWordPressSkins = new Map<string, string>([
  ["default", "skins/official/default/skin.json"],
  ["glass", "skins/official/glass/skin.json"],
  ["minimal", "skins/official/minimal/skin.json"],
  ["anime", "skins/official/anime/skin.json"],
  ["cyber", "skins/official/cyber/skin.json"],
  ["vinyl", "skins/official/vinyl/skin.json"],
]);

const knownWordPressSkinStyles = new Map<string, string>([
  ["default", "skins/official/default/skin.css"],
  ["glass", "skins/official/glass/skin.css"],
  ["minimal", "skins/official/minimal/skin.css"],
  ["anime", "skins/official/anime/skin.css"],
  ["cyber", "skins/official/cyber/skin.css"],
  ["vinyl", "skins/official/vinyl/skin.css"],
]);

function resolveSkinStyleOutput(
  source: string,
  settings: Required<NMPv3PlusWordPressSettings>,
): string | undefined {
  if (source.startsWith("assets/skins/user/")) {
    const userSkin = settings.userSkins.find((skin) =>
      source.endsWith(`/${skin.name}/skin.json`),
    );

    return userSkin?.style
      ? source.replace(/skin\.json$/, "skin.css")
      : undefined;
  }

  return source.replace(/\.json$/, ".css");
}

function resolveExtensionStyleOutput(
  source: string,
  settings: Required<NMPv3PlusWordPressSettings>,
): string | undefined {
  if (source.startsWith("assets/extensions/user/")) {
    const userExtension = settings.userExtensions.find((extension) =>
      source.endsWith(`/${extension.name}/index.js`),
    );

    return userExtension?.style
      ? source.replace(/index\.js$/, "style.css")
      : undefined;
  }

  const officialName = source.match(
    /^assets\/extensions\/official\/([^/]+)\/index\.js$/,
  )?.[1];

  return officialName && knownWordPressExtensionStyles.has(officialName)
    ? source.replace(/index\.js$/, "style.css")
    : undefined;
}

function trimPath(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function joinPath(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split(/[\\/]+/))
    .filter(Boolean)
    .join("/");
}

function relativePath(root: string, file: string): string {
  const normalizedRoot = trimPath(root);
  const normalizedFile = trimPath(file);
  const prefix = `${normalizedRoot}/`;

  if (!normalizedFile.startsWith(prefix)) {
    throw new Error(`NMPv3+ WordPress package file ${file} is outside ${root}`);
  }

  return normalizedFile.slice(prefix.length);
}
