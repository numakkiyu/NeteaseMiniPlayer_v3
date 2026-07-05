import { getDocument } from "./env";

export function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (typeof target !== "string") {
    return target;
  }

  const element = getDocument()?.querySelector<HTMLElement>(target);

  if (!element) {
    throw new Error(`NMPv3 target not found: ${target}`);
  }

  return element;
}

/**
 * 注入一次性样式标签，可安全多次调用（同一 id 只会注入一次）
 */
export function injectStyleOnce(id: string, cssText: string): void {
  const doc = getDocument();

  if (!doc || doc.getElementById(id)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = id;
  style.textContent = cssText;
  doc.head.append(style);
}
