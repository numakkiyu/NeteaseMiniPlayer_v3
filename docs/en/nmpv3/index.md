# NMPv3

NMPv3 is the lightweight player package for GitHub Pages, blogs, CMS templates, static sites, basic WordPress frontends, and frontend projects that only need the base NetEase player.

## Goals

- Browser deployment with one `nmpv3.min.js`
- Style injection from JavaScript
- No frontend framework runtime dependency
- NetEase Cloud Music only
- `<nmp-player>`, shortcode, and legacy DOM migration support
- npm installation for frontend projects

## CDN example

```html
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## npm example

```bash
npm install @netease-mini-player/v3
pnpm add @netease-mini-player/v3
```

```ts
import "@netease-mini-player/v3/auto";
```

## Feature scope

| Feature                                | Status            |
| -------------------------------------- | ----------------- |
| NetEase songs and playlists            | Supported         |
| compact, mini, and dock layouts        | Supported         |
| auto, light, and dark themes           | Supported         |
| Lyrics, playlist panel, and play modes | Supported         |
| Shortcodes and v2 DOM migration        | Supported         |
| Plugins, skin packages, custom sources | Not part of NMPv3 |

## Reading path

- [Browser script](./browser)
- [Basic usage](./usage)
- [API and config](./api)
- [Source editing](./source-editing)
- [WordPress Basic](./wordpress)
