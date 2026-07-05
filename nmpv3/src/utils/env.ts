/**
 * 环境检测工具
 * 所有函数内聚 SSR 兼容，安全返回 null 而不是抛出异常
 */

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

export function getNavigator(): Navigator | null {
  return typeof navigator === "undefined" ? null : navigator;
}

export function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function isMobileViewport(): boolean {
  const browserWindow = getWindow();

  if (!browserWindow) {
    return false;
  }

  return (
    browserWindow.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    browserWindow.innerWidth <= 520
  );
}
