---
layout: home
hero:
  name: NeteaseMiniPlayer v3
  tagline: A lightweight embeddable music player UI component library built on NeteaseCloudMusicApi
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/getting-started
    - theme: alt
      text: CDN Usage
      link: /en/guide/cdn
features:
  - title: NMPv3
    details: A one-script player for public websites, blogs, CMS templates, and basic WordPress usage
  - title: NMPv3+
    details: An advanced framework for plugins, skins, custom music sources, custom lyrics, and custom deployments
---

<div class="nmp-doc-badges">
  <span class="nmp-doc-badge">Apache-2.0</span>
  <span class="nmp-doc-badge">Web Component</span>
  <span class="nmp-doc-badge">VitePress Docs</span>
  <span class="nmp-doc-badge">jsDelivr</span>
  <span class="nmp-doc-badge">unpkg</span>
</div>

## Project Scope

NeteaseMiniPlayer v3 is maintained as an open-source web player project. Starting from v3, the repository has two product lines:

- **NMPv3**: the lightweight player for NetEase Cloud Music. Browser usage only needs `nmpv3.min.js`
- **NMPv3+**: the advanced framework for plugins, skins, custom sources, custom lyrics, host integration, framework adapters, and custom builds

Use NMPv3 for normal embedding. Use NMPv3+ only when an integration needs advanced extension points.

## Recommended Entry

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

For npm-based projects:

```bash
npm install netease-mini-player-v3
pnpm add netease-mini-player-v3
```

```ts
import "netease-mini-player-v3/auto";
```

## Next Steps

- [Choose a version](./guide/which-version)
- [Quick start](./guide/getting-started)
- [CDN usage](./guide/cdn)
- [Framework integration](./guide/framework-integration)
