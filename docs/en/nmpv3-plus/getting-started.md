# NMPv3+ Quick Start

NMPv3+ needs a base NMPv3 player first. Then the Plus framework attaches plugins, skins, sources, lyrics, and host integration to that player.

## Install

```bash
npm install netease-mini-player-v3 netease-mini-player-v3-plus
pnpm add netease-mini-player-v3 netease-mini-player-v3-plus
```

## Browser usage

```html
<script src="/node_modules/netease-mini-player-v3/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="/node_modules/netease-mini-player-v3-plus/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

Without advanced options, the player stays on the base compact UI.

## Enable advanced visuals

```html
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    enabledExtensions: ["advanced-layouts", "visualizer", "host-sync"],
    defaultSkin: "glass",
  };
</script>

<nmp-player
  playlist-id="14273792576"
  skin="glass"
  plus-extensions="advanced-layouts,visualizer"
  plus-layout="cover"
></nmp-player>
```

## Local JSON playlist

```html
<nmp-player
  source-type="local-json"
  source="/music/playlist.json"
  lyric="true"
  layout="compact"
></nmp-player>
```

```json
{
  "songs": [
    {
      "id": "local-001",
      "name": "Local Song",
      "artists": "Artist",
      "picUrl": "/music/cover.jpg",
      "url": "/music/song.mp3",
      "lyricUrl": "/music/song.lrc"
    }
  ]
}
```

## Verification

```bash
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3-plus build
pnpm --filter netease-mini-player-v3-plus ui:smoke
```
