# NMPv3+

NMPv3+ is the advanced extension framework for NeteaseMiniPlayer v3 Plus. It builds on top of the NMPv3 base player and adds plugins, skins, custom sources, custom lyrics, host integration, framework adapters, and custom build tooling.

## Use cases

- Local JSON playlists or business API sources
- LRC files, translated lyrics, or static lyrics
- Host page attributes, CSS variables, URLs, or DOM state that follows playback
- Official or user plugins
- Official or user skins
- React, Vue3, Nuxt, Astro, or Svelte adapters
- Advanced WordPress integration or deploy package generation

Use [NMPv3](../nmpv3/) for normal embedding.

## Loading order

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.1/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@3.0.1/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

## Recommended app entry

```ts
await createNMPv3PlusApp()
  .source(createLocalJsonSourceAdapter())
  .lyrics(createStaticLyricsAdapter({}))
  .skin(...officialNMPv3PlusSkins)
  .skin("default")
  .use(createHostSyncPlugin())
  .mount({
    root: document.querySelector("nmp-player"),
    player: window.NMPv3?.getPlayers()[0],
  });
```

## Reading path

- [Quick start](./getting-started)
- [Deep customization](./deep-customization)
- [Framework adapters](./frameworks)
- [Plugins and skins](./plugins-skins)
- [Sources and lyrics](./sources-lyrics)
- [Custom build](./custom-build)
