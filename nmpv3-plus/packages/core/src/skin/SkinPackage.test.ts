import { describe, expect, it, vi } from "vitest";
import {
  createNMPv3PlusSkinPackage,
  loadNMPv3PlusSkinPackage,
  scopeNMPv3PlusSkinCss,
} from "./SkinPackage";

describe("NMPv3+ skin packages", () => {
  it("creates a runtime skin from a user skin.json manifest", () => {
    const skin = createNMPv3PlusSkinPackage({
      manifest: userSkinManifest(),
      cssText:
        ".nmpv3-player{border-radius:24px}.nmpv3-cover,.nmpv3-title{filter:saturate(1.1)}",
    });

    expect(skin).toMatchObject({
      name: "studio-deep",
      className: "nmpv3-plus-skin-studio-deep",
      tokens: {
        "--nmpv3-bg": "rgba(16, 20, 28, 0.92)",
      },
    });
    expect(skin.cssText).toContain(
      ".nmpv3-plus-skin-studio-deep .nmpv3-player{border-radius:24px}",
    );
    expect(skin.cssText).toContain(
      ".nmpv3-plus-skin-studio-deep .nmpv3-cover,.nmpv3-plus-skin-studio-deep .nmpv3-title",
    );
  });

  it("scopes nested media CSS while leaving keyframes global", () => {
    expect(
      scopeNMPv3PlusSkinCss(
        "@media (max-width:600px){.nmpv3-player{box-shadow:none}}@keyframes nmpPulse{from{opacity:.5}to{opacity:1}}",
        "nmpv3-plus-skin-user",
      ),
    ).toBe(
      "@media (max-width:600px){.nmpv3-plus-skin-user .nmpv3-player{box-shadow:none}}@keyframes nmpPulse{from{opacity:.5}to{opacity:1}}",
    );
  });

  it("ignores braces inside comments, strings, and url functions while scoping", () => {
    expect(
      scopeNMPv3PlusSkinCss(
        '/* { ignored } */.nmpv3-player{background:url("data:image/svg+xml;utf8,<svg>{}</svg>");content:"{not a rule}"}.nmpv3-title{color:red}',
        "nmpv3-plus-skin-user",
      ),
    ).toBe(
      '/* { ignored } */.nmpv3-plus-skin-user .nmpv3-player{background:url("data:image/svg+xml;utf8,<svg>{}</svg>");content:"{not a rule}"}.nmpv3-plus-skin-user .nmpv3-title{color:red}',
    );
  });

  it("loads skin.json and adjacent skin.css through fetch", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url === "/skins/user/studio/skin.json") {
        return {
          ok: true,
          json: async () => userSkinManifest(),
        };
      }

      expect(url).toBe("/skins/user/studio/skin.css");
      return {
        ok: true,
        text: async () => ":host .nmpv3-player{background:var(--nmpv3-bg)}",
      };
    });

    const skin = await loadNMPv3PlusSkinPackage({
      manifestUrl: "/skins/user/studio/skin.json",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(skin.name).toBe("studio-deep");
    expect(skin.cssText).toBe(
      ".nmpv3-plus-skin-studio-deep .nmpv3-player{background:var(--nmpv3-bg)}",
    );
  });
});

function userSkinManifest() {
  return {
    name: "studio-deep",
    displayName: "Studio Deep",
    version: "1.0.0",
    author: "User",
    supports: ["mini", "compact", "dock", "card", "cover"],
    tokens: {
      "--nmpv3-bg": "rgba(16, 20, 28, 0.92)",
      "--nmpv3-text": "#f7f2e8",
      "--nmpv3-accent": "#ff8a50",
      "--nmpv3-radius": "18px",
    },
  };
}
