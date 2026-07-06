export function appendPluginStyle(
  root: HTMLElement,
  id: string,
  cssText: string,
): HTMLStyleElement | null {
  const doc = root.ownerDocument;

  if (!doc?.head) {
    return null;
  }

  const existing = doc.head.querySelector<HTMLStyleElement>(
    `style[data-nmpv3-plus-style="${id}"]`,
  );

  if (existing) {
    return existing;
  }

  const style = doc.createElement("style");
  style.dataset.nmpv3PlusStyle = id;
  style.textContent = cssText;
  doc.head.append(style);
  return style;
}

export function removeElement(element: Element | null | undefined): void {
  element?.parentElement?.removeChild(element);
}

export function createPluginElement<K extends keyof HTMLElementTagNameMap>(
  root: HTMLElement,
  tagName: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const element = root.ownerDocument.createElement(tagName);
  element.className = className;
  return element;
}
