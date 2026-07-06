import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: "index.ts",
        browser: "browser.ts",
        "packages/core/src/index": "packages/core/src/index.ts",
        "packages/adapters/src/elementProps":
          "packages/adapters/src/elementProps.ts",
        "packages/cli/src/index": "packages/cli/src/index.ts",
        "packages/react/src/index": "packages/react/src/index.ts",
        "packages/vue/src/index": "packages/vue/src/index.ts",
        "packages/next/src/index": "packages/next/src/index.ts",
        "packages/nuxt/src/index": "packages/nuxt/src/index.ts",
        "packages/astro/src/index": "packages/astro/src/index.ts",
        "packages/svelte/src/index": "packages/svelte/src/index.ts",
        "packages/wordpress/src/index": "packages/wordpress/src/index.ts",
        "packages/php/src/index": "packages/php/src/index.ts",
        "extensions/official/index": "extensions/official/index.ts",
        "extensions/official/advanced-layouts/index":
          "extensions/official/advanced-layouts/index.ts",
        "extensions/official/visualizer/index":
          "extensions/official/visualizer/index.ts",
        "extensions/official/host-sync/index":
          "extensions/official/host-sync/index.ts",
        "extensions/official/cover-color/index":
          "extensions/official/cover-color/index.ts",
        "extensions/official/cross-tab-sync/index":
          "extensions/official/cross-tab-sync/index.ts",
        "extensions/official/media-session/index":
          "extensions/official/media-session/index.ts",
        "extensions/official/custom-source/index":
          "extensions/official/custom-source/index.ts",
        "extensions/official/local-lyrics/index":
          "extensions/official/local-lyrics/index.ts",
        "extensions/official/pwa-cache/index":
          "extensions/official/pwa-cache/index.ts",
        "skins/official/index": "skins/official/index.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
  },
});
