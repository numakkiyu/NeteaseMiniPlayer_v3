# NMPv3+

NeteaseMiniPlayer v3 Plus [NMPv3+] is the advanced product line for extensibility and custom deployments.

## Goals

- Plugin system
- Skin system
- Custom music sources
- Custom lyrics
- Host-page integration
- CLI and custom build pipeline
- Framework adapters
- WordPress advanced integration

## Usage Model

NMPv3+ can be installed with npm:

```bash
npm install @netease-mini-player/v3-plus
```

Or with pnpm:

```bash
pnpm add @netease-mini-player/v3-plus
```

For local repository development:

```bash
pnpm install
pnpm --filter @netease-mini-player/v3-plus build
```

Example deployment:

```html
<script src="/dist/nmpv3-plus.runtime.js"></script>
<script src="/dist/plugins/visualizer.js"></script>
<link rel="stylesheet" href="/dist/skins/glass.css" />
```

## Boundary

If a feature needs custom sources, runtime plugins, full skin loading, or host-page automation, implement it in NMPv3+ instead of NMPv3.

## Extension Scope

NMPv3+ is the place for plugins, skins, custom source adapters, local lyrics, host-page synchronization, framework adapters, and advanced WordPress/PHP integration.

## Runtime and Official Extensions

NMPv3+ keeps the NMPv3 player UI as the base and layers advanced capabilities
through explicit plugins:

```ts
import {
  createNMPv3PlusRuntime,
  createVisualizerPlugin,
  createCoverColorPlugin,
} from "@netease-mini-player/v3-plus";

const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  player: window.NMPv3?.getPlayers()[0],
});

await runtime.installPlugin(createCoverColorPlugin());
await runtime.installPlugin(createVisualizerPlugin());
```

Implemented official extension categories include advanced layouts, visualizer,
cover color, host sync, cross-tab sync, media session, custom source, local
lyrics, and optional PWA cache.

Each official extension is represented by a validated manifest contract. The
core API can bind a manifest to a real plugin factory, and custom deployment
packages copy selected extension `manifest.json` files next to their compiled
`index.js` modules.

Host sync also owns page-linking behavior. When `page-linking="true"` or the
host setting `pageLinkingEnabled` is active, NMPv3+ updates host linked-song
attributes and the URL query state while leaving the base NMPv3 UI unchanged.
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

The runtime bridges base-player DOM events by default. `nmpv3:play`,
`nmpv3:pause`, `nmpv3:songchange`, `nmpv3:playlistchange`, and `nmpv3:error`
become Plus runtime events such as `play`, `songchange`, and
`nmp:songchange`, so official plugins respond to the real NMPv3 player instead
of requiring manual `runtime.emit()` calls.

The `advanced-layouts` extension provides opt-in `card` and `cover` layouts.
It is not part of the default NMPv3 lightweight layout set.

NMPv3+ also supports user extension packages with the same manifest contract.
Point a player at a user extension manifest:

```html
<nmp-player
  playlist-id="14273792576"
  extension-url="/extensions/user/wave/manifest.json"
></nmp-player>
```

The manifest resolves `entry` and optional `style` relative to the manifest
URL:

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

`index.js` must export a plugin object or plugin factory:

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

If `style.css` is present, the bootstrap scopes it under a generated extension
class, injects it during plugin setup, and removes it during plugin cleanup.
Core TypeScript usage is available through
`loadNMPv3PlusPluginPackage()`:

```ts
const extension = await loadNMPv3PlusPluginPackage({
  manifestUrl: "/extensions/user/wave/manifest.json",
});

await runtime.installPlugin(extension.plugin);
```

## Official Skins and Custom Build Package

The official skin set lives under `nmpv3-plus/skins/official/` and currently
includes `default`, `glass`, `minimal`, `anime`, `cyber`, and `vinyl`. Skins
are registered through `SkinEngine`; they do not modify the base NMPv3 DOM
structure.

NMPv3+ can also register user skin packages at runtime. A player can point to a
`skin.json` file and apply that skin by name:

```html
<nmp-player
  playlist-id="14273792576"
  skin="studio-deep"
  skin-url="/skins/user/studio-deep/skin.json"
></nmp-player>
```

If `/skins/user/studio-deep/skin.css` exists, the bootstrap loads it beside the
manifest and scopes selectors under the generated skin class, such as
`.nmpv3-plus-skin-studio-deep .nmpv3-player`. This keeps user skin CSS from
leaking into unrelated players or host-page UI.

Core TypeScript usage is available through
`loadNMPv3PlusSkinPackage()` and `createNMPv3PlusSkinPackage()`:

```ts
const skin = await loadNMPv3PlusSkinPackage({
  manifestUrl: "/skins/user/studio-deep/skin.json",
});

runtime.registerSkin(skin);
runtime.applySkin("studio-deep");
```

NMPv3+ also includes a custom build-plan and deploy-package API:

```ts
import { resolveNMPv3PlusBuildPlan } from "@netease-mini-player/v3-plus/cli";

const plan = resolveNMPv3PlusBuildPlan({
  extensions: ["visualizer", "host-sync"],
  skins: ["glass"],
});
```

The generated plan contains deployable runtime, extension, skin, manifest,
dependency-tree, and HTML tag information. After
`pnpm --filter @netease-mini-player/v3-plus build`, the CLI can also copy real
files into a deployable package:

```bash
nmpv3-plus add examples/custom-build/nmpv3-plus.config.json visualizer host-sync glass
nmpv3-plus plan examples/custom-build/nmpv3-plus.config.json
nmpv3-plus build examples/custom-build/nmpv3-plus.config.json
```

`add` updates the JSON build config with validated official extension and skin
names. `build` copies the runtime bundle, preserves the compiled `packages/`,
`extensions/`, and `chunks/` dependency trees next to that runtime, copies the
browser bootstrap, copies selected extension manifests, copies selected skin
metadata, and writes `nmpv3-plus.manifest.json`. Extension output keeps the
Vite ESM layout, for example
`deploy/extensions/official/visualizer/index.js` and
`deploy/extensions/official/visualizer/manifest.json`, so compiled relative
imports and metadata continue to resolve. Unknown extension or skin names throw
errors instead of producing fake assets.

For ordinary HTML deployment, load NMPv3 first and then the Plus bootstrap. The
bootstrap waits for the base `<nmp-player>`, reads `NMPv3PlusConfig`, applies
selected skins, and installs requested extensions:

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

If `apiBaseUrl` is omitted, the Plus bootstrap first keeps an API already
injected for the base player through `window.NMPv3Config.apiBaseUrl` or
`window.NMPv3ApiBaseUrl`. Legacy backend templates may also use
`window.NeteaseMiniPlayerApiBaseUrl`. If none is present, it falls back to the
same compiled default as NMPv3:

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

`NMPv3PlusConfig.apiBaseUrl` is also synchronized into
`window.NMPv3Config.apiBaseUrl`, `window.NMPv3ApiBaseUrl`,
`window.NeteaseMiniPlayerApiBaseUrl`, and `window.NMPv3.setApiBaseUrl(url)`,
so frontend code or backend-generated JavaScript can replace the API endpoint
after deployment without rebuilding the compiled player bundle.
When no global override is present, the Plus bootstrap does not write its
default fallback back into NMPv3; a per-player
`<nmp-player api-base-url="...">` remains the effective API endpoint for that
player and for Plus `custom-api` loading.

## UI Smoke Verification

NMPv3+ ships a Playwright smoke script for rendered layout checks. It uses the
built NMPv3 and NMPv3+ bundles, installs the cover layout, visualizer, host
sync, and glass skin on a real `<nmp-player>`, then checks desktop, tablet, and
mobile viewports for console errors, blank output, horizontal overflow, hidden
single-song previous/next controls, and plugin event response:

```bash
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus build
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```

## Custom Sources, Lyrics, and PWA Cache

NMPv3+ source adapters include `netease`, `local-json`, `static-playlist`,
`manual`, and custom API helper support. `local-json` can load from in-memory
data or a JSON URL:

```ts
runtime.registerSource(createLocalJsonSourceAdapter());

await runtime.loadPlaylist({
  source: "local-json",
  url: "/music/playlist.json",
});
```

Static lyrics support LRC, JSON lyric lines, plain text, translated text, and
Netease-like `lrc` / `tlyric` objects.
When a local JSON song contains `lyricUrl` and `translationLyricUrl`, the
browser and WordPress bootstraps load and merge those files automatically after
the custom source playlist is applied to the base NMPv3 player.

`pwa-cache` is an optional official extension. It uses the Cache API only after
it is installed by the NMPv3+ runtime.

## Framework Adapters

React, Vue, Next, Nuxt, Astro, and Svelte adapters are framework-specific entry
points that map camelCase configuration to native `<nmp-player>` attributes or
client-only element plans:

```ts
import { createNMPv3PlusReactProps } from "@netease-mini-player/v3-plus/react";

createNMPv3PlusReactProps({
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
import { createNMPv3PlusAstroIslandPlan } from "@netease-mini-player/v3-plus/astro";

const plan = createNMPv3PlusAstroIslandPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "anime",
  plusExtensions: ["advanced-layouts", "custom-source"],
  plusLayout: "card",
  skinUrl: "/skins/user/studio-deep/skin.json",
});
```

The adapters avoid framework runtime imports inside the package. Framework
examples are provided under `nmpv3-plus/examples/` for React, Vue, Next, Nuxt,
Astro, and Svelte. Plus-specific fields map directly to deployable
custom-element attributes such as `plus-extensions`, `plus-layout`,
`lyrics-url`, `translation-lyrics-url`, `host-sync`, `page-linking`,
`skin-url`, and `extension-url`.

## WordPress and PHP

NMPv3+ includes advanced WordPress/PHP helper entry points. They are separate
from the lightweight NMPv3 WordPress Basic example.

```ts
import {
  buildNMPv3PlusWordPressPluginPackage,
  createNMPv3PlusBlockMetadata,
  createNMPv3PlusWordPressEnqueuePlan,
} from "@netease-mini-player/v3-plus/wordpress";

createNMPv3PlusWordPressEnqueuePlan({
  apiBaseUrl: "https://example.com/NeteaseMiniPlayer/nmp.php",
  enabledExtensions: ["visualizer", "host-sync"],
  enabledSkins: ["glass"],
  defaultSkin: "glass",
});
```

The advanced WordPress package builder copies the lightweight `nmpv3.min.js`
first, then the NMPv3+ WordPress bootstrap, runtime module, dependency folders,
selected extensions, selected extension manifests, selected skin JSON files,
Gutenberg block files, and a manifest. This keeps the base NMPv3 UI registered
while Plus features load as advanced enhancements:

```ts
await buildNMPv3PlusWordPressPluginPackage({
  settings: {
    enabledExtensions: ["visualizer", "host-sync"],
    enabledSkins: ["glass"],
    defaultSkin: "glass",
  },
});
```

The PHP helper path is `nmpv3-plus/packages/php/nmpv3-plus-helper.php`, and the
TypeScript PHP helper entry point can render NMPv3+ shortcode/player attributes
for custom PHP tooling.
