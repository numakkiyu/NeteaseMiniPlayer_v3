import { defineNMPv3PlusPluginPackage } from "./PluginManifest";
import { scopeNMPv3PlusSkinCss } from "../skin/SkinPackage";
import type {
  NMPv3PlusExtensionManifest,
  NMPv3PlusPlugin,
  NMPv3PlusPluginContext,
  NMPv3PlusPluginModule,
  NMPv3PlusPluginPackage,
  NMPv3PlusPluginPackageInput,
  NMPv3PlusRemotePluginPackageInput,
} from "../types";

export function createNMPv3PlusPluginPackage(
  input: NMPv3PlusPluginPackageInput,
): NMPv3PlusPluginPackage {
  const plugin = pluginFromModule(input.module, input.exportName, input.config);
  const className =
    input.className ?? `nmpv3-plus-extension-${sanitizeClassName(plugin.name)}`;
  const cssText =
    input.cssText && input.scopeCss !== false
      ? scopeNMPv3PlusSkinCss(input.cssText, className)
      : input.cssText;
  const wrappedPlugin = cssText
    ? withPluginCss(plugin, {
        className,
        cssText,
      })
    : plugin;

  return defineNMPv3PlusPluginPackage({
    manifest: input.manifest,
    plugin: wrappedPlugin,
  });
}

export async function loadNMPv3PlusPluginPackage(
  input: NMPv3PlusRemotePluginPackageInput,
): Promise<NMPv3PlusPluginPackage> {
  const fetcher = input.fetcher ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    throw new Error("NMPv3+ plugin package loading requires fetch");
  }

  const importer = input.importer ?? defaultPluginImporter;
  const manifestResponse = await fetcher(input.manifestUrl);

  if (!manifestResponse.ok) {
    throw new Error(
      `NMPv3+ extension manifest request failed: ${manifestResponse.status}`,
    );
  }

  const manifest =
    (await manifestResponse.json()) as NMPv3PlusExtensionManifest;
  const entryUrl =
    input.entryUrl ?? resolvePackageUrl(input.manifestUrl, manifest.entry);
  const styleUrl =
    input.styleUrl ??
    (manifest.style
      ? resolvePackageUrl(input.manifestUrl, manifest.style)
      : undefined);
  const [module, cssText] = await Promise.all([
    importer(entryUrl),
    styleUrl ? fetchOptionalCss(fetcher, styleUrl) : undefined,
  ]);

  return createNMPv3PlusPluginPackage({
    manifest,
    module,
    cssText,
    className: input.className,
    exportName: input.exportName,
    config: input.config,
    scopeCss: input.scopeCss,
  });
}

function pluginFromModule(
  moduleInput: unknown,
  exportName = "default",
  config?: Record<string, unknown>,
): NMPv3PlusPlugin {
  const module = asPluginModule(moduleInput);
  const exported =
    module[exportName] ??
    module.default ??
    module.plugin ??
    module.createPlugin;

  if (typeof exported === "function") {
    return exported(config);
  }

  if (isPlugin(exported)) {
    return exported;
  }

  throw new Error(
    `NMPv3+ plugin package export is not a plugin: ${exportName}`,
  );
}

/**
 * 为插件注入 CSS 样式和 className
 * setup 时注入样式到文档、添加 className，cleanup 时移除
 * 同时处理原始插件的同步/异步 cleanup 返回值
 */
function withPluginCss(
  plugin: NMPv3PlusPlugin,
  options: {
    className: string;
    cssText: string;
  },
): NMPv3PlusPlugin {
  return {
    ...plugin,
    setup(ctx) {
      const styleElement = injectPluginCss(ctx, options);

      const cleanupStyle = () => {
        ctx.root?.classList.remove(options.className);
        styleElement?.remove();
      };

      let cleanupResult: ReturnType<NMPv3PlusPlugin["setup"]>;

      try {
        cleanupResult = plugin.setup(ctx);
      } catch (error) {
        cleanupStyle();
        throw error;
      }

      return Promise.resolve(cleanupResult)
        .then((cleanup) => () => {
          if (typeof cleanup === "function") {
            cleanup();
          }

          cleanupStyle();
        })
        .catch((error) => {
          cleanupStyle();
          throw error;
        });
    },
  };
}

function injectPluginCss(
  ctx: NMPv3PlusPluginContext,
  options: {
    className: string;
    cssText: string;
  },
): HTMLStyleElement | undefined {
  const root = ctx.root;
  const doc = root?.ownerDocument;

  if (!root || !doc?.head) {
    return undefined;
  }

  root.classList.add(options.className);
  const styleElement = doc.createElement("style");
  styleElement.dataset.nmpv3PlusExtension = options.className;
  styleElement.textContent = options.cssText;
  doc.head.append(styleElement);
  return styleElement;
}

async function fetchOptionalCss(
  fetcher: typeof fetch,
  cssUrl: string,
): Promise<string | undefined> {
  const response = await fetcher(cssUrl);

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`NMPv3+ extension CSS request failed: ${response.status}`);
  }

  return response.text();
}

function resolvePackageUrl(manifestUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, manifestUrl).toString();
  } catch {
    const index = manifestUrl.lastIndexOf("/");
    return `${index === -1 ? "" : manifestUrl.slice(0, index + 1)}${relativeUrl.replace(/^\.\//, "")}`;
  }
}

function asPluginModule(input: unknown): NMPv3PlusPluginModule {
  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid NMPv3+ plugin module");
  }

  return input as NMPv3PlusPluginModule;
}

function isPlugin(input: unknown): input is NMPv3PlusPlugin {
  return (
    typeof input === "object" &&
    input !== null &&
    "name" in input &&
    typeof input.name === "string" &&
    "setup" in input &&
    typeof input.setup === "function"
  );
}

function sanitizeClassName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultPluginImporter(url: string): Promise<unknown> {
  return import(/* @vite-ignore */ url);
}
