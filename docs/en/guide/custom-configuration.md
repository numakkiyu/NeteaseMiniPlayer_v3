# Custom Configuration

This page summarizes the configuration model for both product lines. NMPv3 owns lightweight player configuration. NMPv3+ owns extension framework configuration.

## NMPv3 HTML attributes

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
  api-base-url="/api/netease"
  lyric="true"
  playlist="true"
></nmp-player>
```

Common attributes:

| Attribute      | Description                   |
| -------------- | ----------------------------- |
| `song-id`      | NetEase song ID               |
| `playlist-id`  | NetEase playlist ID           |
| `api-base-url` | API proxy URL                 |
| `theme`        | `auto`, `light`, or `dark`    |
| `layout`       | `compact`, `mini`, or `dock`  |
| `position`     | `static` or a corner position |
| `embed-mode`   | `article` or `page`           |
| `lyric`        | Show lyrics                   |
| `playlist`     | Show playlist control         |
| `remember`     | Persist player state          |

## NMPv3 global configuration

```html
<script>
  window.NMPv3Config = {
    apiBaseUrl: "/api/netease",
    theme: "auto",
    layout: "compact",
  };
</script>
<script src="/assets/nmpv3.min.js"></script>
```

Runtime updates:

```js
window.NMPv3.setGlobalConfig({
  apiBaseUrl: "/api/netease",
});

window.NMPv3.setApiBaseUrl("/api/netease");
```

## NMPv3 CSS variables

```css
nmp-player {
  --nmpv3-accent: #ff6b35;
  --nmpv3-radius: 16px;
  --nmpv3-bg: rgba(255, 255, 255, 0.92);
  --nmpv3-text: #222222;
  --nmpv3-idle-opacity: 0.72;
}
```

Use NMPv3+ for full skin packages.

## NMPv3+ browser configuration

```html
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
    enabledExtensions: ["host-sync"],
    enabledSkins: ["default", "glass"],
  };
</script>
<script type="module" src="/deploy/nmpv3-plus.bootstrap.js"></script>
```

## Boundary

| Need                                             | Product line |
| ------------------------------------------------ | ------------ |
| NetEase song, playlist, theme, layout, API proxy | NMPv3        |
| Basic CSS variables                              | NMPv3        |
| Plugins, skins, custom sources, custom lyrics    | NMPv3+       |
| HostBridge page integration                      | NMPv3+       |
| React, Vue3, Nuxt, Astro, or Svelte adapters     | NMPv3+       |
