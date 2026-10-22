import type { NMPv3PaletteId } from "../types";
import type { NMPv3ResolvedTheme } from "../utils/theme";

export type { NMPv3PaletteId };

/** 一种明暗下的种子参数 */
export interface PaletteSeed {
  /** OKLCH 色相（注意不是 sRGB 色相） */
  hue: number;
  /** 彩度上限，决定「艳」的程度 */
  chroma: number;
}

/**
 * 一套色板
 *
 * 每套内含明亮系与暗色系两个种子：最终明暗解析为 light 时用 light，
 * 为 dark 时用 dark——对外只有一个选择项，不再让用户纠结选深还是选浅。
 */
export interface PalettePreset {
  id: NMPv3PaletteId;
  /** 展示名（中文） */
  label: string;
  /** 一句话气质描述 */
  mood: string;
  /** 明亮系种子 */
  light: PaletteSeed;
  /** 暗色系种子 */
  dark: PaletteSeed;
  /** 是否拟态色板（低彩度，靠明暗双影做质感） */
  neumorphic?: boolean;
}

/**
 * 6 套预设色板
 *
 * 注意：hue 是 OKLCH 色相，不是 sRGB/HSL 色相。
 * 例：橙红 #ff6b35 的 sRGB 色相是 16°，OKLCH 色相是 39°。
 * 改色板时请从目标 hex 反算 OKLCH，不要凭 sRGB 直觉填。
 *
 * 每套内部 light / dark 的色相刻意保持接近（8-18° 内），
 * 这样明暗切换时只是明度与彩度变化，色调不会跳变。
 */
export const palettePresets: PalettePreset[] = [
  {
    id: "dawn",
    label: "晨曦",
    mood: "橙红，温暖有活力，默认配色",
    light: { hue: 39, chroma: 0.19 },
    dark: { hue: 39, chroma: 0.19 },
  },
  {
    id: "jade",
    label: "青竹",
    mood: "绿色，明亮清透或沉稳内敛",
    light: { hue: 160, chroma: 0.15 },
    dark: { hue: 152, chroma: 0.16 },
  },
  {
    id: "azure",
    label: "苍穹",
    mood: "蓝色，轻快干净或冷静深邃",
    light: { hue: 240, chroma: 0.15 },
    dark: { hue: 258, chroma: 0.2 },
  },
  {
    id: "amber",
    label: "流金",
    mood: "黄色，柔和温润或暖金厚重",
    light: { hue: 78, chroma: 0.16 },
    dark: { hue: 62, chroma: 0.17 },
  },
  {
    id: "iris",
    label: "紫藤",
    mood: "紫色，轻柔梦幻或浓郁高贵",
    light: { hue: 303, chroma: 0.15 },
    dark: { hue: 305, chroma: 0.19 },
  },
  {
    id: "mono",
    label: "素境",
    mood: "近无彩色，靠明暗双影做质感",
    light: { hue: 261, chroma: 0.02 },
    dark: { hue: 265, chroma: 0.015 },
    neumorphic: true,
  },
];

export const paletteIds: NMPv3PaletteId[] = palettePresets.map((p) => p.id);

export const defaultPaletteId: NMPv3PaletteId = "dawn";

const presetMap = new Map(palettePresets.map((p) => [p.id, p]));

/** 旧版成对色板 id 到新融合色板的映射，保证已写好的配置不失效 */
const legacyAliases: Record<string, NMPv3PaletteId> = {
  ember: "dawn",
  mint: "jade",
  forest: "jade",
  sky: "azure",
  ocean: "azure",
  butter: "amber",
  lilac: "iris",
  plum: "iris",
  pearl: "mono",
  graphite: "mono",
};

export function getPalettePreset(id: NMPv3PaletteId): PalettePreset {
  return presetMap.get(id) ?? presetMap.get(defaultPaletteId)!;
}

/** 取某套色板在指定明暗下该用的种子 */
export function getPaletteSeed(
  preset: PalettePreset,
  scheme: NMPv3ResolvedTheme,
): PaletteSeed {
  return scheme === "dark" ? preset.dark : preset.light;
}

export function isPaletteId(value: unknown): value is NMPv3PaletteId {
  return typeof value === "string" && presetMap.has(value as NMPv3PaletteId);
}

/** 把任意 id（含旧版别名）归一化为当前色板 id，无法识别返回 null */
export function normalizePaletteAlias(value: unknown): NMPv3PaletteId | null {
  if (typeof value !== "string") {
    return null;
  }

  const key = value.trim().toLowerCase();

  if (presetMap.has(key as NMPv3PaletteId)) {
    return key as NMPv3PaletteId;
  }

  return legacyAliases[key] ?? null;
}
