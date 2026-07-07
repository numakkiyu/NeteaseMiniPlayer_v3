# Plugins and Skins

Plugins add behavior. Skins change visuals. Both belong to NMPv3+.

## Official plugins

| Plugin             | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `advanced-layouts` | Opt-in `card` and `cover` layouts                     |
| `visualizer`       | Bars, wave, or ambient visual layers                  |
| `cover-color`      | Cover color extraction to CSS tokens                  |
| `host-sync`        | Host page attributes, classes, styles, and page links |
| `cross-tab-sync`   | BroadcastChannel-based playback sync                  |
| `media-session`    | Media Session metadata and handlers                   |
| `custom-source`    | Custom source registration                            |
| `local-lyrics`     | Local and static lyrics                               |
| `pwa-cache`        | Optional Cache API integration                        |

## User plugin package

```json
{
  "name": "nmpv3-plus-extension-user-wave",
  "displayName": "User Wave",
  "version": "1.0.0",
  "author": "User",
  "entry": "./index.js",
  "style": "./style.css",
  "type": "visual",
  "dependencies": {
    "nmpv3-plus-extension-host-sync": ">=1.0.0"
  },
  "description": "Adds a visual layer."
}
```

```js
export default {
  name: "nmpv3-plus-extension-user-wave",
  setup(ctx) {
    const stop = ctx.on("songchange", () => {
      ctx.setToken("--nmpv3-user-wave-active", "1");
    });

    return () => stop();
  },
};
```

```html
<nmp-player
  playlist-id="14273792576"
  extension-url="/extensions/user/wave/manifest.json"
></nmp-player>
```

## Official skins

- `default`
- `glass`
- `minimal`
- `anime`
- `cyber`
- `vinyl`

```ts
const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  skins: officialNMPv3PlusSkins,
});

runtime.applySkin("glass");
```

## User skin package

```html
<nmp-player
  playlist-id="14273792576"
  skin="studio-deep"
  skin-url="/skins/user/studio-deep/skin.json"
></nmp-player>
```

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

If `skin.css` exists next to `skin.json`, NMPv3+ loads it under a generated skin class to avoid leaking styles.
