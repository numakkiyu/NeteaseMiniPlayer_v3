# 框架适配

::: tip 统一入口
需要同时比较 NMPv3 与 NMPv3+ 在 HTML、PHP、React、Vue3、Nuxt、Astro 和 Svelte 中的接入方式时，先参阅 [框架集成总览](../guide/framework-integration)。本页聚焦 NMPv3+ 适配器。
:::

NMPv3+ 的框架适配器不会替换播放器本体。播放器仍然是 `<nmp-player>`，适配器负责把框架友好的配置转换成自定义元素属性、事件名和客户端加载计划。

## React

```tsx
import "@netease-mini-player/v3/auto";
import { createNMPv3PlusReactProps } from "@netease-mini-player/v3-plus/react";

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

React 适配器提供 JSX 类型和属性映射，适合在组件中统一管理 Plus 配置。

## Vue 3

```vue
<script setup lang="ts">
import "@netease-mini-player/v3/auto";
import { createNMPv3PlusVueBinding } from "@netease-mini-player/v3-plus/vue";

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

Vue 适配器输出 `attrs`，可以直接绑定到自定义元素。

## Next.js

```tsx
"use client";

import "@netease-mini-player/v3/auto";
import { createNMPv3PlusNextClientPlan } from "@netease-mini-player/v3-plus/next";

const plan = createNMPv3PlusNextClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "glass",
  plusLayout: "cover",
  plusExtensions: ["advanced-layouts", "custom-source", "local-lyrics"],
  lyricsUrl: "/lyrics/song.lrc",
  translationLyricsUrl: "/lyrics/song.zh.lrc",
  lyric: true,
});

export function NMPv3PlusPlayer() {
  return <nmp-player {...plan.element.attrs} />;
}
```

Next.js 中要放在客户端组件里。不要在服务端直接访问浏览器全局对象。

## Nuxt

```vue
<script setup lang="ts">
import "@netease-mini-player/v3/auto";
import { createNMPv3PlusNuxtClientPlan } from "@netease-mini-player/v3-plus/nuxt";

const plan = createNMPv3PlusNuxtClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "cyber",
  plusExtensions: ["custom-source", "local-lyrics", "media-session"],
  lyricsUrl: "/lyrics/song.lrc",
  lyric: true,
});
</script>

<template>
  <nmp-player v-bind="plan.element.attrs" />
</template>
```

Nuxt 中建议使用 client-only 组件或客户端插件加载 NMPv3。

## Astro

```astro
---
import { createNMPv3PlusAstroIslandPlan } from "@netease-mini-player/v3-plus/astro";

const plan = createNMPv3PlusAstroIslandPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "anime",
  plusLayout: "card",
  plusExtensions: ["advanced-layouts", "custom-source"],
  skinUrl: "/skins/user/studio-deep/skin.json",
  lyric: true,
});
---

<script>
  import "@netease-mini-player/v3/auto";
  import "@netease-mini-player/v3-plus";
</script>

<Fragment set:html={plan.element.html} />
```

Astro 适配器适合静态页面中生成播放器 island 所需的 HTML。

## Svelte

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { createNMPv3PlusSvelteBinding } from "@netease-mini-player/v3-plus/svelte";

  const binding = createNMPv3PlusSvelteBinding({
    playlistId: "14273792576",
    sourceType: "local-json",
    source: "/music/playlist.json",
    skin: "vinyl",
    plusExtensions: ["advanced-layouts", "visualizer", "custom-source"],
    plusLayout: "cover",
    extensionUrl: "/extensions/user/wave/manifest.json",
    lyric: true,
  });

  onMount(async () => {
    await import("@netease-mini-player/v3/auto");
    await import("@netease-mini-player/v3-plus");
  });
</script>

<svelte:element this={binding.tagName} {...binding.props} />
```

## 适配器选型

| 框架   | 入口                                  |
| ------ | ------------------------------------- |
| React  | `@netease-mini-player/v3-plus/react`  |
| Vue    | `@netease-mini-player/v3-plus/vue`    |
| Next   | `@netease-mini-player/v3-plus/next`   |
| Nuxt   | `@netease-mini-player/v3-plus/nuxt`   |
| Astro  | `@netease-mini-player/v3-plus/astro`  |
| Svelte | `@netease-mini-player/v3-plus/svelte` |

适配器不是必需的。基础播放器场景直接使用 NMPv3 的 Web Component 即可。
