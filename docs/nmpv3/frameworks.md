# 前端框架接入

::: tip 统一入口
按具体技术栈查找分步教程时，先参阅 [NMPv3 集成指南](./integrations/)。本页只保留 NMPv3 轻量版在各框架中的接入细节速查。
:::

NMPv3 使用原生 Web Component。多数框架只需导入自动注册入口，在模板或组件中输出 `<nmp-player>`。

播放器自身不依赖 React、Vue、Lit、jQuery 或其他运行时库。

## Vite 或普通 TypeScript 项目

```ts
import "netease-mini-player-v3/auto";
```

```html
<nmp-player
  playlist-id="14273792576"
  api-base-url="/api/netease"
  theme="auto"
  layout="compact"
></nmp-player>
```

## React

React 可以用 `createElement` 避免 JSX 类型声明问题：

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

直接写 JSX 时，可为项目补充自定义元素类型：

```ts
declare namespace JSX {
  interface IntrinsicElements {
    "nmp-player": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "song-id"?: string;
      "playlist-id"?: string;
      "api-base-url"?: string;
      theme?: "auto" | "light" | "dark";
      layout?: "mini" | "compact" | "dock";
    };
  }
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

如果 Vue 编译器警告未知元素，可以在项目构建配置中把 `nmp-player` 标记为自定义元素。

## Next.js

Next.js 需要在客户端组件中加载播放器：

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

不要在服务端组件中直接访问 `window.NMPv3`。

## Nuxt

创建客户端插件：

```ts
// plugins/nmpv3.client.ts
import "netease-mini-player-v3/auto";

export default defineNuxtPlugin(() => {});
```

页面中使用：

```vue
<template>
  <nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
</template>
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

在浏览器端导入自动注册入口：

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
  });
</script>

<nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
```

## 接入检查

接入后检查：

- 页面中只注册一次 `<nmp-player>`
- API 代理可以访问 `/song/detail`、`/playlist/track/all`、`/song/url/v1` 和 `/lyric`
- 单曲和歌单 ID 是字符串形式
- SSR 框架只在客户端导入播放器自动注册入口
- 不要为了使用 NMPv3 而安装 NMPv3+ 的适配器包
