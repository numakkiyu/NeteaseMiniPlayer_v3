import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        nmpv3: "src/index.ts",
      },
      name: "NMPv3",
      formats: ["es", "iife"],
      fileName: (format) => (format === "es" ? "nmpv3.es.js" : "nmpv3.min.js"),
    },
    rollupOptions: {
      external: [],
      output: {
        footer:
          'if (typeof window !== "undefined" && window.NMPv3 && window.NMPv3.NMPv3) { window.NMPv3 = window.NMPv3.NMPv3; window.NeteaseMiniPlayer = window.NMPv3; }',
      },
    },
  },
});
