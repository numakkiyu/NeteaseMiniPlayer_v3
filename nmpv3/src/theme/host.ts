import { colorLuminance, sampleHostBackground } from "../utils/theme";
import { hexToOklch, rgbToOklch, parseHex } from "./color";
import { palettePresets, type NMPv3PaletteId } from "./presets";
import { hueDistance, type Oklch } from "./color";

/** 宿主色彩分析结果 */
export interface HostColorAnalysis {
  /** 原始背景色字符串 */
  color: string;
  /** WCAG 相对亮度 */
  luminance: number;
  /** 背景色的 OKLCH（解析失败为 null） */
  oklch: Oklch | null;
  /** 是否有明显色相倾向（彩度 ≥ 0.03） */
  chromaful: boolean;
  /** 色相最接近、且明暗倾向匹配的预设 */
  suggestedPaletteId: NMPv3PaletteId | null;
  /** 由亮度判定的明暗 */
  scheme: "light" | "dark";
}

/** 彩度低于此值视为「白/灰/黑」，没有可借用的色相 */
const CHROMA_THRESHOLD = 0.03;

/** 宿主亮度判定明暗的门槛，与 utils/theme.ts 保持一致 */
const LIGHT_THRESHOLD = 0.62;
const DARK_THRESHOLD = 0.38;

function parseRgbString(color: string): [number, number, number] | null {
  const match = color
    .trim()
    .match(
      /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+[\d.]+)?\s*\)$/i,
    );

  if (!match) {
    return parseHex(color);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** 从任意 CSS 颜色字符串得到 OKLCH */
export function cssColorToOklch(color: string): Oklch | null {
  const rgb = parseRgbString(color);

  if (rgb) {
    return rgbToOklch(rgb);
  }

  return hexToOklch(color);
}

/**
 * 分析宿主背景色
 * 给出：明暗、是否有色相倾向、色相最接近的预设
 */
export function analyzeHostColor(
  hostElement: HTMLElement | null,
): HostColorAnalysis | null {
  const sampled = sampleHostBackground(hostElement);

  if (!sampled) {
    return null;
  }

  const oklch = cssColorToOklch(sampled.color);
  const luminance = sampled.luminance;
  const chromaful = oklch != null && oklch.c >= CHROMA_THRESHOLD;

  const scheme: "light" | "dark" =
    luminance >= LIGHT_THRESHOLD
      ? "light"
      : luminance <= DARK_THRESHOLD
        ? "dark"
        : prefersDarkScheme()
          ? "dark"
          : "light";

  let suggestedPaletteId: NMPv3PaletteId | null = null;

  if (chromaful && oklch) {
    // 先按色相找最近的；同色相组内（浅/深成对）再按明暗倾向挑
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestId: NMPv3PaletteId | null = null;

    for (const preset of palettePresets) {
      if (preset.neumorphic) {
        continue; // 拟态色板不参与自动匹配，避免抢走所有中性色宿主
      }

      const seed = scheme === "dark" ? preset.dark : preset.light;
      const distance = hueDistance(seed.hue, oklch.h);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = preset.id;
      }
    }

    suggestedPaletteId = bestId;
  }

  return {
    color: sampled.color,
    luminance,
    oklch,
    chromaful,
    suggestedPaletteId,
    scheme,
  };
}

export function prefersDarkScheme(): boolean {
  try {
    return (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch {
    return false;
  }
}

/** 复用给诊断用：只算亮度 */
export function hostLuminance(host: HTMLElement | null): number | null {
  return colorLuminance(host ? getComputedStyle(host).backgroundColor : "");
}
