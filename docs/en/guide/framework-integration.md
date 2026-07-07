# Framework Integration

NMPv3 and NMPv3+ use different integration models. NMPv3 is a native Web Component. NMPv3+ loads after NMPv3 and adds advanced framework capabilities through adapters or the app API.

## Selection rules

| Scenario                                               | Recommended path   |
| ------------------------------------------------------ | ------------------ |
| NetEase player only                                    | NMPv3              |
| Render a base `<nmp-player>` in a framework            | NMPv3              |
| Plugins, skins, local JSON, lyric files, or HostBridge | NMPv3+             |
| SSR framework                                          | Load on the client |

## Native HTML + JS + CSS

NMPv3:

```html
<link rel="stylesheet" href="/site.css" />
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

NMPv3+:

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    enabledExtensions: ["host-sync"],
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@latest/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" plus-extensions="host-sync"></nmp-player>
```

## PHP template

```php
<?php
$playlist_id = '14273792576';
$api_base_url = '/api/netease';
?>

<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>
<nmp-player
  playlist-id="<?php echo esc_attr($playlist_id); ?>"
  api-base-url="<?php echo esc_url($api_base_url); ?>"
></nmp-player>
```

## React

NMPv3:

```tsx
import "netease-mini-player-v3/auto";
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

NMPv3+:

```tsx
import "netease-mini-player-v3/auto";
import { createNMPv3PlusReactProps } from "netease-mini-player-v3-plus/react";

export function PlusPlayer() {
  return (
    <nmp-player
      {...createNMPv3PlusReactProps({
        playlistId: "14273792576",
        skin: "default",
        plusExtensions: ["host-sync"],
      })}
    />
  );
}
```

## Vue3

```vue
<script setup lang="ts">
import "netease-mini-player-v3/auto";
</script>

<template>
  <nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
</template>
```

Plus adapter:

```vue
<script setup lang="ts">
import "netease-mini-player-v3/auto";
import { createNMPv3PlusVueBinding } from "netease-mini-player-v3-plus/vue";

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

```ts
// plugins/nmpv3.client.ts
import "netease-mini-player-v3/auto";

export default defineNuxtPlugin(() => {});
```

```vue
<script setup lang="ts">
import { createNMPv3PlusNuxtClientPlan } from "netease-mini-player-v3-plus/nuxt";

const plan = createNMPv3PlusNuxtClientPlan({
  playlistId: "14273792576",
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

```astro
---
import "netease-mini-player-v3/auto";
---

<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

```astro
---
import { createNMPv3PlusAstroIslandPlan } from "netease-mini-player-v3-plus/astro";

const plan = createNMPv3PlusAstroIslandPlan({
  playlistId: "14273792576",
  skin: "default",
  plusExtensions: ["host-sync"],
});
---

<script>
  import "netease-mini-player-v3/auto";
  import "netease-mini-player-v3-plus";
</script>

<Fragment set:html={plan.element.html} />
```

## Svelte

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
  });
</script>

<nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
```

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { createNMPv3PlusSvelteBinding } from "netease-mini-player-v3-plus/svelte";

  const binding = createNMPv3PlusSvelteBinding({
    playlistId: "14273792576",
    skin: "default",
    plusExtensions: ["host-sync"],
  });

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
    await import("netease-mini-player-v3-plus");
  });
</script>

<svelte:element this={binding.tagName} {...binding.props} />
```
