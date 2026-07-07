# Next.js

Next.js 区分服务端组件与客户端组件。NMPv3 依赖浏览器全局对象，因此必须在客户端组件中使用，并通过 `useEffect` 动态导入自动注册入口。

## 前置环境依赖检查

- Node.js 18+
- Next.js 14+（App Router 或 Pages Router 均可）
- React 18+
- 已安装 `netease-mini-player-v3`：`npm install netease-mini-player-v3`

## NMPv3 包安装与配置流程

```bash
npm install netease-mini-player-v3
```

创建客户端组件，使用 `"use client"` 指令：

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

### 全局 API 地址配置

在 `app/layout.tsx` 或 `pages/_app.tsx` 中通过 `<Script>` 组件注入：

```tsx
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <Script strategy="beforeInteractive">
          {`window.NMPv3Config = { apiBaseUrl: "/api/netease" };`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

或在 `useEffect` 中调用：

```tsx
useEffect(() => {
  void import("netease-mini-player-v3/auto").then(() => {
    window.NMPv3?.setApiBaseUrl("/api/netease");
  });
}, []);
```

## 核心功能接入代码示例

### App Router 客户端组件

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

在服务端页面中使用：

```tsx
import { NMPv3Player } from "@/components/NMPv3Player";

export default function Page() {
  return <NMPv3Player />;
}
```

### Pages Router 组件

Pages Router 中同样使用 `"use client"` 组件，或在 `useEffect` 中动态导入。组件文件放在 `components/` 目录即可。

### 事件监听

```tsx
"use client";

import { useEffect, useRef } from "react";

export function NMPv3Player() {
  const playerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    void import("netease-mini-player-v3/auto");
  }, []);

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

### 服务端组件报错 window is not defined

- 包含 `import("netease-mini-player-v3/auto")` 的文件必须添加 `"use client"`
- 不要在服务端组件中访问 `window.NMPv3`

### 水合错误

- 自定义元素的 HTML 属性与水合后状态一致即可，通常不会触发水合不匹配
- 若遇到 hydration mismatch，将播放器包装在仅客户端渲染的边界内，如 `useEffect(() => setMounted(true))`

### 构建产物包含服务端导入

- 检查动态导入是否使用 `import("netease-mini-player-v3/auto")` 而非顶层 import
- 确认 `"use client"` 指令未被移除

### 自定义元素类型缺失

添加 `global.d.ts`：

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

## 进阶扩展开发方案

### 路由 API 代理

通过 Next.js Route Handlers 代理网易云接口：

```ts
// app/api/netease/[...path]/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL(
    url.pathname.replace("/api/netease", "/NeteaseMiniPlayer/nmp.php"),
    "https://api.hypcvgm.top",
  );
  target.search = url.search;

  return fetch(target.toString(), {
    headers: { "Content-Type": "application/json" },
  });
}
```

客户端设置 `api-base-url="/api/netease"`。

### 路由切换暂停

```tsx
"use client";

import { useEffect } from "react";

export function PauseOnNavigation() {
  useEffect(() => {
    return () => {
      window.NMPv3?.pauseAll();
    };
  }, []);

  return null;
}
```

### 动态导入减少首屏 JS

NMPv3 通过动态导入延迟加载，仅在需要播放器的页面触发网络请求。Next.js 的代码分割会自动处理该 chunk。

### 状态同步到 React

```tsx
useEffect(() => {
  const el = playerRef.current;
  if (!el) return;

  const handleSongChange = () => {
    const players = window.NMPv3.getPlayers();
    if (players.length > 0) {
      setCurrentSong(players[0].getCurrentSong());
    }
  };

  el.addEventListener("nmpv3:songchange", handleSongChange);
  return () => el.removeEventListener("nmpv3:songchange", handleSongChange);
}, []);
```

### 与 Tailwind CSS 共存

NMPv3 的样式不依赖 Tailwind，也不会被 Tailwind 的 Preflight 覆盖。使用默认布局即可，无需额外 CSS 配置。
