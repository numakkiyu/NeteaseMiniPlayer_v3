import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_API_BASE_URL } from "./constants";
import { defaultConfig } from "./defaultConfig";
import {
  getGlobalConfig,
  refreshGlobalConfigFromWindow,
  resolveConfigWithGlobal,
  setGlobalApiBaseUrl,
  setGlobalConfig,
} from "./globalConfig";
import type { NMPv3Config } from "../types";

describe("globalConfig", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    setGlobalConfig(defaultConfig);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setGlobalConfig(defaultConfig);
  });

  it("keeps the default API when no browser config is provided", () => {
    expect(getGlobalConfig().apiBaseUrl).toBe(DEFAULT_API_BASE_URL);
  });

  it("reads NMPv3Config before the browser bundle initializes", () => {
    stubWindow({
      NMPv3Config: { apiBaseUrl: "https://example.test/nmpv3" },
    });

    expect(refreshGlobalConfigFromWindow().apiBaseUrl).toBe(
      "https://example.test/nmpv3",
    );
  });

  it("supports the legacy NeteaseMiniPlayerConfig alias", () => {
    stubWindow({
      NeteaseMiniPlayerConfig: {
        apiBaseUrl: "https://example.test/legacy",
      },
    });

    expect(refreshGlobalConfigFromWindow().apiBaseUrl).toBe(
      "https://example.test/legacy",
    );
  });

  it("lets NMPv3Config override the legacy global alias", () => {
    stubWindow({
      NeteaseMiniPlayerConfig: {
        apiBaseUrl: "https://example.test/legacy",
      },
      NMPv3Config: { apiBaseUrl: "https://example.test/modern" },
    });

    expect(refreshGlobalConfigFromWindow().apiBaseUrl).toBe(
      "https://example.test/modern",
    );
  });

  it("keeps the global API when an element does not provide api-base-url", () => {
    setGlobalApiBaseUrl("https://example.test/global");

    expect(resolveConfigWithGlobal({ apiBaseUrl: undefined })).toMatchObject({
      apiBaseUrl: "https://example.test/global",
    });
  });

  it("lets a per-player API override the global API", () => {
    setGlobalApiBaseUrl("https://example.test/global");

    expect(
      resolveConfigWithGlobal({ apiBaseUrl: "https://example.test/player" }),
    ).toMatchObject({
      apiBaseUrl: "https://example.test/player",
    });
  });

  it("syncs runtime API updates back to NMPv3Config", () => {
    const browserWindow = stubWindow({});

    setGlobalApiBaseUrl("https://example.test/runtime");

    expect(browserWindow.NMPv3Config).toMatchObject({
      apiBaseUrl: "https://example.test/runtime",
    });
  });
});

function stubWindow(config: Partial<Window>): Window {
  const browserWindow = config as Window & {
    NMPv3Config?: Partial<NMPv3Config>;
    NeteaseMiniPlayerConfig?: Partial<NMPv3Config>;
  };

  vi.stubGlobal("window", browserWindow);

  return browserWindow;
}
