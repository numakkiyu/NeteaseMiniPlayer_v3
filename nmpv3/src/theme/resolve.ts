import type { NMPv3Theme } from "../types";
import type { NMPv3ResolvedTheme } from "../utils/theme";
import { rotateHue } from "./color";
import { derivePalette, type DerivedPalette } from "./derive";
import { analyzeHostColor, prefersDarkScheme, type HostColorAnalysis } from "./host";
import { getPalettePreset, type NMPv3PaletteId } from "./presets";

/** 宿主色相拉拢比例：85% 宿主 + 15% 色板，避免「宿主蓝它也蓝」失去辨识度 */
const HOST_HUE_BLEND = 0.85;

export interface PaletteResolveInput {
  paletteId: NMPv3PaletteId;
  /** true = 色相与明暗都听宿主；false = 色相用色板，明暗用色板自带倾向 */
  paletteFollowHost: boolean;
  /** auto 时不覆盖色板倾向；显式 light/dark 时覆盖 */
  theme: NMPv3Theme;
  hostElement: HTMLElement | null;
}

export interface PaletteResolved {
  palette: DerivedPalette;
  host: HostColorAnalysis | null;
  /** 最终色相来源，便于诊断 */
  hueSource: "preset" | "host" | "host-blend";
  schemeSource: "preset" | "host" | "theme" | "system";
}

/** 两个色相按权重插值（走最短弧） */
function blendHue(baseHue: number, targetHue: number, targetWeight: number): number {
  const delta = ((targetHue - baseHue + 540) % 360) - 180;
  return rotateHue(baseHue, delta * targetWeight);
}

/**
 * 仲裁顺序（按用户定义）：
 * 1. paletteFollowHost = true  → 色相听宿主、明暗也听宿主
 * 2. paletteFollowHost = false → 色相用色板；明暗优先 theme 显式值，否则用色板自带倾向
 */
export function resolvePalette(input: PaletteResolveInput): PaletteResolved {
  const preset = getPalettePreset(input.paletteId);

  /*
   * 无论是否「跟随宿主」，都先采样一次宿主背景。
   *
   * 原因：auto 模式的明暗必须由「用户正在看的页面」决定。
   * 若只在 paletteFollowHost 打开时才采样，那么关掉色相跟随后，
   * 明暗会掉回系统偏好 —— 系统是深色时，亮色页面里的播放器却变成深色。
   * paletteFollowHost 只应决定「色相」要不要借宿主的，与明暗无关。
   */
  const hostAnalysis = analyzeHostColor(input.hostElement);
  const host = hostAnalysis;

  /* ---------- 明暗 ---------- */
  let scheme: NMPv3ResolvedTheme;
  let schemeSource: PaletteResolved["schemeSource"];

  if (input.theme !== "auto") {
    // 显式 light / dark 永远最高优先
    scheme = input.theme;
    schemeSource = "theme";
  } else if (hostAnalysis) {
    // auto：跟随宿主页面背景的明暗
    scheme = hostAnalysis.scheme;
    schemeSource = "host";
  } else {
    // 采不到宿主背景（如全透明）才回退系统偏好
    scheme = prefersDarkScheme() ? "dark" : "light";
    schemeSource = "system";
  }

  /* ---------- 色相 ---------- */
  const seed = scheme === "dark" ? preset.dark : preset.light;
  let hue = seed.hue;
  let hueSource: PaletteResolved["hueSource"] = "preset";

  if (input.paletteFollowHost && host?.oklch && host.chromaful) {
    hue = blendHue(seed.hue, host.oklch.h, HOST_HUE_BLEND);
    hueSource = "host-blend";
  } else if (input.paletteFollowHost && host) {
    // 宿主是白/灰/黑：无彩度可借，保留色板色相
    hueSource = "preset";
  }

  const palette = derivePalette(preset, scheme, Math.round(hue * 10) / 10);


  return { palette, host, hueSource, schemeSource };
}

/**
 * 给「宿主取色」推荐一套色板（也可以在 paletteFollowHost = false 时用作 UI 建议）
 */
export function suggestPaletteForHost(
  hostElement: HTMLElement | null,
): NMPv3PaletteId | null {
  return analyzeHostColor(hostElement)?.suggestedPaletteId ?? null;
}
