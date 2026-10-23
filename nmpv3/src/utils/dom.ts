import { getDocument } from "./env";

/**
 * 挂载点安全校验
 *
 * 播放器初始化会清空挂载点内容，因此绝不能把 <body> / <html> 当挂载点——
 * 那会把宿主整页内容清掉。
 */
function assertSafeMountPoint(element: HTMLElement): void {
  const doc = getDocument();

  if (!doc) {
    return;
  }

  if (element === doc.body || element === doc.documentElement) {
    throw new Error(
      "NMPv3: 挂载点不能是 <body> 或 <html>（初始化会清空挂载点内容，会抹掉宿主页面）。" +
        ' 请改用专用容器，例如 document.body.appendChild(document.createElement("div"))。',
    );
  }
}

/**
 * 解析并校验挂载点
 * 字符串选择器查不到会抛错，命中 body/html 也会抛错
 */
export function resolveTarget(target: string | HTMLElement): HTMLElement {
  const element =
    typeof target === "string"
      ? getDocument()?.querySelector<HTMLElement>(target)
      : target;

  if (!element) {
    throw new Error(`NMPv3 target not found: ${target}`);
  }

  assertSafeMountPoint(element);
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

/** 目标容器 → 已挂载实例的弱映射，用于防止同一容器被重复初始化 */
const mountedTargets = new WeakMap<HTMLElement, unknown>();

export function markTargetMounted(target: HTMLElement, owner: unknown): void {
  mountedTargets.set(target, owner);
}

export function clearTargetMounted(target: HTMLElement): void {
  mountedTargets.delete(target);
}

export function getTargetOwner(target: HTMLElement): unknown {
  return mountedTargets.get(target);
}
