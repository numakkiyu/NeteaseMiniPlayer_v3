import { defineNMPv3PlusConfig } from "./packages/cli/src/index";

export default defineNMPv3PlusConfig({
  extensions: ["visualizer", "host-sync", "media-session"],
  skins: ["default", "glass", "vinyl"],
  output: {
    runtime: "dist/nmpv3-plus.runtime.js",
    extensionsDir: "dist/plugins",
    skinsDir: "dist/skins",
    manifest: "dist/nmpv3-plus.manifest.json",
  },
});
