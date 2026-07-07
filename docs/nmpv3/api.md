# API 与配置

NMPv3 提供浏览器全局对象和 ESM 导出。浏览器全局对象是 `window.NMPv3`，旧品牌别名是 `window.NeteaseMiniPlayer`。

## 全局对象

```ts
window.NMPv3;
window.NeteaseMiniPlayer;
```

常用方法：

```ts
window.NMPv3.init();
window.NMPv3.create("#music", {
  playlistId: "14273792576",
  theme: "auto",
  layout: "compact",
});
window.NMPv3.pauseAll();
window.NMPv3.setApiBaseUrl("/api/netease");
```

## ESM 导出

```ts
import {
  createNMPv3Player,
  defineNMPv3,
  parseLrc,
  syncLyric,
} from "@netease-mini-player/v3";
```

`defineNMPv3()` 会注册 `<nmp-player>` 并注入样式。`createNMPv3Player()` 会在指定 DOM 上创建播放器实例。

## 播放器实例

实例方法包括：

```ts
await player.play();
player.pause();
await player.toggle();
await player.next();
await player.previous();
await player.loadSong("1901371647");
await player.loadPlaylist("14273792576");
player.setVolume(0.8);
player.setTheme("dark");
player.setLayout("compact");
await player.updateConfig({ apiBaseUrl: "/api/netease" });
player.destroy();
```

读取状态：

```ts
const state = player.getState();
const song = player.getCurrentSong();
```

## 配置对象

`createNMPv3Player()` 和 `updateConfig()` 使用 camelCase 配置：

```ts
createNMPv3Player("#music", {
  playlistId: "14273792576",
  theme: "auto",
  layout: "compact",
  embedMode: "page",
  position: "static",
  volume: 0.8,
  showLyrics: true,
  showPlaylist: true,
  apiBaseUrl: "/api/netease",
});
```

HTML 属性使用 kebab-case：

```html
<nmp-player
  playlist-id="14273792576"
  embed-mode="page"
  api-base-url="/api/netease"
></nmp-player>
```

## 默认配置

| 配置                | 默认值    |
| ------------------- | --------- |
| `theme`             | `auto`    |
| `layout`            | `compact` |
| `embed`             | `false`   |
| `embedMode`         | `page`    |
| `position`          | `static`  |
| `volume`            | `0.8`     |
| `autoplay`          | `false`   |
| `showLyrics`        | `true`    |
| `showPlaylist`      | `true`    |
| `defaultMinimized`  | `false`   |
| `autoPauseOnHidden` | `true`    |
| `remember`          | `true`    |
| `draggable`         | `true`    |
| `hotkeys`           | `true`    |
| `idleOpacity`       | `0.72`    |

默认 API：

```txt
https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php
```

## API 代理要求

NMPv3 只需要代理支持这些网易云接口：

```txt
/song/detail
/playlist/track/all
/song/url/v1
/lyric
```

代理路径有前缀时，将前缀作为 `api-base-url` 传入。

NMPv3 不要求代理提供登录、私有用户数据、下载 URL、本地音乐匹配或第三方音乐平台接口。

## 全局配置优先级

常见优先级从具体到通用：

1. `<nmp-player api-base-url="...">`
2. `window.NMPv3Config.apiBaseUrl`
3. `window.NMPv3ApiBaseUrl`
4. `window.NeteaseMiniPlayerApiBaseUrl`
5. 内置默认 API

运行时可以调用：

```js
window.NMPv3.setGlobalConfig({
  apiBaseUrl: "/api/netease",
});
```

或：

```js
window.NMPv3.setApiBaseUrl("/api/netease");
```
