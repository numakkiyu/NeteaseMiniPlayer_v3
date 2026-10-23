import { describe, expect, it } from "vitest";
import {
  NMPV3_PLUS_API_MAJOR,
  NMPV3_PLUS_API_VERSION,
  isApiVersionCompatible,
} from "./version";

describe("契约版本", () => {
  it("版本号是合法语义化版本", () => {
    expect(NMPV3_PLUS_API_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(NMPV3_PLUS_API_MAJOR).toBe(
      Number.parseInt(NMPV3_PLUS_API_VERSION.split(".")[0], 10),
    );
  });
});

describe("isApiVersionCompatible", () => {
  it("未声明约束时放行", () => {
    expect(isApiVersionCompatible(undefined)).toBe(true);
    expect(isApiVersionCompatible("")).toBe(true);
    expect(isApiVersionCompatible("*")).toBe(true);
    expect(isApiVersionCompatible("x")).toBe(true);
  });

  it("同主版本放行", () => {
    expect(isApiVersionCompatible("^1.0.0")).toBe(true);
    expect(isApiVersionCompatible("~1.9.9")).toBe(true);
    expect(isApiVersionCompatible("1.x")).toBe(true);
    expect(isApiVersionCompatible("1")).toBe(true);
    expect(isApiVersionCompatible("1.0.0")).toBe(true);
  });

  it("不同主版本拒绝", () => {
    expect(isApiVersionCompatible("^2.0.0")).toBe(false);
    expect(isApiVersionCompatible("0.x")).toBe(false);
  });

  it(">= 按主版本下限判断", () => {
    expect(isApiVersionCompatible(">=1.0.0")).toBe(true);
    expect(isApiVersionCompatible(">=0.5.0")).toBe(true);
    expect(isApiVersionCompatible(">=2.0.0")).toBe(false);
  });

  it("可对任意当前版本求值，便于测试未来版本", () => {
    expect(isApiVersionCompatible("^2.0.0", "2.3.1")).toBe(true);
    expect(isApiVersionCompatible("^1.0.0", "2.3.1")).toBe(false);
  });

  it("解析不了的写法放行而不是误拦", () => {
    expect(isApiVersionCompatible("latest")).toBe(true);
    expect(isApiVersionCompatible("  ")).toBe(true);
  });
});
