# 框架集成总览

NMPv3 与 NMPv3+ 的集成方式不同。NMPv3 是原生 Web Component，适合直接在页面中使用。NMPv3+ 是高级框架，需要在 NMPv3 之后加载，并通过适配器或组合式 API 注册扩展能力。

## 选择规则

| 场景                                             | 推荐                                  |
| ------------------------------------------------ | ------------------------------------- |
| 只需要网易云播放器                               | NMPv3                                 |
| 在框架中输出基础 `<nmp-player>`                  | NMPv3                                 |
| 需要插件、皮肤、本地 JSON、歌词文件或 HostBridge | NMPv3+                                |
| SSR 框架中使用播放器                             | 客户端加载 NMPv3，必要时再加载 NMPv3+ |

## 原生 HTML + JS + CSS

NMPv3：

```html
<link rel="stylesheet" href="/site.css" />
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

```css
nmp-player {
  --nmpv3-accent: #ff6b35;
  --nmpv3-radius: 16px;
}
```

NMPv3+：

```html
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    enabledExtensions: ["host-sync"],
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3-plus@latest/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" plus-extensions="host-sync"></nmp-player>
```

## PHP 模板

NMPv3：

```php
<?php
$playlist_id = '14273792576';
$api_base_url = '/api/netease';
?>

<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<nmp-player
  playlist-id="<?php echo esc_attr($playlist_id); ?>"
  api-base-url="<?php echo esc_url($api_base_url); ?>"
></nmp-player>
```

NMPv3+：

```php
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "<?php echo esc_js($api_base_url); ?>",
    enabledExtensions: ["host-sync"]
  };
</script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3-plus@latest/dist/browser.js"></script>
```

## React

NMPv3：

```tsx
import "@netease-mini-player/v3/auto";
import { createElement } from "react";

export function Player() {
  return createElement("nmp-player", {
    "playlist-id": "14273792576",
    "api-base-url": "/api/netease",
    theme: "auto",
    layout: "compact",
  });
}
```

NMPv3+：

```tsx
import "@netease-mini-player/v3/auto";
import { createNMPv3PlusReactProps } from "@netease-mini-player/v3-plus/react";

export function PlusPlayer() {
  return (
    <nmp-player
      {...createNMPv3PlusReactProps({
        playlistId: "14273792576",
        skin: "default",
        plusExtensions: ["host-sync"],
        hostSync: true,
      })}
    />
  );
}
```

## Vue3

NMPv3：

```vue
<script setup lang="ts">
import "@netease-mini-player/v3/auto";
</script>

<template>
  <nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
</template>
```

NMPv3+：

```vue
<script setup lang="ts">
import "@netease-mini-player/v3/auto";
import { createNMPv3PlusVueBinding } from "@netease-mini-player/v3-plus/vue";

const player = createNMPv3PlusVueBinding({
  playlistId: "14273792576",
  skin: "default",
  plusExtensions: ["host-sync"],
});
</script>

<template>
  <nmp-player v-bind="player.attrs" />
</template>
```

## Nuxt

NMPv3 客户端插件：

```ts
// plugins/nmpv3.client.ts
import "@netease-mini-player/v3/auto";

export default defineNuxtPlugin(() => {});
```

NMPv3+ 客户端组件：

```vue
<script setup lang="ts">
import { createNMPv3PlusNuxtClientPlan } from "@netease-mini-player/v3-plus/nuxt";

const plan = createNMPv3PlusNuxtClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  plusExtensions: ["custom-source", "local-lyrics"],
});
</script>

<template>
  <ClientOnly>
    <nmp-player v-bind="plan.element.attrs" />
  </ClientOnly>
</template>
```

## Astro

NMPv3：

```astro
---
import "@netease-mini-player/v3/auto";
---

<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

NMPv3+：

```astro
---
import { createNMPv3PlusAstroIslandPlan } from "@netease-mini-player/v3-plus/astro";

const plan = createNMPv3PlusAstroIslandPlan({
  playlistId: "14273792576",
  skin: "default",
  plusExtensions: ["host-sync"],
});
---

<script>
  import "@netease-mini-player/v3/auto";
  import "@netease-mini-player/v3-plus";
</script>

<Fragment set:html={plan.element.html} />
```

## Svelte

NMPv3：

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    await import("@netease-mini-player/v3/auto");
  });
</script>

<nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
```

NMPv3+：

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { createNMPv3PlusSvelteBinding } from "@netease-mini-player/v3-plus/svelte";

  const binding = createNMPv3PlusSvelteBinding({
    playlistId: "14273792576",
    skin: "default",
    plusExtensions: ["host-sync"],
  });

  onMount(async () => {
    await import("@netease-mini-player/v3/auto");
    await import("@netease-mini-player/v3-plus");
  });
</script>

<svelte:element this={binding.tagName} {...binding.props} />
```

## 集成检查

- SSR 项目只在客户端加载播放器脚本
- 基础播放优先使用 NMPv3
- Plus 只在确实需要高级能力时加载
- 生产环境建议固定 npm 包版本
- API 代理需要支持 `/song/detail`、`/playlist/track/all`、`/song/url/v1` 和 `/lyric`
