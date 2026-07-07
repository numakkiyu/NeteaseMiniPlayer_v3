# Custom Build

NMPv3+ can generate deployment packages from selected extensions and skins.

## Build first

```bash
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3-plus build
```

## CLI flow

```bash
nmpv3-plus add examples/custom-build/nmpv3-plus.config.json visualizer host-sync glass
nmpv3-plus plan examples/custom-build/nmpv3-plus.config.json
nmpv3-plus build examples/custom-build/nmpv3-plus.config.json
```

## Build plan API

```ts
import { resolveNMPv3PlusBuildPlan } from "netease-mini-player-v3-plus/cli";

const plan = resolveNMPv3PlusBuildPlan({
  extensions: ["visualizer", "host-sync"],
  skins: ["glass", "vinyl"],
});
```

## Deployment shape

```txt
deploy/
├─ nmpv3-plus.runtime.js
├─ nmpv3-plus.bootstrap.js
├─ nmpv3-plus.manifest.json
├─ packages/
├─ chunks/
├─ extensions/
└─ skins/
```

The build copies real files and preserves the compiled ESM directory layout.

## Browser usage

```html
<script src="/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script type="module" src="/deploy/nmpv3-plus.bootstrap.js"></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

Unknown extensions or skins should fail the build instead of producing placeholder files.
