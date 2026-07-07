# WordPress and PHP

NMPv3+ owns advanced WordPress and PHP integration. NMPv3 Basic only loads one frontend script and renders a player.

## Enqueue plan

```ts
import { createNMPv3PlusWordPressEnqueuePlan } from "@netease-mini-player/v3-plus/wordpress";

const plan = createNMPv3PlusWordPressEnqueuePlan({
  apiBaseUrl: "https://example.com/NeteaseMiniPlayer/nmp.php",
  enabledExtensions: ["host-sync"],
  enabledSkins: ["default"],
  defaultSkin: "default",
});
```

## Build a WordPress package

```ts
import { buildNMPv3PlusWordPressPluginPackage } from "@netease-mini-player/v3-plus/wordpress";

await buildNMPv3PlusWordPressPluginPackage({
  settings: {
    enabledExtensions: ["host-sync"],
    enabledSkins: ["default"],
    defaultSkin: "default",
  },
});
```

The package copies the base NMPv3 bundle, the Plus bootstrap, runtime modules, dependency folders, selected extension manifests, selected skin JSON files, Gutenberg block files, and a manifest.

## PHP helper

Helper path:

```txt
nmpv3-plus/packages/php/nmpv3-plus-helper.php
```

TypeScript helper:

```ts
import { renderNMPv3PlusShortcode } from "@netease-mini-player/v3-plus/php";

renderNMPv3PlusShortcode({
  source: "local-json",
  localMusicJson: "/music/playlist.json",
  skin: "vinyl",
});
```

## Deployment checklist

- Base NMPv3 loads before Plus bootstrap
- API proxy syncs into `window.NMPv3Config.apiBaseUrl`
- Selected extensions and skins have real manifest files
- Gutenberg block references real build output
- PHP helper output matches adapter attribute names
