# @netease-mini-player/v3-plus

NMPv3+ is the advanced product line for developers and deep customization.

It may include:

- PluginManager
- SkinEngine
- SourceAdapter
- LyricsAdapter
- HostBridge
- CLI
- Framework adapters
- WordPress advanced integration

NMPv3+ can use multiple files and optional third-party dependencies because it is not the default lightweight CDN product.

## Install

```bash
npm install @netease-mini-player/v3-plus
pnpm add @netease-mini-player/v3-plus
```

## Core Runtime

NMPv3+ builds on top of an existing NMPv3 player instance. The base player UI
stays intact; Plus features are explicit opt-in runtime extensions.

```ts
import {
  createNMPv3PlusRuntime,
  createVisualizerPlugin,
  createCoverColorPlugin,
  createHostSyncPlugin,
} from "@netease-mini-player/v3-plus";

const playerElement = document.querySelector("nmp-player");
const runtime = createNMPv3PlusRuntime({
  root: playerElement,
  player: window.NMPv3?.getPlayers()[0],
});

await runtime.installPlugin(createCoverColorPlugin());
await runtime.installPlugin(createVisualizerPlugin({ mode: "bars" }));
await runtime.installPlugin(createHostSyncPlugin());
```

By default the runtime bridges `nmpv3:play`, `nmpv3:pause`,
`nmpv3:songchange`, `nmpv3:playlistchange`, and `nmpv3:error` DOM events into
Plus runtime events such as `play`, `songchange`, and `nmp:songchange`. If
`root` points at the internal `.nmpv3-player` node instead of `<nmp-player>`,
pass the host element as `eventTarget` so plugins still receive real player
events.

## Official Extensions

The current official extension entry points are:

- `advanced-layouts`: opt-in `card` and `cover` layouts.
- `visualizer`: non-layout-shifting bars, wave, or ambient visualizer layer.
- `cover-color`: extracts a dominant cover color into a CSS token.
- `host-sync`: mirrors player events into host page attributes, classes, CSS
  variables, and optional page links.
- `cross-tab-sync`: uses BroadcastChannel for selected playback events.
- `media-session`: configurable Media Session metadata and handlers.
- `custom-source`: registers a user-provided source adapter.
- `local-lyrics`: registers local/static LRC lyrics.
- `pwa-cache`: optional Cache API integration for runtime and song assets.

These are NMPv3+ features. They are not added to the lightweight `nmpv3/`
package.

Every official extension has a validated manifest contract. Runtime code can
bind a manifest to a plugin factory with `defineNMPv3PlusPluginPackage`, and
custom deployment packages copy each selected extension's `manifest.json`
beside its `index.js`.

When `page-linking` is enabled on a player, or `pageLinkingEnabled` is enabled
in the host integration settings, host sync updates linked-song attributes and
the page URL query parameter without changing the base player UI.
For custom host integrations, bridge rules can map runtime payloads into
attributes, CSS tokens, style properties, and classes on a host element or
selector:

```ts
runtime.bridgeHost({
  target: "body",
  rules: [
    {
      on: "songchange",
      attribute: {
        "data-current-song": "{{song.id}}",
      },
      style: {
        "--site-accent": "{{song.themeColor}}",
        "--site-cover": "url({{song.picUrl}})",
      },
      className: {
        "nmp-is-playing": "{{player.isPlaying}}",
      },
    },
  ],
});
```

Advanced layouts are explicit plugins, so the default NMPv3 compact/mini/dock
UI stays unchanged:

```ts
await runtime.installPlugin(createAdvancedLayoutPlugin({ layout: "cover" }));
```

User extension packages can be loaded from an `extensions/user/*` folder with a
`manifest.json`, module entry, and optional `style.css`:

```html
<nmp-player
  playlist-id="14273792576"
  extension-url="/extensions/user/wave/manifest.json"
></nmp-player>
```

```json
{
  "name": "nmpv3-plus-extension-user-wave",
  "displayName": "User Wave",
  "version": "1.0.0",
  "author": "User",
  "entry": "./index.js",
  "style": "./style.css",
  "type": "visual",
  "description": "Adds a user visual extension."
}
```

The module must export a real NMPv3+ plugin object or factory:

```js
export default {
  name: "nmpv3-plus-extension-user-wave",
  setup(ctx) {
    return ctx.on("songchange", () => {
      ctx.setToken("--nmpv3-user-wave-active", "1");
    });
  },
};
```

When `style.css` is present, NMPv3+ injects it only while the plugin is
installed and scopes selectors under a generated extension class. TypeScript
users can call `loadNMPv3PlusPluginPackage()` and then install
`package.plugin` on a runtime.

## Custom Sources and Lyrics

Core source adapters cover the source types exposed by NMPv3+:

```ts
import {
  createLocalJsonSourceAdapter,
  createManualSourceAdapter,
  createStaticPlaylistSourceAdapter,
} from "@netease-mini-player/v3-plus/core";

runtime.registerSource(createLocalJsonSourceAdapter());
await runtime.loadPlaylist({
  source: "local-json",
  url: "/music/playlist.json",
});
```

`netease` is also available as an explicit Plus source adapter for custom
source pipelines that need to route NetEase songs or playlists through the same
adapter system as local JSON and custom APIs.

Lyrics can be static LRC, JSON lines, plain text, or translated lyric objects:

```ts
import { createStaticLyricsAdapter } from "@netease-mini-player/v3-plus/core";

runtime.registerLyrics(
  createStaticLyricsAdapter({
    "local-001": {
      lyric: "[00:01.00]Original line",
      translation: "[00:01.00]Translated line",
    },
  }),
);
```

When a `local-json` song includes `lyricUrl` and `translationLyricUrl`, the
browser and WordPress bootstraps load and merge those files automatically after
the playlist is applied to the base NMPv3 player.

For offline-oriented sites, install `createPwaCachePlugin()` explicitly. It uses
the browser Cache API and remains out of the default NMPv3 runtime.

## Official Skins

Official skins are real `NMPv3PlusSkin` objects plus `skin.json` metadata under
`skins/official/`:

- `default`: preserves the base NMPv3 look.
- `glass`: translucent surface tokens and blur.
- `minimal`: quiet white tool-style surface.
- `anime`: lighter accent skin with soft cover emphasis.
- `cyber`: dark high-contrast skin.
- `vinyl`: warm record-player visual direction.

Register and apply them explicitly:

```ts
import {
  createNMPv3PlusRuntime,
  officialNMPv3PlusSkins,
} from "@netease-mini-player/v3-plus";

const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  skins: officialNMPv3PlusSkins,
});

runtime.applySkin("glass");
```

User skin packages can be loaded at runtime from a `skin.json` file plus an
optional adjacent `skin.css` file. The browser bootstrap registers the package
before applying the named skin:

```html
<nmp-player
  playlist-id="14273792576"
  skin="studio-deep"
  skin-url="/skins/user/studio-deep/skin.json"
></nmp-player>
```

The matching `skin.json` follows the same manifest contract as official skins:

```json
{
  "name": "studio-deep",
  "displayName": "Studio Deep",
  "version": "1.0.0",
  "author": "User",
  "supports": ["mini", "compact", "dock", "card", "cover"],
  "tokens": {
    "--nmpv3-bg": "rgba(16, 20, 28, 0.92)",
    "--nmpv3-text": "#f7f2e8",
    "--nmpv3-accent": "#ff8a50",
    "--nmpv3-radius": "18px"
  }
}
```

When `skin.css` is present beside the manifest, NMPv3+ scopes selectors under
the generated skin class, for example
`.nmpv3-plus-skin-studio-deep .nmpv3-player`, so a user skin does not leak into
other players on the host page. TypeScript users can use
`loadNMPv3PlusSkinPackage()` or `createNMPv3PlusSkinPackage()` from the core
entry point and then call `runtime.registerSkin(skin)`.

## Custom Build Package

The CLI core resolves selected extensions and skins into a deployment plan
instead of pretending that every deployment is a single fixed bundle:

```ts
import { resolveNMPv3PlusBuildPlan } from "@netease-mini-player/v3-plus/cli";

const plan = resolveNMPv3PlusBuildPlan({
  extensions: ["visualizer", "host-sync"],
  skins: ["glass", "vinyl"],
});
```

After `pnpm --filter @netease-mini-player/v3-plus build`, the bundled command
can either write a manifest-only plan or materialize a real deploy package from
JSON config:

```bash
nmpv3-plus add examples/custom-build/nmpv3-plus.config.json visualizer host-sync glass
nmpv3-plus plan examples/custom-build/nmpv3-plus.config.json
nmpv3-plus build examples/custom-build/nmpv3-plus.config.json
```

`add` updates the JSON build config with validated official extension and skin
names. `build` copies `dist/index.js` to the configured runtime file, preserves
the
compiled `packages/`, `extensions/`, and `chunks/` dependency trees next to that
runtime, copies the browser bootstrap, copies selected extension
`manifest.json` files, copies selected skin metadata, and writes
`nmpv3-plus.manifest.json`. The extension output path must keep the Vite ESM
layout, for example `deploy/extensions/official/visualizer/index.js` plus
`deploy/extensions/official/visualizer/manifest.json`, so compiled relative
imports and extension metadata continue to resolve. Unknown extension or skin
names fail the command instead of producing placeholder assets.

For ordinary HTML deployment, load the base NMPv3 bundle first, then the Plus
bootstrap. The bootstrap waits for `<nmp-player>`, reads `NMPv3PlusConfig`,
applies selected skins, and installs requested extensions without changing the
base NMPv3 UI:

```html
<script src="/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "glass",
    enabledExtensions: ["visualizer", "host-sync"],
  };
</script>
<script type="module" src="/deploy/nmpv3-plus.bootstrap.js"></script>

<nmp-player
  playlist-id="14273792576"
  skin="glass"
  plus-extensions="advanced-layouts,visualizer,host-sync"
  plus-layout="cover"
></nmp-player>
```

If `apiBaseUrl` is omitted, NMPv3+ first keeps an API already injected for the
base player through `window.NMPv3Config.apiBaseUrl` or
`window.NMPv3ApiBaseUrl`. Legacy backend templates may also use
`window.NeteaseMiniPlayerApiBaseUrl`. If none is present, NMPv3+ falls back to
the same compiled default as the base player:

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

The bootstrap mirrors `NMPv3PlusConfig.apiBaseUrl` into
`window.NMPv3Config.apiBaseUrl`, `window.NMPv3ApiBaseUrl`, and the legacy
`window.NeteaseMiniPlayerApiBaseUrl`, then calls
`window.NMPv3.setApiBaseUrl(url)` when the base player is already loaded.
Frontend code or backend-generated JavaScript can move a deployed bundle to
another compatible NetEase API proxy without rebuilding.
When no global override is provided, NMPv3+ does not push its default fallback
back into the base player; a per-player `<nmp-player api-base-url="...">`
continues to take priority for that player and for Plus `custom-api` loading.

## UI Smoke Verification

NMPv3+ includes a Playwright smoke script for rendered layout checks. It serves
the already built NMPv3 and NMPv3+ bundles, installs the cover layout,
visualizer, host sync, and glass skin on a real `<nmp-player>`, then checks
desktop, tablet, and mobile viewports for console errors, blank output,
horizontal overflow, hidden single-song previous/next controls, and plugin
event response:

```bash
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus build
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```

## Framework Adapters

React, Vue, Next, Nuxt, Astro, and Svelte adapters expose framework-friendly
props, attrs, or client-only element plans while keeping the actual player as
the native `<nmp-player>` element:

```ts
import { createNMPv3PlusReactProps } from "@netease-mini-player/v3-plus/react";

const props = createNMPv3PlusReactProps({
  playlistId: "14273792576",
  skin: "glass",
  plusExtensions: ["advanced-layouts", "visualizer", "host-sync"],
  plusLayout: "cover",
  lyricsUrl: "/lyrics/song.lrc",
  translationLyricsUrl: "/lyrics/song.zh.lrc",
  hostSync: true,
});
```

```ts
import { createNMPv3PlusNextClientPlan } from "@netease-mini-player/v3-plus/next";

const plan = createNMPv3PlusNextClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "glass",
  plusExtensions: ["custom-source", "local-lyrics"],
  lyricsUrl: "/lyrics/song.lrc",
});
```

The framework adapters do not import framework runtimes. They return native
custom-element attributes, event names, and client-only loading hints for the
host framework to consume. Plus-specific fields map directly to deployable
custom-element attributes such as `plus-extensions`, `plus-layout`,
`lyrics-url`, `translation-lyrics-url`, `host-sync`, `page-linking`,
`skin-url`, and `extension-url`.

## WordPress and PHP Advanced Integration

NMPv3+ owns advanced WordPress/PHP integration. The package exposes helpers for
settings pages, Gutenberg block metadata, enqueue plans, shortcodes, and PHP
theme rendering:

```ts
import {
  buildNMPv3PlusWordPressPluginPackage,
  createNMPv3PlusBlockMetadata,
  createNMPv3PlusWordPressEnqueuePlan,
} from "@netease-mini-player/v3-plus/wordpress";

const block = createNMPv3PlusBlockMetadata({
  defaultSkin: "glass",
  hostSyncEnabled: true,
});
```

The installable WordPress package is materialized from real build output. It
copies the base `nmpv3.min.js`, the WordPress bootstrap module, the NMPv3+
runtime module, its `packages/`, `extensions/`, and `chunks/` dependency trees,
selected extension manifest files, selected skin JSON files, block metadata,
editor script, and a manifest:

```ts
await buildNMPv3PlusWordPressPluginPackage({
  settings: {
    enabledExtensions: ["visualizer", "host-sync"],
    enabledSkins: ["glass"],
    defaultSkin: "glass",
  },
});
```

```ts
import { renderNMPv3PlusShortcode } from "@netease-mini-player/v3-plus/php";

renderNMPv3PlusShortcode({
  source: "local-json",
  localMusicJson: "/music/playlist.json",
  skin: "vinyl",
});
```

An actual PHP helper file is included at
`packages/php/nmpv3-plus-helper.php`.
