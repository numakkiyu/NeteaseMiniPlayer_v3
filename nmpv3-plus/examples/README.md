# NMPv3+ Examples

Current examples:

- `react/NMPv3PlusPlayer.tsx`: native `<nmp-player>` with React prop mapping, advanced layout, visualizer, host sync, and lyrics URLs.
- `vue3/NMPv3PlusPlayer.vue`: native `<nmp-player>` with Vue attr mapping, host sync, and page linking.
- `next/NMPv3PlusPlayer.tsx`: client component wiring for Next.js App Router with local-json, lyrics, and Plus layout attributes.
- `nuxt/NMPv3PlusPlayer.client.vue`: Nuxt client-only component wiring with custom source and local lyrics extensions.
- `astro/NMPv3PlusPlayer.astro`: Astro component rendering the custom element, user skin URL, and client imports.
- `svelte/NMPv3PlusPlayer.svelte`: Svelte component with `onMount` client imports and user extension URL.
- `wordpress/advanced-settings.ts`: WordPress settings, block metadata, and enqueue plan example.
- `local-json/playlist.json`: local JSON playlist shape for the `local-json` source adapter.
- `custom-build/nmpv3-plus.config.json`: JSON config for `nmpv3-plus plan` and `nmpv3-plus build`.

`examples/examples.test.ts` verifies that framework examples keep using the
real adapter entry points and continue to include Plus-specific attributes such
as `plusExtensions`, `plusLayout`, `lyricsUrl`, `hostSync`, `pageLinking`,
`skinUrl`, and `extensionUrl`.

Additional examples can be added without changing the NMPv3 lightweight package.
