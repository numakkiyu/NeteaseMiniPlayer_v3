import { getWindow } from "./env";

export type NMPv3ResolvedTheme = "light" | "dark";

/** 判定亮暗的中性灰区间：宿主亮度落在这里时改为跟随系统偏好 */
const LIGHT_THRESHOLD = 0.62;
const DARK_THRESHOLD = 0.38;

/**
 * 把 CSS 颜色解析成 WCAG 相对亮度（0 = 全黑，1 = 全白）
 * 只处理 rgb()/rgba()，解析失败返回 null
 */
export function colorLuminance(color: string): number | null {
  const match = color
    .trim()
    .match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i);

  if (!match) {
    return null;
  }

  const alpha = match[4] == null ? 1 : Number(match[4]);

  // 近乎全透明的背景等价于"没有背景"，交给上层继续找
  if (!Number.isFinite(alpha) || alpha < 0.5) {
    return null;
  }

  const channels = [match[1], match[2], match[3]].map((value) => {
    const channel = Number(value) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

/** 宿主背景采样结果 */
export interface HostBackground {
  /** 原始 computed 颜色字符串，如 rgb(22, 23, 27) */
  color: string;
  /** WCAG 相对亮度 0-1 */
  luminance: number;
}

/**
 * 从宿主元素向上逐级采样「第一个真正有背景色」的祖先
 * 这样嵌在卡片里的播放器会跟卡片走，而不是被 body 的白色误导
 */
export function sampleHostBackground(
  start: HTMLElement | null,
): HostBackground | null {
  let node: HTMLElement | null = start;

  while (node) {
    const computed =
      typeof getComputedStyle === "function" ? getComputedStyle(node) : null;

    if (computed) {
      const luminance = colorLuminance(computed.backgroundColor);

      if (luminance != null) {
        return { color: computed.backgroundColor, luminance };
      }
    }

    node = node.parentElement;
  }

  return null;
}

/**
 * 只取亮度，保留原有语义（被 resolveAutoTheme 使用）
 */
export function sampleHostLuminance(start: HTMLElement | null): number | null {
  return sampleHostBackground(start)?.luminance ?? null;
}

/** 系统是否偏好深色 */
export function prefersDark(): boolean {
  const browserWindow = getWindow();

  if (!browserWindow || typeof browserWindow.matchMedia !== "function") {
    return false;
  }

  try {
    return browserWindow.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/**
 * 解析 auto 主题的最终明暗
 * 优先级：宿主实际背景亮度 > 系统偏好
 * 宿主背景接近中灰（0.38-0.62）时无法判断，回退到系统偏好
 */
export function resolveAutoTheme(target: HTMLElement | null): NMPv3ResolvedTheme {
  const luminance = sampleHostLuminance(target);

  if (luminance == null) {
    return prefersDark() ? "dark" : "light";
  }

  if (luminance >= LIGHT_THRESHOLD) {
    return "light";
  }

  if (luminance <= DARK_THRESHOLD) {
    return "dark";
  }

  return prefersDark() ? "dark" : "light";
}

/**
 * 监听系统明暗变化，返回解绑函数
 * 老浏览器没有 addEventListener 时回退到 addListener
 */
export function watchSystemTheme(
  handler: () => void,
): () => void {
  const browserWindow = getWindow();

  if (!browserWindow || typeof browserWindow.matchMedia !== "function") {
    return () => {};
  }

  let query: MediaQueryList;

  try {
    query = browserWindow.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    return () => {};
  }

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }

  // Safari 13 及更早只有已废弃的 addListener
  if (typeof query.addListener === "function") {
    query.addListener(handler);
    return () => query.removeListener(handler);
  }

  return () => {};
}
