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
