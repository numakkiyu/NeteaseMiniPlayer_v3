import type { NMPv3ResolvedTheme } from "../utils/theme";
import {
  clamp,
  oklchContrast,
  oklchToHex,
  oklchToRgba,
  rotateHue,
  type Oklch,
} from "./color";
import type { PalettePreset } from "./presets";

/** 派生出的 CSS 变量集合（键为不带的 --nmpv3- 前缀的部分） */
export type PaletteVariables = Record<string, string>;

/** 单套色板的完整解析结果，便于调试与诊断面板展示 */
export interface DerivedPalette {
  id: string;
  scheme: NMPv3ResolvedTheme;
  hue: number;
  chroma: number;
  variables: PaletteVariables;
  contrast: {
    text: number;
    muted: number;
    faint: number;
    accent: number;
  };
}

/** 对比度门槛：正文 AAA、次要文字 AA、强调色 AA 大字 */
const CONTRAST_TARGETS = {
  text: 7,
  muted: 4.5,
  faint: 3.2,
  accent: 3,
};

/**
 * 把前景色压到满足对比度
 * 只调亮度，不动色相与彩度——否则「调对比度」会把配色调变味
 */
function ensureContrast(
  foreground: Oklch,
  background: Oklch,
  target: number,
  isLight: boolean,
): Oklch {
  const next: Oklch = { ...foreground };

  for (let step = 0; step < 32; step += 1) {
    if (oklchContrast(next, background) >= target) {
      break;
    }
    next.l = clamp(next.l + (isLight ? -0.02 : 0.02), 0, 1);
  }

  return next;
}

/**
 * 从一个色板种子派生整套变量
 * @param preset 预设色板
 * @param scheme 最终明暗（由 paletteFollowHost / theme / preset.scheme 仲裁得到）
 * @param hueOverride 宿主色相拉拢后的色相（可选）
 */
export function derivePalette(
  preset: PalettePreset,
  scheme: NMPv3ResolvedTheme,
  hueOverride?: number,
): DerivedPalette {
  const isLight = scheme === "light";
  // 每套色板内含明亮系 / 暗色系两份种子，按最终明暗自动取用
  const seed = scheme === "dark" ? preset.dark : preset.light;
  const hue = hueOverride == null ? seed.hue : hueOverride;
  const chromaCap = seed.chroma;
  const isNeumorphic = preset.neumorphic === true;

  /* ---------- 底色与文字 ---------- */
  const surface: Oklch = {
    l: isLight ? 0.985 : 0.235,
    c: isLight ? 0.004 : 0.012,
    h: hue,
  };
  const surfaceStrong: Oklch = {
    l: isLight ? 1 : 0.275,
    c: isLight ? 0.002 : 0.014,
    h: hue,
  };
  const secondaryBg: Oklch = {
    l: isLight ? 0.955 : 0.205,
    c: isLight ? 0.005 : 0.012,
    h: hue,
  };

  /* ---------- 强调色与相似色 ---------- */
  const accentL = isLight ? 0.68 : 0.74;
  const accent: Oklch = { l: accentL, c: chromaCap, h: hue };
  const accent2: Oklch = {
    l: accentL - 0.03,
    c: chromaCap * 0.82,
    h: rotateHue(hue, 28),
  };
  const accent3: Oklch = {
    l: accentL + 0.04,
    c: chromaCap * 0.78,
    h: rotateHue(hue, -32),
  };

  /* ---------- 分裂互补（比 180° 柔和，用于呼吸背景） ---------- */
  const complement1: Oklch = {
    l: accentL - 0.02,
    c: chromaCap * 0.52,
    h: rotateHue(hue, 150),
  };
  const complement2: Oklch = {
    l: accentL + 0.02,
    c: chromaCap * 0.52,
    h: rotateHue(hue, 210),
  };

  /* ---------- 文字层级 ---------- */
  let text: Oklch = {
    l: isLight ? 0.33 : 0.96,
    c: isLight ? 0.012 : 0.008,
    h: hue,
  };
  let muted: Oklch = {
    l: isLight ? 0.53 : 0.8,
    c: isLight ? 0.014 : 0.01,
    h: hue,
  };
  let faint: Oklch = {
    l: isLight ? 0.68 : 0.62,
    c: isLight ? 0.016 : 0.012,
    h: hue,
  };

  text = ensureContrast(text, surface, CONTRAST_TARGETS.text, isLight);
  muted = ensureContrast(muted, surface, CONTRAST_TARGETS.muted, isLight);
  faint = ensureContrast(faint, surface, CONTRAST_TARGETS.faint, isLight);

  // 强调色若对比不足（浅底上的亮色最容易踩到），同样只压亮度
  const accentSafe = ensureContrast(
    accent,
    surface,
    CONTRAST_TARGETS.accent,
    isLight,
  );

  /* ---------- 阴影 ---------- */
  const shadowBoost = isNeumorphic ? 1.35 : 1;
  const shadowDark = oklchToRgba(
    { l: isLight ? 0.32 : 0.05, c: 0.01, h: hue },
    (isLight ? 0.1 : 0.44) * shadowBoost,
  );
  const shadowLight = oklchToRgba(
    { l: isLight ? 1 : 0.9, c: 0.004, h: hue },
    (isLight ? 0.9 : 0.045) * shadowBoost,
  );

  const outsetY = isNeumorphic ? 8 : 6;
  const outsetBlur = isNeumorphic ? 20 : 18;
  const insetSpread = isNeumorphic ? 3 : 2;

  /* ---------- 呼吸色：主色 / 相似色 / 分裂互补 ×2 ---------- */
  const flowAlpha = isLight ? 0.26 : 0.22;
  const flowAlpha2 = isLight ? 0.18 : 0.16;
  const flowAlphaComp = isLight ? 0.13 : 0.12;

  /* ---------- 光斑 / 辉光 / 按钮渐变（供 CSS 引用，避免硬编码旧配色） ---------- */
  const sheen1 = oklchToRgba(accentSafe, isLight ? 0.1 : 0.09);
  const sheen2 = oklchToRgba(accent3, isLight ? 0.08 : 0.07);
  const accentGlow = oklchToRgba(accentSafe, isLight ? 0.28 : 0.34);
  const accentRing = oklchToRgba(accent3, isLight ? 0.42 : 0.38);
  const accentGradient =
    "linear-gradient(145deg, " +
    oklchToRgba(accentSafe, 0.92) +
    ", " +
    oklchToRgba(accent2, 0.78) +
    ", " +
    oklchToRgba(accent3, 0.72) +
    ")";

  const variables: PaletteVariables = {
    "primary-bg": oklchToHex(surface),
    "secondary-bg": oklchToHex(secondaryBg),
    surface: oklchToHex(surface),
    "surface-strong": oklchToHex(surfaceStrong),
    accent: oklchToHex(accentSafe),
    "accent-2": oklchToHex(accent2),
    "accent-3": oklchToHex(accent3),
    "accent-soft": oklchToRgba(accentSafe, isLight ? 0.13 : 0.16),
    track: oklchToRgba(text, isLight ? 0.12 : 0.16),
    text: oklchToHex(text),
    muted: oklchToHex(muted),
    faint: oklchToHex(faint),
    border: oklchToRgba(text, isLight ? 0.08 : 0.08),
    "shadow-light": shadowLight,
    "shadow-dark": shadowDark,
    "shadow-outset": `${outsetY}px ${outsetY + 2}px ${outsetBlur}px ${shadowDark}, -4px -4px 12px ${shadowLight}`,
    "shadow-inset": `inset ${insetSpread}px ${insetSpread}px ${insetSpread + 3}px ${shadowDark}, inset -${insetSpread}px -${insetSpread}px ${insetSpread + 3}px ${shadowLight}`,
    "sheen-1": sheen1,
    "sheen-2": sheen2,
    "accent-glow": accentGlow,
    "accent-ring": accentRing,
    "accent-gradient": accentGradient,
    "flow-1": oklchToRgba(accentSafe, flowAlpha),
    "flow-2": oklchToRgba(accent3, flowAlpha2),
    "flow-3": oklchToRgba(complement1, flowAlphaComp),
    "flow-4": oklchToRgba(complement2, flowAlphaComp),
    "flow-opacity": isLight ? "0.36" : "0.3",
    "flow-speed": isLight ? "11s" : "12s",
  };

  return {
    id: preset.id,
    scheme,
    hue,
    chroma: chromaCap,
    variables,
    contrast: {
      text: Math.round(oklchContrast(text, surface) * 100) / 100,
      muted: Math.round(oklchContrast(muted, surface) * 100) / 100,
      faint: Math.round(oklchContrast(faint, surface) * 100) / 100,
      accent: Math.round(oklchContrast(accentSafe, surface) * 100) / 100,
    },
  };
}
