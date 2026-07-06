import { createNMPv3PlusSkinFromManifest } from "../plugin/PluginManifest";
import type {
  NMPv3PlusRemoteSkinPackageInput,
  NMPv3PlusSkin,
  NMPv3PlusSkinPackageInput,
} from "../types";

export function createNMPv3PlusSkinPackage(
  input: NMPv3PlusSkinPackageInput,
): NMPv3PlusSkin {
  const baseSkin = createNMPv3PlusSkinFromManifest(input.manifest);
  const className =
    input.className ??
    `nmpv3-plus-skin-${sanitizeSkinClassName(baseSkin.name)}`;
  const cssText =
    input.cssText && input.scopeCss !== false
      ? scopeNMPv3PlusSkinCss(input.cssText, className)
      : input.cssText;

  return {
    ...baseSkin,
    className,
    cssText,
  };
}

export async function loadNMPv3PlusSkinPackage(
  input: NMPv3PlusRemoteSkinPackageInput,
): Promise<NMPv3PlusSkin> {
  const fetcher = input.fetcher ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    throw new Error("NMPv3+ skin package loading requires fetch");
  }

  const manifestResponse = await fetcher(input.manifestUrl);

  if (!manifestResponse.ok) {
    throw new Error(
      `NMPv3+ skin manifest request failed: ${manifestResponse.status}`,
    );
  }

  const manifest = await manifestResponse.json();
  const cssUrl = input.cssUrl ?? resolveSiblingSkinCssUrl(input.manifestUrl);
  const cssText = cssUrl ? await fetchOptionalCss(fetcher, cssUrl) : undefined;

  return createNMPv3PlusSkinPackage({
    manifest,
    cssText,
    className: input.className,
    scopeCss: input.scopeCss,
  });
}

export function scopeNMPv3PlusSkinCss(
  cssText: string,
  className: string,
): string {
  return scopeCssBlock(cssText, `.${className}`);
}

/**
 * CSS 作用域引擎：将样式规则包裹在指定 className 下
 * 支持 @media/@supports 嵌套、:host 选择器、已作用域规则跳过
 */
function scopeCssBlock(cssText: string, scopeSelector: string): string {
  let output = "";
  let cursor = 0;

  while (cursor < cssText.length) {
    const openIndex = cssText.indexOf("{", cursor);

    if (openIndex === -1) {
      output += cssText.slice(cursor);
      break;
    }

    const selector = cssText.slice(cursor, openIndex).trim();
    const closeIndex = findMatchingBrace(cssText, openIndex);

    if (!selector || closeIndex === -1) {
      output += cssText.slice(cursor);
      break;
    }

    const body = cssText.slice(openIndex + 1, closeIndex);
    output += renderScopedRule(selector, body, scopeSelector);
    cursor = closeIndex + 1;
  }

  return output;
}

function renderScopedRule(
  selector: string,
  body: string,
  scopeSelector: string,
): string {
  if (selector.startsWith("@media") || selector.startsWith("@supports")) {
    return `${selector}{${scopeCssBlock(body, scopeSelector)}}`;
  }

  if (
    selector.startsWith("@keyframes") ||
    selector.startsWith("@font-face") ||
    selector.startsWith("@property")
  ) {
    return `${selector}{${body}}`;
  }

  return `${scopeSelectors(selector, scopeSelector)}{${body}}`;
}

function scopeSelectors(selector: string, scopeSelector: string): string {
  return selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part === ":host") {
        return scopeSelector;
      }

      if (part.startsWith(":host")) {
        return part.replace(":host", scopeSelector);
      }

      if (part.startsWith(scopeSelector)) {
        return part;
      }

      return `${scopeSelector} ${part}`;
    })
    .join(",");
}

function findMatchingBrace(cssText: string, openIndex: number): number {
  let depth = 0;

  for (let index = openIndex; index < cssText.length; index += 1) {
    const char = cssText[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
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
    throw new Error(`NMPv3+ skin CSS request failed: ${response.status}`);
  }

  return response.text();
}

function resolveSiblingSkinCssUrl(manifestUrl: string): string {
  try {
    return new URL("skin.css", manifestUrl).toString();
  } catch {
    const index = manifestUrl.lastIndexOf("/");
    return `${index === -1 ? "" : manifestUrl.slice(0, index + 1)}skin.css`;
  }
}

function sanitizeSkinClassName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
