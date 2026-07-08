# NMPv3+

NMPv3+ 是 NeteaseMiniPlayer v3 Plus 的高级扩展框架。它在 NMPv3 基础播放器之上提供插件、皮肤、自定义来源、自定义歌词、宿主页面联动、框架适配和自定义构建。

## 适用场景

- 需要本地 JSON 歌单或业务 API 音乐来源
- 需要加载 LRC、翻译歌词或静态歌词
- 需要页面背景、CSS 变量、URL 或 DOM 属性跟随播放状态变化
- 需要官方或用户插件
- 需要官方或用户皮肤
- 需要 React、Vue3、Nuxt、Astro、Svelte 等框架适配器
- 需要 WordPress 高级集成或部署包构建

普通网页嵌入优先使用 [NMPv3](../nmpv3/)。

## 基础加载顺序

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.1/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@3.0.0-alpha.1/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

## 推荐应用入口

```ts
await createNMPv3PlusApp()
  .source(createLocalJsonSourceAdapter())
  .lyrics(createStaticLyricsAdapter({}))
  .skin(...officialNMPv3PlusSkins)
  .skin("default")
  .use(createHostSyncPlugin())
  .mount({
    root: document.querySelector("nmp-player"),
    player: window.NMPv3?.getPlayers()[0],
  });
```

## 阅读路径

- [快速开始](./getting-started)
- [深度自定义流程](./deep-customization)
- [框架适配](./frameworks)
- [插件与皮肤](./plugins-skins)
- [音乐源与歌词](./sources-lyrics)
- [自定义构建](./custom-build)
