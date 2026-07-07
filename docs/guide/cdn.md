# CDN 引用

NeteaseMiniPlayer v3 是基于 NeteaseCloudMusicApi 的轻量级可插入式音乐播放器 UI 组件库。项目发布到 npm 后，可以像常见 JavaScript 库一样通过 jsDelivr 或 unpkg 引用。

NMPv3 是默认推荐的单文件 CDN 入口。NMPv3+ 只在需要插件、皮肤、来源、歌词或宿主联动时额外加载。生产页面建议固定版本号，避免 `latest` 带来不可预期的升级。

## NMPv3 via jsDelivr

```html
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

固定版本：

```html
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
```

## NMPv3 via unpkg

```html
<script src="https://unpkg.com/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>

<nmp-player song-id="1901371647" theme="auto" layout="mini"></nmp-player>
```

## NMPv3+ via jsDelivr

NMPv3+ 需要先加载基础播放器，再加载 Plus 浏览器入口：

```html
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3-plus@latest/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

## NMPv3+ via unpkg

```html
<script src="https://unpkg.com/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<script
  type="module"
  src="https://unpkg.com/@netease-mini-player/v3-plus@latest/dist/browser.js"
></script>

<nmp-player
  playlist-id="14273792576"
  plus-extensions="host-sync"
  layout="compact"
></nmp-player>
```

## 包入口字段

NMPv3 包发布字段：

```json
{
  "main": "./dist/nmpv3.min.js",
  "module": "./dist/nmpv3.es.js",
  "unpkg": "./dist/nmpv3.min.js",
  "jsdelivr": "./dist/nmpv3.min.js"
}
```

NMPv3+ 包发布字段：

```json
{
  "main": "./dist/index.js",
  "unpkg": "./dist/browser.js",
  "jsdelivr": "./dist/browser.js"
}
```

## 使用建议

- 公开网站建议固定版本号
- 本地验证可以使用 `latest`
- NMPv3 是普通 CDN 嵌入的默认选择
- NMPv3+ 只在需要插件、皮肤、来源、歌词或宿主联动时加载
- 自建 API 代理时优先使用 `api-base-url` 或 `window.NMPv3Config.apiBaseUrl`
