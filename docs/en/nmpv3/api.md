# API and Config

NMPv3 exposes `window.NMPv3` and the legacy alias `window.NeteaseMiniPlayer`.

## Global API

```ts
window.NMPv3.init();
window.NMPv3.create("#music", {
  playlistId: "14273792576",
  theme: "auto",
  layout: "compact",
});
window.NMPv3.pauseAll();
window.NMPv3.setApiBaseUrl("/api/netease");
```

## ESM exports

```ts
import {
  createNMPv3Player,
  defineNMPv3,
  parseLrc,
  syncLyric,
} from "netease-mini-player-v3";
```

## Player instance

```ts
await player.play();
player.pause();
await player.next();
await player.previous();
await player.loadSong("1901371647");
await player.loadPlaylist("14273792576");
player.setVolume(0.8);
player.setTheme("dark");
player.setLayout("compact");
await player.updateConfig({ apiBaseUrl: "/api/netease" });
player.destroy();
```

## Custom element controls

`<nmp-player>` exposes supported player controls directly without private-field access or global instance lookup:

```ts
const element = document.querySelector("nmp-player");

await element?.play();
element?.pause();
await element?.next();
await element?.previous();
element?.seekTo(60);
await element?.updateConfig({ theme: "dark" });

const player = element?.getPlayer();
const state = element?.getState();
const song = element?.getCurrentSong();
```

TypeScript projects can use the exported `NMPv3PlayerElement` type for refs and query results.

## Configuration

JavaScript uses camelCase:

```ts
createNMPv3Player("#music", {
  playlistId: "14273792576",
  embedMode: "page",
  apiBaseUrl: "/api/netease",
});
```

HTML uses kebab-case:

```html
<nmp-player
  playlist-id="14273792576"
  embed-mode="page"
  api-base-url="/api/netease"
></nmp-player>
```

## API proxy

Required proxy endpoints:

```txt
/song/detail
/playlist/track/all
/song/url/v1
/lyric
```

NMPv3 does not require login, private user data, download URLs, local matching, or third-party music platform endpoints.
