# Browser Script

Browser script usage is the default NMPv3 path. It fits static pages, CMS templates, blog themes, and sites without a frontend build pipeline.

For a copyable standalone page, use the minimal HTML on this page. For public CDN URLs and pinned version examples, read [CDN Usage](../guide/cdn).

## Build the file

```bash
pnpm --filter netease-mini-player-v3 build
```

Use this output in the browser:

```txt
nmpv3/dist/nmpv3.min.js
```

## Minimal HTML

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NMPv3 Demo</title>
  </head>
  <body>
    <nmp-player playlist-id="14273792576"></nmp-player>

    <script src="/assets/nmpv3.min.js"></script>
  </body>
</html>
```

The script registers `<nmp-player>`, scans the page, and injects the base CSS.

## CDN HTML

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## Song and playlist

```html
<nmp-player song-id="1901371647" theme="auto" layout="compact"></nmp-player>
```

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## Article embed

```html
<nmp-player
  song-id="1901371647"
  embed="true"
  embed-mode="article"
  lyric="false"
></nmp-player>
```

Article embeds become static mini players and avoid page-level dragging or playlist panels.

## Floating player

```html
<nmp-player
  playlist-id="14273792576"
  embed-mode="page"
  layout="dock"
  position="bottom-right"
  default-minimized="true"
  idle-opacity="0.72"
  storage-key="site-player"
></nmp-player>
```

## Legacy DOM

```html
<div
  class="netease-mini-player"
  data-song-id="1901371647"
  data-theme="auto"
  data-position="static"
></div>
```

The browser bundle upgrades legacy DOM nodes in place.

## Shortcodes

```txt
{nmpv3:playlist=14273792576, theme=auto, layout=compact}
{nmpv2:song-id=1901371647, position=bottom-left, theme=dark}
```
