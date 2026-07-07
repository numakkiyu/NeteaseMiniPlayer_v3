# Framework Adapters

::: tip Unified guide
If you are comparing NMPv3 and NMPv3+ across HTML, PHP, React, Vue3, Nuxt, Astro, and Svelte, start with [Framework Integration](../guide/framework-integration). This page focuses on NMPv3+ adapters.
:::

NMPv3+ adapters do not replace the player. They turn framework-friendly options into custom-element attributes, event names, and client loading plans.

## React

```tsx
import "netease-mini-player-v3/auto";
import { createNMPv3PlusReactProps } from "netease-mini-player-v3-plus/react";

export function NMPv3PlusPlayer() {
  return (
    <nmp-player
      {...createNMPv3PlusReactProps({
        playlistId: "14273792576",
        skin: "glass",
        layout: "compact",
        plusLayout: "cover",
        plusExtensions: ["advanced-layouts", "visualizer", "host-sync"],
        lyricsUrl: "/lyrics/song.lrc",
        translationLyricsUrl: "/lyrics/song.zh.lrc",
        hostSync: true,
      })}
    />
  );
}
```

## Vue

```vue
<script setup lang="ts">
import "netease-mini-player-v3/auto";
import { createNMPv3PlusVueBinding } from "netease-mini-player-v3-plus/vue";

const player = createNMPv3PlusVueBinding({
  playlistId: "14273792576",
  skin: "glass",
  layout: "compact",
  plusExtensions: ["visualizer", "host-sync"],
  hostSync: true,
  pageLinking: true,
});
</script>

<template>
  <nmp-player v-bind="player.attrs" />
</template>
```

## Next

```tsx
"use client";

import "netease-mini-player-v3/auto";
import { createNMPv3PlusNextClientPlan } from "netease-mini-player-v3-plus/next";

const plan = createNMPv3PlusNextClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "glass",
  plusLayout: "cover",
  plusExtensions: ["advanced-layouts", "custom-source", "local-lyrics"],
  lyricsUrl: "/lyrics/song.lrc",
  lyric: true,
});

export function NMPv3PlusPlayer() {
  return <nmp-player {...plan.element.attrs} />;
}
```

## Adapter entries

| Framework | Entry                                |
| --------- | ------------------------------------ |
| React     | `netease-mini-player-v3-plus/react`  |
| Vue       | `netease-mini-player-v3-plus/vue`    |
| Next      | `netease-mini-player-v3-plus/next`   |
| Nuxt      | `netease-mini-player-v3-plus/nuxt`   |
| Astro     | `netease-mini-player-v3-plus/astro`  |
| Svelte    | `netease-mini-player-v3-plus/svelte` |
