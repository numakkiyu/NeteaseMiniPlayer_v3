import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  hexToOklch,
  hueDistance,
  oklchContrast,
  oklchToHex,
  oklchToRgb,
  parseHex,
  rgbToOklch,
} from "./color";
import { derivePalette } from "./derive";
import {
  defaultPaletteId,
  getPaletteSeed,
  normalizePaletteAlias,
  palettePresets,
  type PalettePreset,
} from "./presets";

describe("颜色解析", () => {
  it("解析 3 位与 6 位 hex", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("#000000")).toEqual([0, 0, 0]);
    expect(parseHex("ff6b35")).toEqual([255, 107, 53]);
    expect(parseHex("#ff6b35ff")).toEqual([255, 107, 53]);
  });

  it("非法输入返回 null", () => {
    expect(parseHex("red")).toBeNull();
    expect(parseHex("#12")).toBeNull();
  });
});

describe("OKLCH 转换", () => {
  it("白与黑的感知亮度收敛到两端", () => {
    expect(hexToOklch("#ffffff")!.l).toBeCloseTo(1, 2);
    expect(hexToOklch("#000000")!.l).toBeCloseTo(0, 2);
  });

  it("sRGB ↔ OKLCH 往返误差小于 1/255", () => {
    const samples: Array<[number, number, number]> = [
      [255, 107, 53],
      [0, 169, 214],
      [122, 102, 255],
      [32, 34, 40],
      [250, 250, 250],
      [22, 23, 27],
      [102, 112, 125],
    ];

    for (const rgb of samples) {
      const back = oklchToRgb(rgbToOklch(rgb));
      for (let i = 0; i < 3; i += 1) {
        expect(Math.abs(back[i] - rgb[i])).toBeLessThanOrEqual(1);
      }
    }
  });

  it("hex 往返保持稳定", () => {
    for (const hex of ["#ff6b35", "#00a9d6", "#7a66ff", "#202228"]) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
    }
  });

  it("色相落在预期区间", () => {
    const ember = hexToOklch("#ff6b35")!;
    const cyan = hexToOklch("#00a9d6")!;
    expect(ember.h).toBeGreaterThan(20);
    expect(ember.h).toBeLessThan(45);
    expect(cyan.h).toBeGreaterThan(210);
    expect(cyan.h).toBeLessThan(260);
  });
});

describe("对比度", () => {
  it("黑白对比度为 21:1", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
  });

  it("同色对比度为 1:1", () => {
    expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBeCloseTo(1, 5);
  });
});

describe("色相距离", () => {
  it("走最短弧", () => {
    expect(hueDistance(10, 350)).toBe(20);
    expect(hueDistance(0, 180)).toBe(180);
    expect(hueDistance(90, 90)).toBe(0);
  });
});

describe("融合色板结构", () => {
  it("共 6 套，id 唯一", () => {
    const ids = palettePresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["dawn", "jade", "azure", "amber", "iris", "mono"]);
  });

  it("默认色板是 dawn", () => {
    expect(defaultPaletteId).toBe("dawn");
  });

  it("每套都同时具备明暗两份种子", () => {
    for (const preset of palettePresets) {
      expect(preset.light.hue, `${preset.id}.light.hue`).toBeGreaterThanOrEqual(0);
      expect(preset.light.chroma, `${preset.id}.light.chroma`).toBeGreaterThan(0);
      expect(preset.dark.hue, `${preset.id}.dark.hue`).toBeGreaterThanOrEqual(0);
      expect(preset.dark.chroma, `${preset.id}.dark.chroma`).toBeGreaterThan(0);
    }
  });

  it("同一套色板明暗两版色相接近（≤20°，切换不跳色）", () => {
    for (const preset of palettePresets) {
      const distance = hueDistance(preset.light.hue, preset.dark.hue);
      expect(distance, `${preset.id} 明暗色相差`).toBeLessThanOrEqual(20);
    }
  });

  it("getPaletteSeed 按明暗取对应种子", () => {
    const preset = palettePresets.find((p) => p.id === "jade")!;
    expect(getPaletteSeed(preset, "light")).toEqual(preset.light);
    expect(getPaletteSeed(preset, "dark")).toEqual(preset.dark);
  });

  it("旧版成对 id 全部能归一化到融合色板", () => {
    const cases: Array<[string, string]> = [
      ["ember", "dawn"],
      ["mint", "jade"],
      ["forest", "jade"],
      ["sky", "azure"],
      ["ocean", "azure"],
      ["butter", "amber"],
      ["lilac", "iris"],
      ["plum", "iris"],
      ["pearl", "mono"],
      ["graphite", "mono"],
    ];
    for (const [legacy, expected] of cases) {
      expect(normalizePaletteAlias(legacy), legacy).toBe(expected);
    }
    expect(normalizePaletteAlias("dawn")).toBe("dawn");
    expect(normalizePaletteAlias("JADE")).toBe("jade");
    expect(normalizePaletteAlias("nope")).toBeNull();
    expect(normalizePaletteAlias(null)).toBeNull();
  });
});

describe("色板派生（明暗双版）", () => {
  it("每套色板在明亮系与暗色系下对比度都达标", () => {
    for (const preset of palettePresets) {
      for (const scheme of ["light", "dark"] as const) {
        const derived = derivePalette(preset, scheme);
        const tag = `${preset.id}/${scheme}`;
        expect(derived.contrast.text, `${tag} 正文`).toBeGreaterThanOrEqual(7);
        expect(derived.contrast.muted, `${tag} 次要`).toBeGreaterThanOrEqual(4.5);
        expect(derived.contrast.accent, `${tag} 强调`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("明亮系底色偏亮，暗色系底色偏暗", () => {
    for (const preset of palettePresets) {
      const light = hexToOklch(derivePalette(preset, "light").variables.surface)!;
      const dark = hexToOklch(derivePalette(preset, "dark").variables.surface)!;
      expect(light.l, `${preset.id} 明亮系底色`).toBeGreaterThan(0.9);
      expect(dark.l, `${preset.id} 暗色系底色`).toBeLessThan(0.35);
    }
  });

  it("同一套色板在两种明暗下主色亮度不同", () => {
    for (const preset of palettePresets) {
      const light = hexToOklch(derivePalette(preset, "light").variables.accent)!;
      const dark = hexToOklch(derivePalette(preset, "dark").variables.accent)!;
      expect(dark.l, preset.id).toBeGreaterThan(light.l);
    }
  });

  it("派生结果包含呼吸动画所需的 4 个 flow 色", () => {
    const derived = derivePalette(palettePresets[0], "light");
    for (const key of ["flow-1", "flow-2", "flow-3", "flow-4"]) {
      expect(derived.variables[key], key).toMatch(/^rgba\(/);
    }
    expect(derived.variables["flow-opacity"]).toBeTruthy();
    expect(derived.variables["flow-speed"]).toBeTruthy();
  });

  it("flow-3 与 flow-4 落在分裂互补区间（主色 +150° / +210°）", () => {
    for (const preset of palettePresets) {
      for (const scheme of ["light", "dark"] as const) {
        const derived = derivePalette(preset, scheme);
        const seed = getPaletteSeed(preset, scheme);
        const rgb = (value: string) =>
          value.match(/\d+/g)!.slice(0, 3).map(Number) as [number, number, number];

        const h3 = rgbToOklch(rgb(derived.variables["flow-3"])).h;
        const h4 = rgbToOklch(rgb(derived.variables["flow-4"])).h;
        const d3 = hueDistance(h3, (seed.hue + 150) % 360);
        const d4 = hueDistance(h4, (seed.hue + 210) % 360);

        const tolerance = preset.neumorphic ? 70 : 14;
        expect(d3, `${preset.id}/${scheme} flow-3`).toBeLessThan(tolerance);
        expect(d4, `${preset.id}/${scheme} flow-4`).toBeLessThan(tolerance);
      }
    }
  });

  it("拟态色板彩度极低（近无彩色）", () => {
    const mono = palettePresets.find((p) => p.id === "mono") as PalettePreset;
    for (const scheme of ["light", "dark"] as const) {
      const accent = hexToOklch(derivePalette(mono, scheme).variables.accent)!;
      expect(accent.c, scheme).toBeLessThan(0.06);
    }
  });

  it("主色对比度不足时自动压亮度而不是改色相", () => {
    // 流金（黄）在亮底上最容易不达标
    const amber = palettePresets.find((p) => p.id === "amber")!;
    const derived = derivePalette(amber, "light");
    const accent = hexToOklch(derived.variables.accent)!;
    expect(
      oklchContrast(accent, hexToOklch(derived.variables.surface)!),
    ).toBeGreaterThanOrEqual(3);
    expect(hueDistance(accent.h, amber.light.hue)).toBeLessThan(12);
  });

  it("宿主色相覆盖时保持传入的色相", () => {
    const preset = palettePresets.find((p) => p.id === "azure")!;
    const derived = derivePalette(preset, "light", 200);
    const accent = hexToOklch(derived.variables.accent)!;
    expect(hueDistance(accent.h, 200)).toBeLessThan(12);
  });
});
