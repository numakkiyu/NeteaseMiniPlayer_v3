# CDN Usage

NeteaseMiniPlayer v3 is a lightweight embeddable music player UI component library built on NeteaseCloudMusicApi. After the packages are published to npm, you can load them through jsDelivr or unpkg like other JavaScript libraries.

NMPv3 is the default single-file CDN entry. Load NMPv3+ only when you need plugins, skins, sources, lyrics, or host integration. For production sites, pin an exact version instead of using `latest`.

## NMPv3 via jsDelivr

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

Pinned version:

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
```

## NMPv3 via unpkg

```html
<script src="https://unpkg.com/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player song-id="1901371647" theme="auto" layout="mini"></nmp-player>
```

## NMPv3+ via jsDelivr

Load the base player first, then the Plus browser entry:

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@latest/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

## NMPv3+ via unpkg

```html
<script src="https://unpkg.com/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>
<script
  type="module"
  src="https://unpkg.com/netease-mini-player-v3-plus@latest/dist/browser.js"
></script>

<nmp-player
  playlist-id="14273792576"
  plus-extensions="host-sync"
  layout="compact"
></nmp-player>
```

## Recommendation

- Pin versions in production
- Use NMPv3 for normal CDN embedding
- Load NMPv3+ only for plugins, skins, sources, lyrics, or host integration
- Use `api-base-url` or `window.NMPv3Config.apiBaseUrl` for custom API proxies
