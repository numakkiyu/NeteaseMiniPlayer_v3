# React

React 通过原生 Web Component 使用 NMPv3。由于 `<nmp-player>` 不是 React 组件，推荐用 `createElement` 渲染，避免 JSX 对未知标签的类型检查问题。

## 前置环境依赖检查

- Node.js 18+
- React 18+ 或 React 19
- 支持 ES modules 的构建工具（Vite、Create React App、Rspack 等）
- 已安装 `@netease-mini-player/v3`：`npm install @netease-mini-player/v3`

## NMPv3 包安装与配置流程

```bash
npm install @netease-mini-player/v3
```

入口文件导入自动注册入口：

```ts
import "@netease-mini-player/v3/auto";
```

导入后，`window.NMPv3` 会挂载到浏览器全局，且 `<nmp-player>` 自定义元素已注册。

### 全局 API 地址配置

在 `index.html` 或根组件注入：

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
```

或在运行时调用：

```ts
window.NMPv3?.setApiBaseUrl("/api/netease");
```

## 核心功能接入代码示例

### 使用 createElement 渲染

```tsx
import "@netease-mini-player/v3/auto";
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

### 在 JSX 中直接书写

如果项目已配置自定义元素类型，可以直接写 JSX：

```tsx
import "@netease-mini-player/v3/auto";

export function NMPv3Player() {
  return (
    <nmp-player
      playlist-id="14273792576"
      api-base-url="/api/netease"
      theme="auto"
      layout="compact"
    />
  );
}
```

对应的 TypeScript 声明：

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

将声明放入项目根目录的 `global.d.ts` 或 `nmpv3.d.ts` 中。

### 事件监听

```tsx
import { useEffect, useRef } from "react";

export function NMPv3Player() {
  const playerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;

    const handlePlay = () => console.log("播放开始");
    el.addEventListener("nmpv3:play", handlePlay);

    return () => el.removeEventListener("nmpv3:play", handlePlay);
  }, []);

  return (
    <nmp-player
      ref={playerRef}
      playlist-id="14273792576"
      api-base-url="/api/netease"
    />
  );
}
```

## 常见问题排障指南

### JSX 报错：nmp-player 不存在于 JSX.IntrinsicElements

- 添加 `global.d.ts` 声明
- 或改用 `createElement("nmp-player", ...)` 渲染

### 构建产物报错 window is not defined

- 确认在浏览器环境导入 `@netease-mini-player/v3/auto`
- 不要在服务端渲染组件中直接导入该包

### React StrictMode 下重复挂载

NMPv3 自定义元素注册为幂等操作，重复挂载不会导致错误。事件监听应在 `useEffect` 清理函数中移除。

### 播放器实例无法获取

React 中可通过 `window.NMPv3.getPlayers()` 获取所有实例，或通过 DOM 事件间接控制。

## 进阶扩展开发方案

### 受控组件封装

将播放器封装为可复用组件，暴露配置属性：

```tsx
import { createElement } from "react";
import "@netease-mini-player/v3/auto";

interface NMPv3PlayerProps {
  playlistId?: string;
  songId?: string;
  theme?: "auto" | "light" | "dark";
  layout?: "mini" | "compact" | "dock";
  apiBaseUrl?: string;
}

export function NMPv3Player({
  playlistId,
  songId,
  theme = "auto",
  layout = "compact",
  apiBaseUrl = "/api/netease",
}: NMPv3PlayerProps) {
  return createElement("nmp-player", {
    "playlist-id": playlistId,
    "song-id": songId,
    "api-base-url": apiBaseUrl,
    theme,
    layout,
  });
}
```

### 状态同步

通过 `nmpv3:songchange` 事件将播放器状态同步到 React 状态：

```tsx
useEffect(() => {
  const el = playerRef.current;
  if (!el) return;

  const handler = () => {
    const players = window.NMPv3?.getPlayers() ?? [];
    if (players.length > 0) {
      setSong(players[0].getCurrentSong());
    }
  };

  el.addEventListener("nmpv3:songchange", handler);
  return () => el.removeEventListener("nmpv3:songchange", handler);
}, []);
```

### 路由切换后暂停

```tsx
useEffect(() => {
  return () => {
    window.NMPv3?.pauseAll();
  };
}, []);
```

### 与 UI 库共存

NMPv3 样式由 JavaScript 注入页面 `<head>`，不会与 Tailwind CSS、Styled Components 产生样式冲突。React 项目中无需额外适配。
