import { describe, expect, it } from "vitest";
import { DEFAULT_API_BASE_URL } from "../config/constants";
import {
  configFromElement,
  mergeConfig,
  normalizeConfig,
} from "../config/normalizeConfig";
import { parseShortcode } from "./parseShortcode";
import { readLegacyV2Config } from "./legacyV2";

describe("parseShortcode", () => {
  it("parses NMPv3 playlist shortcodes", () => {
    expect(
      parseShortcode("{nmpv3:playlist=14273792576, theme=dark, layout=mini}"),
    ).toMatchObject({
      playlistId: "14273792576",
      theme: "dark",
      layout: "mini",
    });
  });

  it("parses NMPv2 song shortcodes", () => {
    expect(
      parseShortcode("{nmpv2:song-id=1901371647, position=bottom-left}"),
    ).toMatchObject({
      songId: "1901371647",
      position: "bottom-left",
    });
  });

  it("maps legacy boolean aliases", () => {
    expect(
      parseShortcode("{nmpv3:song=1901371647, lyric=false}"),
    ).toMatchObject({
      songId: "1901371647",
      showLyrics: false,
    });
  });

  it("parses wrapped shortcode content", () => {
    expect(
      parseShortcode(
        "{nmpv3:song=1901371647, api-base-url=/api/netease,\n lyric=false}",
      ),
    ).toMatchObject({
      songId: "1901371647",
      apiBaseUrl: "/api/netease",
      showLyrics: false,
    });
  });

  it("maps embed and legacy auto-pause shortcode semantics", () => {
    expect(
      parseShortcode(
        "{nmpv2:song-id=1901371647, embed=article, auto-pause=true}",
      ),
    ).toMatchObject({
      songId: "1901371647",
      embed: true,
      embedMode: "article",
      autoPauseOnHidden: false,
    });
  });

  it("keeps v2.5 shortcode default embed semantics", () => {
    expect(parseShortcode("{nmpv3:playlist=14273792576}")).toMatchObject({
      playlistId: "14273792576",
      embed: true,
      embedMode: "article",
    });

    expect(
      parseShortcode("{nmpv3:playlist=14273792576, position=bottom-right}"),
    ).toMatchObject({
      playlistId: "14273792576",
      position: "bottom-right",
      embed: false,
      embedMode: "page",
    });
  });

  it("maps v2.5 idle opacity shortcode setting", () => {
    expect(
      parseShortcode("{nmpv2:song-id=1901371647, idle-opacity=0.64}"),
    ).toMatchObject({
      songId: "1901371647",
      idleOpacity: 0.64,
    });
  });
});

describe("normalizeConfig", () => {
  it("uses the v2.5-compatible API proxy by default", () => {
    expect(normalizeConfig()).toMatchObject({
      apiBaseUrl: DEFAULT_API_BASE_URL,
    });
  });

  it("keeps global API defaults when element config is undefined", () => {
    expect(
      mergeConfig(
        { apiBaseUrl: DEFAULT_API_BASE_URL },
        { apiBaseUrl: undefined },
      ),
    ).toMatchObject({
      apiBaseUrl: DEFAULT_API_BASE_URL,
    });
  });

  it("forces article embeds to static mini players without page controls", () => {
    expect(
      normalizeConfig({
        embed: true,
        position: "bottom-right",
        showPlaylist: true,
        draggable: true,
      }),
    ).toMatchObject({
      embedMode: "article",
      layout: "mini",
      position: "static",
      showPlaylist: false,
      draggable: false,
    });
  });

  it("keeps embed and embed mode mutually exclusive", () => {
    expect(
      normalizeConfig({
        embed: true,
        embedMode: "page",
      }),
    ).toMatchObject({
      embed: false,
      embedMode: "page",
    });

    expect(
      normalizeConfig({
        embed: false,
        embedMode: "article",
      }),
    ).toMatchObject({
      embed: true,
      embedMode: "article",
    });
  });

  it("normalizes idle opacity into a safe CSS opacity range", () => {
    expect(normalizeConfig({ idleOpacity: 0.64 })).toMatchObject({
      idleOpacity: 0.64,
    });

    expect(normalizeConfig({ idleOpacity: 2 })).toMatchObject({
      idleOpacity: 1,
    });
  });
});

describe("configFromElement", () => {
  it("reads API, storage, and legacy auto-pause attributes", () => {
    const element = {
      getAttribute(name: string) {
        const attributes: Record<string, string> = {
          "api-base-url": "/api/netease",
          "storage-key": "article-player",
          "auto-pause": "true",
        };

        return attributes[name] ?? null;
      },
      dataset: {},
    } as unknown as HTMLElement;

    expect(configFromElement(element)).toMatchObject({
      apiBaseUrl: "/api/netease",
      storageKey: "article-player",
      autoPauseOnHidden: false,
    });
  });

  it("maps data-embed to article mode", () => {
    const element = {
      getAttribute() {
        return null;
      },
      dataset: {
        embed: "true",
      },
    } as unknown as HTMLElement;

    expect(configFromElement(element)).toMatchObject({
      embed: true,
      embedMode: "article",
    });
  });

  it("lets embed-mode page override embed=true and reads idle opacity", () => {
    const element = {
      getAttribute(name: string) {
        const attributes: Record<string, string> = {
          embed: "true",
          "embed-mode": "page",
          "idle-opacity": "0.66",
        };

        return attributes[name] ?? null;
      },
      dataset: {},
    } as unknown as HTMLElement;

    expect(configFromElement(element)).toMatchObject({
      embed: false,
      embedMode: "page",
      idleOpacity: 0.66,
    });
  });
});

describe("readLegacyV2Config", () => {
  it("maps v2 embed mode to mini layout", () => {
    const element = {
      dataset: {
        songId: "1901371647",
        embed: "true",
        autoPause: "true",
      },
    } as unknown as HTMLElement;

    expect(readLegacyV2Config(element)).toMatchObject({
      songId: "1901371647",
      embed: true,
      embedMode: "article",
      layout: "mini",
      autoPauseOnHidden: false,
    });
  });
});
