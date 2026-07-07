# Vue 3

Vue 3 对自定义元素支持良好，可直接在单文件组件模板中使用 `<nmp-player>`，并通过 `compilerOptions.isCustomElement` 关闭编译器警告。

## 前置环境依赖检查

- Node.js 18+
- Vue 3.2+（支持 `<script setup>` 与 TypeScript）
- Vite 或 Vue CLI 构建工具
- 已安装 `@netease-mini-player/v3`：`npm install @netease-mini-player/v3`

## NMPv3 包安装与配置流程

```bash
npm install @netease-mini-player/v3
```

在组件中导入自动注册入口：

```vue
<script setup lang="ts">
import "@netease-mini-player/v3/auto";
</script>
```

### 构建配置

Vite 项目需在 `vite.config.ts` 中标记自定义元素：

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "nmp-player",
        },
      },
    }),
  ],
});
```

Vue CLI 项目可在 `vue.config.js` 中配置：

```js
module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => ({
        ...options,
        compilerOptions: {
          isCustomElement: (tag) => tag === "nmp-player",
        },
      }));
  },
};
```

### 全局 API 地址配置

在 `index.html` 中注入：

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
```

或通过运行时调用：

```ts
window.NMPv3?.setApiBaseUrl("/api/netease");
```

## 核心功能接入代码示例

### 基础组件

```vue
<script setup lang="ts">
import "@netease-mini-player/v3/auto";
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

### 属性传递

Vue 模板会将 camelCase 自动转换为 kebab-case，也可以显式书写 kebab-case：

```vue
<template>
  <nmp-player
    :playlist-id="playlistId"
    :api-base-url="apiBaseUrl"
    :theme="theme"
    :layout="layout"
  />
</template>
```

### 事件监听

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import "@netease-mini-player/v3/auto";

const playerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const el = playerRef.value;
  if (!el) return;

  el.addEventListener("nmpv3:play", handlePlay);
});

onUnmounted(() => {
  const el = playerRef.value;
  if (!el) return;

  el.removeEventListener("nmpv3:play", handlePlay);
});

function handlePlay() {
  console.log("播放开始");
}
</script>

<template>
  <nmp-player ref="playerRef" playlist-id="14273792576" />
</template>
```

## 常见问题排障指南

### 控制台警告：Component resolved to a custom element

- 在构建配置中设置 `isCustomElement: (tag) => tag === "nmp-player"`
- 该警告不影响功能，仅为编译器提示

### 属性更新未生效

- Vue 的响应式绑定会同步到 DOM 属性，但 NMPv3 部分配置需要在元素初始化后调用 `updateConfig()`
- 对于动态配置变更，可通过 `window.NMPv3` 获取实例后调用 `updateConfig()`

### 类型错误：无法找到 nmp-player 元素

Vue 模板不需要额外 JSX 类型声明。若使用 `h()` 或 `createElement` 渲染，可按如下方式处理：

```ts
import { h } from "vue";

export function NMPv3Player() {
  return h("nmp-player", {
    "playlist-id": "14273792576",
    "api-base-url": "/api/netease",
  });
}
```

### SSR 报错 window is not defined

NMPv3 未设计为服务端运行。使用 Vite SSR 或 Nuxt 时，应将导入限制在客户端生命周期中，具体参见 [Nuxt 集成](./nuxt)。

## 进阶扩展开发方案

### 自定义组件封装

```vue
<script setup lang="ts">
import { computed } from "vue";
import "@netease-mini-player/v3/auto";

interface Props {
  playlistId?: string;
  songId?: string;
  theme?: "auto" | "light" | "dark";
  layout?: "mini" | "compact" | "dock";
  apiBaseUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  theme: "auto",
  layout: "compact",
  apiBaseUrl: "/api/netease",
});
</script>

<template>
  <nmp-player
    :playlist-id="props.playlistId"
    :song-id="props.songId"
    :api-base-url="props.apiBaseUrl"
    :theme="props.theme"
    :layout="props.layout"
  />
</template>
```

### 路由切换暂停

```vue
<script setup lang="ts">
import { onUnmounted } from "vue";

onUnmounted(() => {
  window.NMPv3?.pauseAll();
});
</script>
```

### 自定义配置优先级

页面级全局配置可通过 `window.NMPv3Config` 在 `index.html` 中设置，组件级通过属性覆盖，满足多环境部署需求。

### 与 Pinia 状态同步

通过 `nmpv3:songchange` 事件读取当前歌曲，并更新 Pinia store：

```ts
const store = usePlayerStore();

el.addEventListener("nmpv3:songchange", () => {
  const players = window.NMPv3.getPlayers();
  if (players.length > 0) {
    store.currentSong = players[0].getCurrentSong();
  }
});
```
