import { describe, expect, it } from "vitest";
import binSource from "../bin/nmpv3-plus.mjs?raw";

describe("nmpv3-plus CLI bin", () => {
  it("wires plan and build commands to the real deploy package builder", () => {
    expect(binSource).toContain("Usage: nmpv3-plus <plan|build> [config.json]");
    expect(binSource).toContain(
      "nmpv3-plus add [config.json] <extension-or-skin...>",
    );
    expect(binSource).toContain("buildNMPv3PlusDeployPackage(config");
    expect(binSource).toContain("resolveNMPv3PlusBuildPlan(config)");
    expect(binSource).toContain("serializeNMPv3PlusBuildManifest(plan)");
    expect(binSource).toContain("addNMPv3PlusPackagesToConfig(");
    expect(binSource).toContain('"nmpv3-plus.config.json"');
  });

  it("resolves official package resources from the installed package root", () => {
    expect(binSource).toContain('path.startsWith("dist/")');
    expect(binSource).toContain('path.startsWith("skins/")');
    expect(binSource).toContain('path.startsWith("extensions/official/")');
    expect(binSource).toContain('path.startsWith("packages/")');
    expect(binSource).toContain("return resolve(packageRoot, path)");
  });
});
