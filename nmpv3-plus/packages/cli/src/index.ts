export interface NMPv3PlusBuildConfig {
  extensions?: string[];
  skins?: string[];
  userExtensions?: NMPv3PlusBuildUserExtensionPackage[];
  userSkins?: NMPv3PlusBuildUserSkinPackage[];
  output?: {
    runtime?: string;
    bootstrap?: string;
    extensionsDir?: string;
    userExtensionsDir?: string;
    skinsDir?: string;
    userSkinsDir?: string;
    manifest?: string;
    packagesDir?: string;
    chunksDir?: string;
  };
}

export interface NMPv3PlusBuildUserExtensionPackage {
  name: string;
  entry: string;
  manifest: string;
  style?: string;
  outputDir?: string;
}

export interface NMPv3PlusBuildUserSkinPackage {
  name: string;
  manifest: string;
  style?: string;
  outputDir?: string;
}

export interface NMPv3PlusBuildAsset {
  name: string;
  kind:
    | "runtime"
    | "bootstrap"
    | "extension"
    | "extension-manifest"
    | "extension-style"
    | "skin"
    | "skin-style";
  source: string;
  output: string;
  tag: string;
}

export interface NMPv3PlusBuildPlan {
  runtime: NMPv3PlusBuildAsset;
  bootstrap: NMPv3PlusBuildAsset;
  extensions: NMPv3PlusBuildAsset[];
  extensionManifests: NMPv3PlusBuildAsset[];
  extensionStyles: NMPv3PlusBuildAsset[];
  skins: NMPv3PlusBuildAsset[];
  skinStyles: NMPv3PlusBuildAsset[];
  assets: NMPv3PlusBuildAsset[];
  dependencyTrees: NMPv3PlusBuildDependencyTree[];
  manifestPath: string;
  htmlTags: string[];
}

export interface NMPv3PlusBuildIO {
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;
}

export interface NMPv3PlusBuildResult {
  plan: NMPv3PlusBuildPlan;
  written: string[];
  manifest: string;
}

export interface NMPv3PlusAddResult {
  config: NMPv3PlusBuildConfig;
  addedExtensions: string[];
  addedSkins: string[];
}

export interface NMPv3PlusBuildDependencyTree {
  name: "packages" | "extensions" | "chunks";
  source: string;
  output: string;
}

const officialExtensions = new Map<string, string>([
  ["advanced-layouts", "dist/extensions/official/advanced-layouts/index.js"],
  ["visualizer", "dist/extensions/official/visualizer/index.js"],
  ["host-sync", "dist/extensions/official/host-sync/index.js"],
  ["cover-color", "dist/extensions/official/cover-color/index.js"],
  ["cross-tab-sync", "dist/extensions/official/cross-tab-sync/index.js"],
  ["media-session", "dist/extensions/official/media-session/index.js"],
  ["custom-source", "dist/extensions/official/custom-source/index.js"],
  ["local-lyrics", "dist/extensions/official/local-lyrics/index.js"],
  ["pwa-cache", "dist/extensions/official/pwa-cache/index.js"],
]);

const officialExtensionManifests = new Map<string, string>([
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

const officialExtensionStyles = new Map<string, string>([
  ["advanced-layouts", "extensions/official/advanced-layouts/style.css"],
  ["visualizer", "extensions/official/visualizer/style.css"],
]);

const officialSkins = new Map<string, string>([
  ["default", "skins/official/default/skin.json"],
  ["glass", "skins/official/glass/skin.json"],
  ["minimal", "skins/official/minimal/skin.json"],
  ["anime", "skins/official/anime/skin.json"],
  ["cyber", "skins/official/cyber/skin.json"],
  ["vinyl", "skins/official/vinyl/skin.json"],
]);

const officialSkinStyles = new Map<string, string>([
  ["default", "skins/official/default/skin.css"],
  ["glass", "skins/official/glass/skin.css"],
  ["minimal", "skins/official/minimal/skin.css"],
  ["anime", "skins/official/anime/skin.css"],
  ["cyber", "skins/official/cyber/skin.css"],
  ["vinyl", "skins/official/vinyl/skin.css"],
]);

export function defineNMPv3PlusConfig(
  config: NMPv3PlusBuildConfig,
): NMPv3PlusBuildConfig {
  return config;
}

export function addNMPv3PlusPackagesToConfig(
  config: NMPv3PlusBuildConfig = {},
  names: string[],
): NMPv3PlusAddResult {
  const addedExtensions: string[] = [];
  const addedSkins: string[] = [];
  const next: NMPv3PlusBuildConfig = {
    ...config,
    extensions: [...(config.extensions ?? [])],
    skins: [...(config.skins ?? [])],
  };

  for (const name of names) {
    if (!name) {
      continue;
    }

    if (officialExtensions.has(name)) {
      addUnique(next.extensions ?? [], name);
      if (!(config.extensions ?? []).includes(name)) {
        addedExtensions.push(name);
      }
      continue;
    }

    if (officialSkins.has(name)) {
      addUnique(next.skins ?? [], name);
      if (!(config.skins ?? []).includes(name)) {
        addedSkins.push(name);
      }
      continue;
    }

    throw new Error(`Unknown NMPv3+ package: ${name}`);
  }

  resolveNMPv3PlusBuildPlan(next);

  return {
    config: next,
    addedExtensions,
    addedSkins,
  };
}

/**
 * 将构建配置解析为部署计划
 * 展开 "all" 为全部已注册扩展/皮肤、校验 ESM 输出布局、生成 HTML 标签
 */
export function resolveNMPv3PlusBuildPlan(
  config: NMPv3PlusBuildConfig = {},
): NMPv3PlusBuildPlan {
  const runtimeOutput = normalizePath(
    config.output?.runtime ?? "dist/nmpv3-plus.runtime.js",
  );
  const runtimeDir = dirnamePath(runtimeOutput);
  const output = {
    runtime: runtimeOutput,
    bootstrap: normalizePath(
      config.output?.bootstrap ??
        joinPath(runtimeDir, "nmpv3-plus.bootstrap.js"),
    ),
    extensionsDir: normalizePath(
      config.output?.extensionsDir ??
        joinPath(runtimeDir, "extensions/official"),
    ),
    userExtensionsDir: normalizePath(
      config.output?.userExtensionsDir ??
        joinPath(runtimeDir, "extensions/user"),
    ),
    skinsDir: normalizePath(
      config.output?.skinsDir ?? joinPath(runtimeDir, "skins"),
    ),
    userSkinsDir: normalizePath(
      config.output?.userSkinsDir ?? joinPath(runtimeDir, "skins/user"),
    ),
    manifest: normalizePath(
      config.output?.manifest ??
        joinPath(runtimeDir, "nmpv3-plus.manifest.json"),
    ),
    packagesDir: normalizePath(
      config.output?.packagesDir ?? joinPath(runtimeDir, "packages"),
    ),
    chunksDir: normalizePath(
      config.output?.chunksDir ?? joinPath(runtimeDir, "chunks"),
    ),
  };

  assertPreservedEsmLayout(output.extensionsDir, runtimeDir);

  const extensionNames = expandSelection(
    config.extensions ?? [],
    officialExtensions,
  );
  const skinNames = expandSelection(config.skins ?? [], officialSkins);
  const userExtensions = normalizeUserExtensionPackages(
    config.userExtensions ?? [],
  );
  const userSkins = normalizeUserSkinPackages(config.userSkins ?? []);

  const runtime = createAsset({
    name: "runtime",
    kind: "runtime",
    source: "dist/index.js",
    output: output.runtime,
  });
  const bootstrap = createAsset({
    name: "bootstrap",
    kind: "bootstrap",
    source: "dist/browser.js",
    output: output.bootstrap,
  });
  const extensions = extensionNames.map((name) =>
    createAsset({
      name,
      kind: "extension",
      source: resolveKnownSource(name, officialExtensions, "extension"),
      output: `${trimSlash(output.extensionsDir)}/${name}/index.js`,
    }),
  );
  const extensionManifests = extensionNames.map((name) =>
    createAsset({
      name,
      kind: "extension-manifest",
      source: resolveKnownSource(
        name,
        officialExtensionManifests,
        "extension manifest",
      ),
      output: `${trimSlash(output.extensionsDir)}/${name}/manifest.json`,
    }),
  );
  const extensionStyles = extensionNames
    .filter((name) => officialExtensionStyles.has(name))
    .map((name) =>
      createAsset({
        name,
        kind: "extension-style",
        source: resolveKnownSource(
          name,
          officialExtensionStyles,
          "extension style",
        ),
        output: `${trimSlash(output.extensionsDir)}/${name}/style.css`,
      }),
    );
  const userExtensionAssets = userExtensions.flatMap((extension) =>
    createUserExtensionAssets(extension, output.userExtensionsDir),
  );
  const skins = skinNames.map((name) =>
    createAsset({
      name,
      kind: "skin",
      source: resolveKnownSource(name, officialSkins, "skin"),
      output: `${trimSlash(output.skinsDir)}/${name}.json`,
    }),
  );
  const skinStyles = skinNames.map((name) =>
    createAsset({
      name,
      kind: "skin-style",
      source: resolveKnownSource(name, officialSkinStyles, "skin style"),
      output: `${trimSlash(output.skinsDir)}/${name}.css`,
    }),
  );
  const userSkinAssets = userSkins.flatMap((skin) =>
    createUserSkinAssets(skin, output.userSkinsDir),
  );
  const allExtensions = [
    ...extensions,
    ...userExtensionAssets.filter((asset) => asset.kind === "extension"),
  ];
  const allExtensionManifests = [
    ...extensionManifests,
    ...userExtensionAssets.filter(
      (asset) => asset.kind === "extension-manifest",
    ),
  ];
  const allExtensionStyles = userExtensionAssets.filter(
    (asset) => asset.kind === "extension-style",
  );
  allExtensionStyles.unshift(...extensionStyles);
  const allSkins = [
    ...skins,
    ...userSkinAssets.filter((asset) => asset.kind === "skin"),
  ];
  const allSkinStyles = userSkinAssets.filter(
    (asset) => asset.kind === "skin-style",
  );
  allSkinStyles.unshift(...skinStyles);
  const assets = [
    runtime,
    bootstrap,
    ...allExtensions,
    ...allExtensionManifests,
    ...allExtensionStyles,
    ...allSkins,
    ...allSkinStyles,
  ];
  const dependencyTrees: NMPv3PlusBuildDependencyTree[] = [
    {
      name: "packages",
      source: "dist/packages",
      output: output.packagesDir,
    },
    {
      name: "extensions",
      source: "dist/extensions",
      output: joinPath(runtimeDir, "extensions"),
    },
    {
      name: "chunks",
      source: "dist/chunks",
      output: output.chunksDir,
    },
  ];

  return {
    runtime,
    bootstrap,
    extensions: allExtensions,
    extensionManifests: allExtensionManifests,
    extensionStyles: allExtensionStyles,
    skins: allSkins,
    skinStyles: allSkinStyles,
    assets,
    dependencyTrees,
    manifestPath: output.manifest,
    htmlTags: [runtime, bootstrap, ...allExtensions, ...allSkins].map(
      (asset) => asset.tag,
    ),
  };
}

export function serializeNMPv3PlusBuildManifest(
  plan: NMPv3PlusBuildPlan,
): string {
  return `${JSON.stringify(
    {
      runtime: plan.runtime.output,
      bootstrap: plan.bootstrap.output,
      extensions: plan.extensions.map((asset) => ({
        name: asset.name,
        output: asset.output,
        manifest:
          plan.extensionManifests.find(
            (manifestAsset) => manifestAsset.name === asset.name,
          )?.output ?? "",
        style:
          plan.extensionStyles.find(
            (styleAsset) => styleAsset.name === asset.name,
          )?.output ?? undefined,
      })),
      skins: plan.skins.map((asset) => ({
        name: asset.name,
        output: asset.output,
        style:
          plan.skinStyles.find((styleAsset) => styleAsset.name === asset.name)
            ?.output ?? undefined,
      })),
      dependencyTrees: plan.dependencyTrees,
      htmlTags: plan.htmlTags,
    },
    null,
    2,
  )}\n`;
}

export function generateNMPv3PlusHtmlTags(
  config: NMPv3PlusBuildConfig = {},
): string {
  return `${resolveNMPv3PlusBuildPlan(config).htmlTags.join("\n")}\n`;
}

export async function buildNMPv3PlusDeployPackage(
  config: NMPv3PlusBuildConfig,
  io: NMPv3PlusBuildIO,
): Promise<NMPv3PlusBuildResult> {
  const plan = resolveNMPv3PlusBuildPlan(config);
  const written: string[] = [];

  for (const asset of plan.assets) {
    const contents = await io.readText(asset.source);
    await io.writeText(asset.output, contents);
    written.push(asset.output);
  }

  for (const tree of plan.dependencyTrees) {
    await copyTree(io, written, tree.source, tree.output);
  }

  const manifest = serializeNMPv3PlusBuildManifest(plan);
  await io.writeText(plan.manifestPath, manifest);
  written.push(plan.manifestPath);

  return {
    plan,
    written,
    manifest,
  };
}

function expandSelection(
  selection: string[],
  known: Map<string, string>,
): string[] {
  if (selection.includes("all")) {
    return Array.from(
      new Set([...selection.filter((name) => name !== "all"), ...known.keys()]),
    );
  }

  return Array.from(new Set(selection));
}

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function resolveKnownSource(
  name: string,
  known: Map<string, string>,
  kind: string,
): string {
  const source = known.get(name);

  if (!source) {
    throw new Error(`Unknown NMPv3+ ${kind}: ${name}`);
  }

  return source;
}

function createAsset(input: {
  name: string;
  kind: NMPv3PlusBuildAsset["kind"];
  source: string;
  output: string;
}): NMPv3PlusBuildAsset {
  const tag =
    input.kind === "extension-manifest" ||
    input.kind === "extension-style" ||
    input.kind === "skin-style"
      ? ""
      : input.kind === "skin"
        ? `<link rel="preload" as="fetch" href="/${input.output}" crossorigin>`
        : `<script type="module" src="/${input.output}"></script>`;

  return {
    ...input,
    tag,
  };
}

function createUserExtensionAssets(
  extension: NMPv3PlusBuildUserExtensionPackage,
  userExtensionsDir: string,
): NMPv3PlusBuildAsset[] {
  const outputDir =
    extension.outputDir ?? `${trimSlash(userExtensionsDir)}/${extension.name}`;
  const assets = [
    createAsset({
      name: extension.name,
      kind: "extension",
      source: extension.entry,
      output: `${trimSlash(outputDir)}/index.js`,
    }),
    createAsset({
      name: extension.name,
      kind: "extension-manifest",
      source: extension.manifest,
      output: `${trimSlash(outputDir)}/manifest.json`,
    }),
  ];

  if (extension.style) {
    assets.push(
      createAsset({
        name: extension.name,
        kind: "extension-style",
        source: extension.style,
        output: `${trimSlash(outputDir)}/style.css`,
      }),
    );
  }

  return assets;
}

function createUserSkinAssets(
  skin: NMPv3PlusBuildUserSkinPackage,
  userSkinsDir: string,
): NMPv3PlusBuildAsset[] {
  const outputDir = skin.outputDir ?? `${trimSlash(userSkinsDir)}/${skin.name}`;
  const assets = [
    createAsset({
      name: skin.name,
      kind: "skin",
      source: skin.manifest,
      output: `${trimSlash(outputDir)}/skin.json`,
    }),
  ];

  if (skin.style) {
    assets.push(
      createAsset({
        name: skin.name,
        kind: "skin-style",
        source: skin.style,
        output: `${trimSlash(outputDir)}/skin.css`,
      }),
    );
  }

  return assets;
}

function normalizeUserExtensionPackages(
  extensions: NMPv3PlusBuildUserExtensionPackage[],
): NMPv3PlusBuildUserExtensionPackage[] {
  return uniquePackages(extensions, "user extension").map((extension) => {
    if (!extension.entry || !extension.manifest) {
      throw new Error(
        `NMPv3+ user extension requires entry and manifest: ${extension.name}`,
      );
    }

    return extension;
  });
}

function normalizeUserSkinPackages(
  skins: NMPv3PlusBuildUserSkinPackage[],
): NMPv3PlusBuildUserSkinPackage[] {
  return uniquePackages(skins, "user skin").map((skin) => {
    if (!skin.manifest) {
      throw new Error(`NMPv3+ user skin requires manifest: ${skin.name}`);
    }

    return skin;
  });
}

function uniquePackages<TPackage extends { name: string }>(
  packages: TPackage[],
  kind: string,
): TPackage[] {
  const seen = new Set<string>();
  const result: TPackage[] = [];

  for (const pkg of packages) {
    if (!pkg.name) {
      throw new Error(`NMPv3+ ${kind} package requires a name`);
    }

    if (seen.has(pkg.name)) {
      throw new Error(`Duplicate NMPv3+ ${kind} package: ${pkg.name}`);
    }

    seen.add(pkg.name);
    result.push(pkg);
  }

  return result;
}

function trimSlash(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+$/, "");
}

function normalizePath(value: string): string {
  return trimSlash(value);
}

async function copyTree(
  io: NMPv3PlusBuildIO,
  written: string[],
  sourceDir: string,
  outputDir: string,
): Promise<void> {
  const files = (await io.listFiles(sourceDir)).slice().sort();

  if (files.length === 0) {
    throw new Error(`NMPv3+ deploy source directory is empty: ${sourceDir}`);
  }

  for (const file of files) {
    const relative = relativePath(sourceDir, file);
    const output = joinPath(outputDir, relative);
    await io.writeText(output, await io.readText(file));
    written.push(output);
  }
}

function assertPreservedEsmLayout(
  extensionsDir: string,
  runtimeDir: string,
): void {
  const expected = joinPath(runtimeDir, "extensions/official");

  if (trimSlash(extensionsDir) !== expected) {
    throw new Error(
      `NMPv3+ extensionsDir must preserve Vite ESM layout: ${expected}`,
    );
  }
}

function dirnamePath(path: string): string {
  const normalized = trimSlash(path).replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "." : normalized.slice(0, index);
}

function joinPath(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split(/[\\/]+/))
    .filter(Boolean)
    .join("/");
}

function relativePath(root: string, file: string): string {
  const normalizedRoot = trimSlash(root).replace(/\\/g, "/");
  const normalizedFile = trimSlash(file).replace(/\\/g, "/");
  const prefix = `${normalizedRoot}/`;

  if (!normalizedFile.startsWith(prefix)) {
    throw new Error(`NMPv3+ deploy file ${file} is outside ${root}`);
  }

  return normalizedFile.slice(prefix.length);
}
