# NMPv3

NeteaseMiniPlayer v3 [NMPv3] is the lightweight player product line. It standardizes the v2.5 UI and interaction model into a TypeScript/Vite/Web Component package while preserving the single-JavaScript deployment path.

## Goals

- One JavaScript file for default browser usage.
- No required CSS file.
- No runtime dependency on React, Vue, Lit, jQuery, or other UI frameworks.
- NetEase Cloud Music only.
- Support CDN usage and modern frontend imports.
- Preserve the v2.5 UI direction, interaction logic, and core NMP v2 behaviors.

## v2.5 to v3 Upgrade Model

NMPv3 is not a visually unrelated rewrite. It keeps the v2.5 player shape and interaction language:

- circular cover / vinyl visual identity
- compact, mini, and dock-style lightweight layouts
- conservative player controls and playlist panel behavior
- mobile simplification that avoids horizontal overflow
- v2 DOM and shortcode compatibility for existing sites

The implementation is changed from the old JavaScript/CSS file pair into typed source modules, generated CSS injection, Web Component registration, ESM output, and a single browser bundle.

## Browser Usage

```html
<script src="./dist/nmpv3.min.js"></script>
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## Frontend Usage

Install with npm:

```bash
npm install @netease-mini-player/v3
```

Or install with pnpm:

```bash
pnpm add @netease-mini-player/v3
```

Import it from JavaScript or TypeScript:

```ts
import "@netease-mini-player/v3/auto";
```

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

NMPv3 hardcodes the v2.5-compatible NetEase proxy as the compiled default:

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

If that endpoint is unavailable, or if you want to use your own proxy, replace
it with any NeteaseCloudMusicApi-compatible endpoint without rebuilding
`dist/nmpv3.min.js`.

Per-player HTML override:

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

Global override before loading the compiled browser bundle:

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
<script src="./dist/nmpv3.min.js"></script>
```

Backend templates that only need to print the endpoint string can use the
scalar alias. The old brand scalar is accepted for legacy templates:

```html
<script>
  window.NMPv3ApiBaseUrl = "/api/netease";
  window.NeteaseMiniPlayerApiBaseUrl = "/api/netease";
</script>
<script src="./dist/nmpv3.min.js"></script>
```

Runtime override after the bundle is loaded:

```js
window.NMPv3.setApiBaseUrl("/api/netease");
```

Backend-generated JavaScript can also set the same global before the compiled
bundle runs, or call `window.NMPv3.setApiBaseUrl(url)` after the bundle has
loaded. The WordPress Basic example does the pre-bundle form with
`wp_add_inline_script(..., 'before')`, and exposes the
`nmpv3_basic_default_api_base_url` filter:

```php
add_filter('nmpv3_basic_default_api_base_url', function () {
    return 'https://example.com/NeteaseMiniPlayer/nmp.php';
});
```

The lightweight player only needs this NeteaseCloudMusicApi surface:

- `/song/detail` with `ids`
- `/playlist/track/all` with `id`, plus optional `limit` and `offset`
- `/song/url/v1` with `id` and `level`
- `/lyric` with `id`

Login, private user data, dynamic covers, download URLs, local music matching,
custom source adapters, and non-NetEase sources are outside NMPv3 and belong to
NMPv3+ or to your own proxy layer.

## Supported Layouts

- `compact`: default embedded mini player with cover, lyrics, progress, volume, play mode, and playlist controls.
- `mini`: article/embed player with reduced controls for narrow spaces.
- `dock`: floating player intended for `top-left`, `top-right`, `bottom-left`, or `bottom-right` positions.

Advanced card, cover, skin, plugin, and host-page integration layouts belong to NMPv3+. NMPv3 should keep the v2.5-style lightweight UI rather than adding a broad layout system.

## Article Embed vs Page Embed

NMPv3 keeps the v2.5 distinction between small article embeds and page-level players.

Use **article embed** for posts, CMS content, iframes, or narrow blocks. It maps legacy `data-embed="true"` to a static mini player, hides page-level controls, disables dragging, and avoids horizontal overflow:

```html
<nmp-player
  song-id="1901371647"
  embed="true"
  embed-mode="article"
  lyric="false"
></nmp-player>
```

Use **page embed** for a normal page player or site-wide floating player. It can keep playlist controls, minimized dock behavior, drag/snap, hotkeys, and MediaSession:

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

For floating minimized players, `idle-opacity` controls the v2.5-style idle
fade/dock opacity. The same value can be adjusted with the
`--nmpv3-idle-opacity` CSS variable.

Legacy v2 markup remains supported:

```html
<div
  class="netease-mini-player"
  data-song-id="1901371647"
  data-embed="true"
  data-lyric="false"
></div>
```

## Events

NMPv3 emits basic DOM events for integration without adding a host-page bridge:

- `nmpv3:ready`
- `nmpv3:play`
- `nmpv3:pause`
- `nmpv3:songchange`
- `nmpv3:playlistchange`
- `nmpv3:error`

## Public API Scope

NMPv3 exposes the browser globals `window.NMPv3` and `window.NeteaseMiniPlayer`, plus importable helpers such as `defineNMPv3` and `createNMPv3Player`.

NMPv3 supports v2-style DOM migration and shortcodes, but it does not include plugin loading, full skin packages, custom music sources, custom lyrics, or host-page automation. Those advanced extension points are reserved for NMPv3+.

## Shortcodes and v2 Compatibility

NMPv3 processes both new and legacy shortcodes:

```txt
{nmpv3:playlist=14273792576, theme=auto, layout=compact}
{nmpv2:song-id=1901371647, position=bottom-left, theme=dark}
```

Shortcodes keep the v2.5 default embed behavior. If `embed` and `embed-mode`
are omitted, a shortcode with no `position` or with `position=static` becomes
an article embed. A shortcode with a floating position such as
`position=bottom-right` becomes a page/floating player unless `embed` is set
explicitly.

Legacy v2 DOM nodes are upgraded in place:

```html
<div
  class="netease-mini-player"
  data-song-id="1901371647"
  data-theme="auto"
  data-position="static"
></div>
```

Set the API proxy with `api-base-url`, `apiBaseUrl`, `window.NMPv3ApiBaseUrl`,
`window.NeteaseMiniPlayerApiBaseUrl`, or the global runtime API:

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

```js
window.NMPv3.setGlobalConfig({ apiBaseUrl: "/api/netease" });
```

The compiled browser bundle keeps
`https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php` as the default API, but the
frontend config, backend-generated JS, and runtime APIs remain available after
deployment so a site can move to another compatible proxy without rebuilding
the player.

Basic variables include `--nmpv3-accent`, `--nmpv3-radius`, `--nmpv3-bg`,
`--nmpv3-text`, and `--nmpv3-idle-opacity`.
