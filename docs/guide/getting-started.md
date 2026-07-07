# 快速开始

本页给出开源仓库使用者最常见的两条路径：通过 CDN 嵌入，或通过 npm 包集成到前端项目。

## 通过 CDN 使用 NMPv3

NMPv3 是推荐的默认嵌入方式：

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

生产站点建议固定版本号：

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
```

## 通过 npm 使用 NMPv3

```bash
npm install netease-mini-player-v3
pnpm add netease-mini-player-v3
```

```ts
import "netease-mini-player-v3/auto";
```

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## API 代理配置

默认 API 代理：

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

使用自建代理：

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

也可以在脚本加载前设置全局配置：

```html
<script>
  window.NMPv3Config = {
    apiBaseUrl: "/api/netease",
  };
</script>
<script src="/assets/nmpv3.min.js"></script>
```

## 使用 NMPv3+

NMPv3+ 面向扩展集成。它需要先加载基础 NMPv3：

```bash
npm install netease-mini-player-v3 netease-mini-player-v3-plus
pnpm add netease-mini-player-v3 netease-mini-player-v3-plus
```

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@3.0.0-alpha.0/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

没有启用扩展时，Plus 不改变基础播放器的默认界面。

## 本地开发

```bash
pnpm install
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3-plus build
pnpm docs:dev
```

文档站默认运行在：

```txt
http://127.0.0.1:5173/
```

## 继续阅读

- [CDN 引用](./cdn)
- [自定义配置](./custom-configuration)
- [框架集成总览](./framework-integration)
