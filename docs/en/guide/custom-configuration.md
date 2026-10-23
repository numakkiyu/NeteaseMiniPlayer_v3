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
| `scale`        | Size level `1`–`10` or `auto` |
| `palette`      | Palette id, see below         |
| `palette-follow-host` | Borrow the host page hue |
| `lyric`        | Show lyrics                   |
| `playlist`     | Show playlist control         |
| `remember`     | Persist player state          |

## NMPv3 scaling

The player scales as a whole: width, height, font size, cover, icons and radius all change
together, so it never looks stretched.

| Value  | Ratio | Width (compact layout)   |
| ------ | ----- | ------------------------ |
| `1`    | 0.6×  | 252px                    |
| `5`    | 1.0×  | 420px (default)          |
| `10`   | 1.5×  | 630px                    |
| `auto` | Same as 5 | 420px, shrinks in a narrow container |

```html
<nmp-player playlist-id="14273792576" scale="7"></nmp-player>
<nmp-player song-id="1901371647" scale="auto"></nmp-player>
```

On a narrow screen the player does not get squeezed horizontally. The effective ratio is
`level ratio × min(1, available width ÷ design width)`, where the design width is 420px for
compact/dock, 360px for article and 320px for mini. Picking level 10 on a phone will not
overflow either — it is simply capped to the container width.

## NMPv3 color palettes

Six palettes ship with the player. Each carries both a light and a dark seed, so switching
the page between light and dark picks the matching variant automatically.

| Name  | Value   | Accent               |
| ----- | ------- | -------------------- |
| Dawn  | `dawn`  | Orange-red, default  |
| Jade  | `jade`  | Green                |
| Azure | `azure` | Blue                 |
| Amber | `amber` | Yellow               |
| Iris  | `iris`  | Purple               |
| Mono  | `mono`  | Near-neutral, neumorphic |

```html
<nmp-player song-id="1901371647" palette="jade"></nmp-player>
<nmp-player song-id="1901371647" palette="iris" theme="dark"></nmp-player>
```

Light/dark resolution always follows the same order: an explicit `theme` wins, then the
sampled host background under `theme="auto"`, and only then the system preference.
`palette-follow-host` controls the **hue** only and does not affect this order.

Legacy ids (`mint`, `forest`, `ocean`, `sky`, `butter`, `plum`, `lilac`, `pearl`,
`graphite`, `ember`) map to the new palettes, so existing configuration keeps working.

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
