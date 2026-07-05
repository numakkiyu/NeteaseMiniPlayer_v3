import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_API_BASE_URL } from "../config/constants";
import { NeteaseApiClient } from "./NeteaseApiClient";

describe("NeteaseApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the v2.5-compatible API proxy by default", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        `${DEFAULT_API_BASE_URL}/lyric?id=api-default-test`,
      );

      return new Response(JSON.stringify({ lrc: { lyric: "" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    await new NeteaseApiClient().getLyrics("api-default-test");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses the configured API proxy when one is provided", async () => {
    const customApiBaseUrl = "https://example.test/netease";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        `${customApiBaseUrl}/lyric?id=api-custom-test`,
      );

      return new Response(JSON.stringify({ lrc: { lyric: "" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    await new NeteaseApiClient(customApiBaseUrl).getLyrics("api-custom-test");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
