# @netease-mini-player/v3

NMPv3 is the lightweight product line. It is the TypeScript/Vite standardization of the v2.5 UI and interaction model, not a detached visual rewrite.

Hard rules:

- Default browser distribution is one JavaScript file.
- Runtime dependencies must remain empty.
- Styles are injected by JavaScript.
- Only NetEase Cloud Music sources are supported.
- Plugins, full skins, custom sources, custom lyrics, and host-page automation belong to NMPv3+.

## v2.5 to v3 Engineering Model

The v3 package keeps the v2.5 lightweight player experience and changes the implementation form:

- The old JavaScript/CSS file pair becomes typed TypeScript modules.
- The browser build still ships as one JavaScript file with injected styles.
- The compact player, mini player, dock/minimized behavior, playlist panel, lyrics area, play-mode controls, state persistence, and v2 DOM/shortcode compatibility remain part of the lightweight line.
- Runtime dependencies stay at zero; framework adapters and extension systems stay out of NMPv3.

## Build Targets

- `dist/nmpv3.min.js`
- `dist/nmpv3.es.js`
- `dist/nmpv3.d.ts`

## Install

```bash
npm install @netease-mini-player/v3
pnpm add @netease-mini-player/v3
```

```ts
import "@netease-mini-player/v3/auto";
```

## Browser Example

After building, open `examples/html/index.html` from a local static server:

```bash
pnpm --filter @netease-mini-player/v3 build
```

The example exercises `<nmp-player>`, `{nmpv3:...}` shortcodes, and legacy `.netease-mini-player` DOM migration.

## Framework Examples

Minimal integration examples are included for common frontend environments:

- `examples/react/NMPv3Player.tsx`
- `examples/vue3/NMPv3Player.vue`
- `examples/next/NMPv3Player.tsx`
- `examples/nuxt/nmpv3.client.ts`
- `examples/astro/NMPv3Player.astro`

## WordPress Basic Example

`examples/wordpress-basic/netease-mini-player-v3.php` is a basic WordPress plugin example for the lightweight product line. It enqueues one `assets/nmpv3.min.js` file and exposes:

```txt
[nmpv3 playlist="14273792576"]
[nmpv3 song="1901371647" theme="dark" layout="mini"]
```

Theme code can also call `nmpv3_render_player(array(...))`, and the site API proxy can be set with the `nmpv3_basic_default_api_base_url` filter.

The WordPress example injects `window.NMPv3Config.apiBaseUrl` before the compiled browser bundle runs, so backend code can replace the default API without editing `dist/nmpv3.min.js`:

```php
add_filter('nmpv3_basic_default_api_base_url', function () {
    return 'https://example.com/NeteaseMiniPlayer/nmp.php';
});
```

## Runtime Scope

NMPv3 includes compact, mini, and dock layouts; NetEase song and playlist loading; playback controls; lyrics; playlist UI; page visibility pause/resume; state persistence for volume, play mode, lyrics, minimized state, and song progress; v2 shortcode/DOM compatibility; scoped hotkeys; MediaSession; and floating-player drag/snap.

Article embeds use `embed="true"` or `embed-mode="article"` and are forced to a static mini player without page-level controls or dragging. Page embeds use `embed-mode="page"` and may use `layout="dock"` with a floating `position`.

Shortcodes keep the v2.5 default embed behavior: omitted `embed` plus no `position` or `position=static` becomes an article embed; omitted `embed` plus a floating position becomes a page player.

Floating minimized players keep the v2.5 idle animation sequence: fade out, dock left/right, pop out on hover or focus, then fade in. Use `idle-opacity` or `--nmpv3-idle-opacity` to tune the docked opacity.

NMPv3 ships with the v2.5-compatible default API proxy hardcoded into the
compiled browser bundle:

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

If that endpoint is unavailable, replace it without rebuilding by using a
per-player `api-base-url`, a preloaded `window.NMPv3Config.apiBaseUrl`, the
scalar `window.NMPv3ApiBaseUrl`, the legacy scalar
`window.NeteaseMiniPlayerApiBaseUrl`, or the runtime
`window.NMPv3.setApiBaseUrl(url)` API.

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
<script src="./dist/nmpv3.min.js"></script>
```

```html
<script>
  window.NMPv3ApiBaseUrl = "/api/netease";
</script>
<script src="./dist/nmpv3.min.js"></script>
```

```html
<script>
  window.NeteaseMiniPlayerApiBaseUrl = "/api/netease";
</script>
<script src="./dist/nmpv3.min.js"></script>
```

```js
window.NMPv3.setApiBaseUrl("/api/netease");
```

Backend-generated JavaScript uses the same contract. PHP, WordPress, or another
server renderer can print `window.NMPv3Config.apiBaseUrl` or
`window.NMPv3ApiBaseUrl` / `window.NeteaseMiniPlayerApiBaseUrl` before
`dist/nmpv3.min.js` loads, or call `window.NMPv3.setApiBaseUrl(url)` after the
bundle has loaded.

The required proxy surface is intentionally small: `/song/detail`, `/playlist/track/all`, `/song/url/v1`, and `/lyric`. Login, download URLs, dynamic covers, local matching, custom music sources, and host-page integration are not part of NMPv3.

DOM events include `nmpv3:ready`, `nmpv3:play`, `nmpv3:pause`, `nmpv3:songchange`, `nmpv3:playlistchange`, and `nmpv3:error`.

## License

Apache License 2.0.
