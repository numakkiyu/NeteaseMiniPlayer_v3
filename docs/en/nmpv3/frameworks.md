# Frameworks

::: tip Unified guide
If you are comparing NMPv3 and NMPv3+ across HTML, PHP, React, Vue3, Nuxt, Astro, and Svelte, start with [Framework Integration](../guide/framework-integration). This page focuses on lightweight NMPv3 usage.
:::

NMPv3 is a native Web Component. Most frameworks only need the auto registration import and a `<nmp-player>` element.

## React

```tsx
import "netease-mini-player-v3/auto";
import { createElement } from "react";

export function NMPv3Player() {
  return createElement("nmp-player", {
    "playlist-id": "14273792576",
    "api-base-url": "/api/netease",
    theme: "auto",
    layout: "compact",
  });
}
```

## Vue 3

```vue
<script setup lang="ts">
import "netease-mini-player-v3/auto";
</script>

<template>
  <nmp-player
    playlist-id="14273792576"
    api-base-url="/api/netease"
    theme="auto"
    layout="compact"
  />
</template>
```

## Next.js

```tsx
"use client";

import { createElement, useEffect } from "react";

export function NMPv3Player() {
  useEffect(() => {
    void import("netease-mini-player-v3/auto");
  }, []);

  return createElement("nmp-player", {
    "playlist-id": "14273792576",
    "api-base-url": "/api/netease",
    theme: "auto",
    layout: "compact",
  });
}
```

## Nuxt

```ts
// plugins/nmpv3.client.ts
import "netease-mini-player-v3/auto";

export default defineNuxtPlugin(() => {});
```

## Astro

```astro
---
import "netease-mini-player-v3/auto";
---

<nmp-player
  playlist-id="14273792576"
  api-base-url="/api/netease"
  theme="auto"
  layout="compact"
></nmp-player>
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

## Checklist

- Register `<nmp-player>` only once
- Import on the client side in SSR frameworks
- Keep NMPv3 separate from NMPv3+ adapters unless advanced features are needed
- Make sure the API proxy exposes `/song/detail`, `/playlist/track/all`, `/song/url/v1`, and `/lyric`
