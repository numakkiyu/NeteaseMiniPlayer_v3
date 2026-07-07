# Basic Usage

## Song and playlist

```html
<nmp-player song-id="1901371647"></nmp-player>
<nmp-player playlist-id="14273792576"></nmp-player>
```

Use one source per player when possible.

## Theme

```html
<nmp-player theme="auto"></nmp-player>
<nmp-player theme="light"></nmp-player>
<nmp-player theme="dark"></nmp-player>
```

## Layout

```html
<nmp-player layout="compact"></nmp-player>
<nmp-player layout="mini"></nmp-player>
<nmp-player layout="dock"></nmp-player>
```

| Layout    | Use case                     |
| --------- | ---------------------------- |
| `compact` | Default embedded player      |
| `mini`    | Narrow article or embed area |
| `dock`    | Floating page-level player   |

Advanced `card` and `cover` layouts belong to NMPv3+.

## Common attributes

| Attribute      | Value                        | Description           |
| -------------- | ---------------------------- | --------------------- |
| `song-id`      | string                       | NetEase song ID       |
| `playlist-id`  | string                       | NetEase playlist ID   |
| `theme`        | `auto`, `light`, `dark`      | Theme                 |
| `layout`       | `compact`, `mini`, `dock`    | Layout                |
| `embed-mode`   | `article`, `page`            | Embed mode            |
| `position`     | `static` or corner positions | Player position       |
| `volume`       | `0` to `1`                   | Initial volume        |
| `lyric`        | `true`, `false`              | Show lyrics           |
| `playlist`     | `true`, `false`              | Show playlist control |
| `api-base-url` | URL                          | API proxy             |

## CSS variables

```css
nmp-player {
  --nmpv3-accent: #ff6b35;
  --nmpv3-radius: 16px;
  --nmpv3-bg: rgba(255, 255, 255, 0.92);
  --nmpv3-text: #222;
  --nmpv3-idle-opacity: 0.72;
}
```

Use NMPv3+ when you need full skin packages.

## Events

```txt
nmpv3:ready
nmpv3:play
nmpv3:pause
nmpv3:songchange
nmpv3:playlistchange
nmpv3:error
```

```js
document.addEventListener("nmpv3:songchange", (event) => {
  console.log(event.detail);
});
```
