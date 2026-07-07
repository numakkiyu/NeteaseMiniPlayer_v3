# Nuxt

Nuxt 在 SSR 模式下构建时无法访问浏览器 API。NMPv3 的注册与脚本加载必须限制在客户端，通常通过 Nuxt 客户端插件实现。

## 前置环境依赖检查

- Node.js 18+
- Nuxt 3.6+
- 已安装 `netease-mini-player-v3`：`npm install netease-mini-player-v3`

## NMPv3 包安装与配置流程

```bash
npm install netease-mini-player-v3
```

创建客户端插件 `plugins/nmpv3.client.ts`：

```ts
import "netease-mini-player-v3/auto";

export default defineNuxtPlugin(() => {});
```

文件后缀 `.client.ts` 确保 Nuxt 仅在浏览器端加载该插件。

### 全局 API 地址配置

在客户端插件中注入全局配置更为可靠：

```ts
// plugins/nmpv3.client.ts
import "netease-mini-player-v3/auto";

export default defineNuxtPlugin(() => {
  window.NMPv3Config = Object.assign({}, window.NMPv3Config || {}, {
    apiBaseUrl: "/api/netease",
  });
});
```

## 核心功能接入代码示例

### 页面模板

```vue
<template>
  <nmp-player playlist-id="14273792576" api-base-url="/api/netease" />
</template>
```

### 组件封装

```vue
<script setup lang="ts">
interface Props {
  playlistId?: string;
  songId?: string;
  theme?: "auto" | "light" | "dark";
  layout?: "mini" | "compact" | "dock";
  apiBaseUrl?: string;
}

withDefaults(defineProps<Props>(), {
  theme: "auto",
  layout: "compact",
  apiBaseUrl: "/api/netease",
});
</script>

<template>
  <nmp-player
    :playlist-id="playlistId"
    :song-id="songId"
    :theme="theme"
    :layout="layout"
    :api-base-url="apiBaseUrl"
  />
</template>
```

### 事件监听

```vue
<script setup lang="ts">
const playerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const el = playerRef.value;
  if (!el) return;

  el.addEventListener("nmpv3:songchange", (event) => {
    console.log("歌曲切换", event.target);
  });
});
</script>

<template>
  <nmp-player ref="playerRef" playlist-id="14273792576" />
</template>
```

## 常见问题排障指南

### 500 window is not defined

- 确认插件文件后缀为 `.client.ts`
- 确认未在服务端组件或 API 路由中导入 `netease-mini-player-v3/auto`

### 自定义元素未注册

- 检查 `.client.ts` 插件是否正确放置在 `plugins/` 目录
- 检查 Nuxt 是否识别插件（`nuxt.config.ts` 的 `plugins` 配置通常不需要显式声明，因为 `plugins/` 目录自动扫描）

### 构建产物过大

NMPv3 为零依赖包，但播放器本身包含 UI 与音频逻辑。Nuxt 会自动按路由分割，该插件仅在需要 `<nmp-player>` 的页面加载。

### 事件监听时机

客户端插件在应用挂载后执行，页面组件中的 `onMounted` 钩子已可安全访问 `window.NMPv3`。

## 进阶扩展开发方案

### 客户端组合式函数

封装 `useNMPv3` 组合式函数，提供类型安全的实例访问：

```ts
// composables/useNMPv3.ts
export function useNMPv3() {
  if (import.meta.client) {
    return window.NMPv3;
  }
  return null;
}
```

```vue
<script setup lang="ts">
const nmpv3 = useNMPv3();

onMounted(() => {
  nmpv3?.setApiBaseUrl("/api/netease");
});
</script>
```

### API 路由代理

Nuxt 可配置服务端 API 路由代理网易云接口，避免浏览器直接请求公共 API：

```ts
// server/api/netease/[...].ts
export default defineEventHandler(async (event) => {
  // 将请求转发到实际代理
});
```

然后设置 `api-base-url="/api/netease"`。

### 路由守卫暂停

```vue
<script setup lang="ts">
onBeforeUnmount(() => {
  window.NMPv3?.pauseAll();
});
</script>
```

### 与 Nuxt UI 集成

NMPv3 的主题与布局独立运行，不需要 Nuxt UI 的 CSS 变量。可通过 `theme="auto"` 让播放器跟随系统主题，与 Nuxt Color Mode 保持一致。
