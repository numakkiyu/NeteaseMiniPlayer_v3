# Astro

Astro 的 Islands 架构允许在静态 HTML 中直接输出 `<nmp-player>`。由于 NMPv3 是原生 Web Component，在 `.astro` 文件中导入自动注册入口即可，无需客户端 JavaScript 框架。

## 前置环境依赖检查

- Node.js 18+
- Astro 3.0+
- 已安装 `@netease-mini-player/v3`：`npm install @netease-mini-player/v3`

## NMPv3 包安装与配置流程

```bash
npm install @netease-mini-player/v3
```

在 `.astro` 组件的 frontmatter 中导入：

```astro
---
import "@netease-mini-player/v3/auto";
---
```

Astro 会在构建时处理该导入，并在页面中输出对应的脚本与注册逻辑。

### 全局 API 地址配置

在 `src/layouts/Layout.astro` 的 `<head>` 中直接注入内联脚本：

```astro
---
import "@netease-mini-player/v3/auto";
---

<head>
  <script is:inline>
    window.NMPv3Config = { apiBaseUrl: "/api/netease" };
  </script>
</head>
```

`is:inline` 确保脚本不被 Astro 处理，直接输出到 HTML。

## 核心功能接入代码示例

### 基础组件

```astro
---
import "@netease-mini-player/v3/auto";
---

<nmp-player
  playlist-id="14273792576"
  api-base-url="/api/netease"
  theme="auto"
  layout="compact"
></nmp-player>
```

### 属性动态化

通过 Astro props 传递：

```astro
---
import "@netease-mini-player/v3/auto";

interface Props {
  playlistId?: string;
  songId?: string;
  theme?: "auto" | "light" | "dark";
  layout?: "mini" | "compact" | "dock";
  apiBaseUrl?: string;
}

const {
  playlistId = "14273792576",
  songId,
  theme = "auto",
  layout = "compact",
  apiBaseUrl = "/api/netease",
} = Astro.props;
---

<nmp-player
  playlist-id={playlistId}
  song-id={songId}
  theme={theme}
  layout={layout}
  api-base-url={apiBaseUrl}
></nmp-player>
```

### 事件监听

Astro 中可通过客户端脚本标签监听事件：

```astro
<nmp-player id="player" playlist-id="14273792576"></nmp-player>

<script>
  const player = document.getElementById("player");
  if (player) {
    player.addEventListener("nmpv3:play", () => {
      console.log("播放开始");
    });
  }
</script>
```

## 常见问题排障指南

### 构建时报错：document is not defined

- 确认在 `.astro` 的 frontmatter 中导入 `@netease-mini-player/v3/auto`
- 不要在没有 `client:*` 指令的框架组件中导入该包

### 自定义元素未注册

- 检查 `import "@netease-mini-player/v3/auto"` 是否出现在 frontmatter 顶部
- 确保 Astro 将该组件导入到了最终页面

### 客户端脚本重复执行

Astro 的 `<script>` 默认按模块加载，每个页面实例只会注册一次。NMPv3 的 `defineNMPv3` 也为幂等操作，重复调用不会报错。

### 内容集合集成

在 Markdown/MDX 内容中使用 Astro 组件渲染播放器：

```mdx
import NMPv3Player from "../components/NMPv3Player.astro";

<NMPv3Player playlistId="14273792576" />
```

## 进阶扩展开发方案

### 静态站点导出

Astro 的 `output: "static"` 模式完全兼容 NMPv3，构建产物为纯 HTML 与 JS，无需服务端运行时。

### 混合渲染

对于需要 SSR 的页面，仍可在 `.astro` 组件中使用 `<nmp-player>`，因为自动注册入口在客户端执行，不依赖服务端 `window` 对象。

### 自定义 API 代理

通过 `astro.config.mjs` 的 `vite.server.proxy` 配置开发代理，或部署到 Vercel/Netlify 的 Edge Function：

```js
export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/api/netease": {
          target: "https://api.hypcvgm.top",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/netease/, "/NeteaseMiniPlayer/nmp.php"),
        },
      },
    },
  },
});
```

### 性能优化

NMPv3 脚本只在使用 `<nmp-player>` 的页面加载。Astro 的 Islands 机制不会在无播放器页面注入多余脚本。
