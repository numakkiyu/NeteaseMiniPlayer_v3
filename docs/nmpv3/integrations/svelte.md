# Svelte

Svelte 对自定义元素无额外抽象，可直接在模板中书写 `<nmp-player>`。由于 NMPv3 依赖浏览器 API，建议在 `onMount` 中动态导入自动注册入口。

## 前置环境依赖检查

- Node.js 18+
- Svelte 4+ 或 Svelte 5
- Vite/SvelteKit 构建环境
- 已安装 `netease-mini-player-v3`：`npm install netease-mini-player-v3`

## NMPv3 包安装与配置流程

```bash
npm install netease-mini-player-v3
```

在组件 `onMount` 中动态导入：

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
  });
</script>

<nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
```

### 全局 API 地址配置

在 `index.html` 或 `app.html` 中注入：

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
```

或在导入完成后调用：

```ts
onMount(async () => {
  await import("netease-mini-player-v3/auto");
  window.NMPv3?.setApiBaseUrl("/api/netease");
});
```

## 核心功能接入代码示例

### 基础组件

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
  });
</script>

<nmp-player
  playlist-id="14273792576"
  api-base-url="/api/netease"
  theme="auto"
  layout="compact"
/>
```

### 属性绑定

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  export let playlistId = "14273792576";
  export let theme: "auto" | "light" | "dark" = "auto";
  export let layout: "mini" | "compact" | "dock" = "compact";
  export let apiBaseUrl = "/api/netease";

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
  });
</script>

<nmp-player
  playlist-id={playlistId}
  api-base-url={apiBaseUrl}
  theme={theme}
  layout={layout}
/>
```

### 事件监听

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let player: HTMLElement;

  onMount(async () => {
    await import("netease-mini-player-v3/auto");

    player.addEventListener("nmpv3:play", () => {
      console.log("播放开始");
    });
  });
</script>

<nmp-player bind:this={player} playlist-id="14273792576" />
```

## 常见问题排障指南

### SSR 报错 window is not defined

- SvelteKit 中必须在 `onMount` 或 `browser` 条件下导入
- 不要直接 `import "netease-mini-player-v3/auto"` 在模块顶层

### 播放器未渲染

- 检查动态导入是否完成
- 确认 `<nmp-player>` 在动态导入后出现在 DOM 中
- 检查 `api-base-url` 是否可访问

### 类型声明

为 `<nmp-player>` 扩展 TypeScript 类型：

```ts
// global.d.ts
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    "song-id"?: string;
    "playlist-id"?: string;
    "api-base-url"?: string;
    theme?: "auto" | "light" | "dark";
    layout?: "mini" | "compact" | "dock";
  }
}
```

Svelte 5 用户可参考项目类型声明方式调整命名空间。

### 组件卸载未暂停

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  onDestroy(() => {
    window.NMPv3?.pauseAll();
  });
</script>
```

## 进阶扩展开发方案

### SvelteKit 集成

在 SvelteKit 中，推荐将 NMPv3 封装为仅客户端组件，并通过 `+page.svelte` 的 `browser` 条件加载：

```svelte
<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  onMount(async () => {
    if (browser) {
      await import("netease-mini-player-v3/auto");
    }
  });
</script>
```

### 状态导出

通过事件监听将播放器状态导出到 Svelte store：

```ts
import { writable } from "svelte/store";

export const currentSong = writable<any>(null);

export function syncPlayerState(player: HTMLElement) {
  player.addEventListener("nmpv3:songchange", () => {
    const players = window.NMPv3.getPlayers();
    if (players.length > 0) {
      currentSong.set(players[0].getCurrentSong());
    }
  });
}
```

### 自定义样式隔离

NMPv3 的样式由 JavaScript 注入页面 `<head>`，不会影响 Svelte 组件的作用域样式。Svelte 的 `<style>` 块无法直接覆盖 NMPv3 内部样式，如需深度定制需使用 NMPv3+ 的皮肤系统。

### 路由级暂停

SvelteKit 的 `beforeNavigate` 可用于页面切换前暂停：

```ts
import { beforeNavigate } from "$app/navigation";

beforeNavigate(() => {
  window.NMPv3?.pauseAll();
});
```
