# 浏览器直接引用

浏览器直接引用是 NMPv3 的默认使用方式，适用于静态页面、博客主题、CMS 模板及无需前端构建流程的站点。

复制可运行示例时，使用本页的最小 HTML。公共 CDN 地址和固定版本写法参阅 [CDN 引用](../guide/cdn)。

## 准备文件

构建 NMPv3：

```bash
pnpm --filter netease-mini-player-v3 build
```

构建后会得到：

```txt
nmpv3/dist/nmpv3.min.js
nmpv3/dist/nmpv3.es.js
nmpv3/dist/nmpv3.d.ts
```

普通浏览器引用只需要复制 `nmpv3.min.js`。

## 最小 HTML

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NMPv3 Demo</title>
  </head>
  <body>
    <nmp-player playlist-id="14273792576"></nmp-player>

    <script src="/assets/nmpv3.min.js"></script>
  </body>
</html>
```

脚本加载后会自动注册 `<nmp-player>`，自动扫描页面中的播放器元素，并注入基础样式。

## CDN HTML

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## 单曲播放器

```html
<nmp-player song-id="1901371647" theme="auto" layout="compact"></nmp-player>
```

## 歌单播放器

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
  playlist="true"
></nmp-player>
```

## 文章内嵌播放器

文章内嵌播放器适合正文、卡片、评论区或宽度较窄的区域。它会固定为静态 mini 布局，并关闭页面级悬浮、拖拽和播放列表面板。

```html
<nmp-player
  song-id="1901371647"
  embed="true"
  embed-mode="article"
  lyric="false"
></nmp-player>
```

## 页面悬浮播放器

页面悬浮播放器适合站点全局音乐条。它可以使用 dock 布局、角落位置、最小化和空闲透明度。

```html
<nmp-player
  playlist-id="14273792576"
  embed-mode="page"
  layout="dock"
  position="bottom-right"
  default-minimized="true"
  idle-opacity="0.72"
  storage-key="site-player"
></nmp-player>
```

## 替换 API 代理

按播放器设置：

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

按全局设置：

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
<script src="/assets/nmpv3.min.js"></script>
```

加载后运行时切换：

```js
window.NMPv3.setApiBaseUrl("/api/netease");
```

兼容旧模板时也可以使用标量别名：

```html
<script>
  window.NMPv3ApiBaseUrl = "/api/netease";
  window.NeteaseMiniPlayerApiBaseUrl = "/api/netease";
</script>
```

## 旧 DOM 迁移

旧版 DOM 会被自动升级：

```html
<div
  class="netease-mini-player"
  data-song-id="1901371647"
  data-theme="auto"
  data-position="static"
></div>
```

升级后会创建 NMPv3 播放器实例，并保留基础配置。

## 短代码

NMPv3 支持新短代码和 v2 短代码：

```txt
{nmpv3:playlist=14273792576, theme=auto, layout=compact}
{nmpv2:song-id=1901371647, position=bottom-left, theme=dark}
```

短代码没有指定 `position` 时，默认按文章内嵌播放器处理。指定浮动位置时，按页面播放器处理。
