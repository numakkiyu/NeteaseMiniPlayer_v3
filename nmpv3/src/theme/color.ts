/**
 * 色彩数学：sRGB ↔ OKLab ↔ OKLCH
 * 用 OKLCH 做计算（感知均匀：调亮度不跑色相），输出 hex / rgba 给 CSS。
 * 公式来自 Björn Ottosson 的 OKLab（2020），无外部依赖。
 */

export interface Oklch {
  /** 感知亮度 0-1 */
  l: number;
  /** 彩度 0-0.4 左右 */
  c: number;
  /** 色相 0-360 */
  h: number;
}

/** 解析 #rgb / #rrggbb / #rrggbbaa 为 0-255 三元组 */
export function parseHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, "");

  if (value.length === 3) {
    const r = parseInt(value[0] + value[0], 16);
    const g = parseInt(value[1] + value[1], 16);
    const b = parseInt(value[2] + value[2], 16);
    return Number.isNaN(r + g + b) ? null : [r, g, b];
  }

  if (value.length === 6 || value.length === 8) {
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return Number.isNaN(r + g + b) ? null : [r, g, b];
  }

  return null;
}

const toLinear = (channel: number): number => {
  const x = channel / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (value: number): number => {
  const x = Math.min(1, Math.max(0, value));
  const gamma = x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
  return Math.round(gamma * 255);
};

/** sRGB 三元组（0-255）→ OKLCH */
export function rgbToOklch(rgb: [number, number, number]): Oklch {
  const r = toLinear(rgb[0]);
  const g = toLinear(rgb[1]);
  const b = toLinear(rgb[2]);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const chroma = Math.hypot(A, B);
  let hue = (Math.atan2(B, A) * 180) / Math.PI;
  if (hue < 0) hue += 360;

  return { l: L, c: chroma, h: hue };
}

/** OKLCH → sRGB 三元组（0-255）。超出 sRGB 色域时按通道钳制 */
export function oklchToRgb(color: Oklch): [number, number, number] {
  const hRad = (color.h * Math.PI) / 180;
  const A = color.c * Math.cos(hRad);
  const B = color.c * Math.sin(hRad);

  const l_ = (color.l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (color.l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (color.l - 0.0894841775 * A - 1.291485548 * B) ** 3;

  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;

  return [fromLinear(r), fromLinear(g), fromLinear(b)];
}

export function hexToOklch(hex: string): Oklch | null {
  const rgb = parseHex(hex);
  return rgb ? rgbToOklch(rgb) : null;
}

const toHexChannel = (value: number): string =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");

export function oklchToHex(color: Oklch): string {
  const [r, g, b] = oklchToRgb(color);
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

export function oklchToRgba(color: Oklch, alpha: number): string {
  const [r, g, b] = oklchToRgb(color);
  const a = Math.min(1, Math.max(0, Math.round(alpha * 1000) / 1000));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** 色相环形距离（0-180） */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(((a - b) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

/** 色相旋转，结果归一到 0-360 */
export function rotateHue(hue: number, delta: number): number {
  return (((hue + delta) % 360) + 360) % 360;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** WCAG 相对亮度（用于对比度计算，与 OKLab 的 L 不同） */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((channel) => {
    const x = channel / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 对比度 1:1 ~ 21:1 */
export function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function oklchContrast(a: Oklch, b: Oklch): number {
  return contrastRatio(oklchToRgb(a), oklchToRgb(b));
}
