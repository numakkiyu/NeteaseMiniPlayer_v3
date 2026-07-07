# Quick Start

This page covers the two most common open-source usage paths: CDN embedding and npm-based frontend integration.

## Use NMPv3 from a CDN

NMPv3 is the default recommended embed path:

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

Pin a version in production:

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
```

## Use NMPv3 from npm

```bash
npm install netease-mini-player-v3
pnpm add netease-mini-player-v3
```

```ts
import "netease-mini-player-v3/auto";
```

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## API proxy

Default API proxy:

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

Custom proxy:

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

Global config before the script loads:

```html
<script>
  window.NMPv3Config = {
    apiBaseUrl: "/api/netease",
  };
</script>
<script src="/assets/nmpv3.min.js"></script>
```

## Use NMPv3+

NMPv3+ is for extension-heavy integration. Load the base NMPv3 player first:

```bash
npm install netease-mini-player-v3 netease-mini-player-v3-plus
pnpm add netease-mini-player-v3 netease-mini-player-v3-plus
```

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@3.0.0-alpha.0/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

Without enabled extensions, Plus keeps the base player surface.

## Local development

```bash
pnpm install
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3-plus build
pnpm docs:dev
```

## Continue reading

- [CDN usage](./cdn)
- [Custom configuration](./custom-configuration)
- [Framework integration](./framework-integration)
