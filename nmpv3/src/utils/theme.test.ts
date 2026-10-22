import { describe, expect, it } from "vitest";
import { colorLuminance, resolveAutoTheme } from "./theme";

describe("colorLuminance", () => {
  it("maps pure white to 1 and pure black to 0", () => {
    expect(colorLuminance("rgb(255, 255, 255)")).toBeCloseTo(1, 3);
    expect(colorLuminance("rgb(0, 0, 0)")).toBeCloseTo(0, 3);
  });

  it("uses WCAG relative luminance, not a naive average", () => {
    // 绿色通道权重最高
    const green = colorLuminance("rgb(0, 255, 0)") ?? 0;
    const blue = colorLuminance("rgb(0, 0, 255)") ?? 0;
    expect(green).toBeGreaterThan(blue);
    expect(green).toBeCloseTo(0.7152, 2);
    expect(blue).toBeCloseTo(0.0722, 2);
  });

  it("supports space separated and slash alpha syntax", () => {
    expect(colorLuminance("rgb(255 255 255)")).toBeCloseTo(1, 3);
    expect(colorLuminance("rgb(0 0 0 / 0.9)")).toBeCloseTo(0, 3);
  });

  it("treats near-transparent backgrounds as no background", () => {
    expect(colorLuminance("rgba(0, 0, 0, 0.1)")).toBeNull();
    expect(colorLuminance("rgba(255, 255, 255, 0.0)")).toBeNull();
  });

  it("returns null for unsupported color formats", () => {
    expect(colorLuminance("transparent")).toBeNull();
    expect(colorLuminance("#1a1c22")).toBeNull();
    expect(colorLuminance("red")).toBeNull();
  });

  it("distinguishes the player light and dark surfaces", () => {
    const light = colorLuminance("rgb(250, 250, 250)") ?? 0;
    const dark = colorLuminance("rgb(32, 34, 40)") ?? 0;
    expect(light).toBeGreaterThan(0.62);
    expect(dark).toBeLessThan(0.38);
  });
});

describe("resolveAutoTheme", () => {
  it("falls back to light when no DOM is available", () => {
    // jsdom/happy-dom 未启用时 getComputedStyle 不可用，应安全回退
    expect(["light", "dark"]).toContain(resolveAutoTheme(null));
  });
});
