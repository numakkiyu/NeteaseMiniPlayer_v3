# 自定义配置

本页整理 NMPv3 与 NMPv3+ 的配置方式。NMPv3 负责轻量播放器配置，NMPv3+ 负责扩展框架配置。

## NMPv3 HTML 属性

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
  api-base-url="/api/netease"
  lyric="true"
  playlist="true"
></nmp-player>
```

常用属性：

| 属性           | 说明                      |
| -------------- | ------------------------- |
| `song-id`      | 网易云单曲 ID             |
| `playlist-id`  | 网易云歌单 ID             |
| `api-base-url` | 网易云 API 代理地址       |
| `theme`        | `auto`、`light`、`dark`   |
| `layout`       | `compact`、`mini`、`dock` |
| `position`     | `static` 或四角悬浮位置   |
| `embed-mode`   | `article` 或 `page`       |
| `lyric`        | 是否显示歌词              |
| `playlist`     | 是否显示播放列表入口      |
| `remember`     | 是否记忆播放器状态        |

## NMPv3 全局配置

脚本加载前设置：

```html
<script>
  window.NMPv3Config = {
    apiBaseUrl: "/api/netease",
    theme: "auto",
    layout: "compact",
  };
</script>
<script src="/assets/nmpv3.min.js"></script>
```

运行时更新：

```js
window.NMPv3.setGlobalConfig({
  apiBaseUrl: "/api/netease",
});

window.NMPv3.setApiBaseUrl("/api/netease");
```

## NMPv3 CSS 变量

```css
nmp-player {
  --nmpv3-accent: #ff6b35;
  --nmpv3-radius: 16px;
  --nmpv3-bg: rgba(255, 255, 255, 0.92);
  --nmpv3-text: #222222;
  --nmpv3-idle-opacity: 0.72;
}
```

CSS 变量适合做基础外观调整。完整皮肤包属于 NMPv3+。

## NMPv3+ 浏览器配置

```html
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
    enabledExtensions: ["host-sync"],
    enabledSkins: ["default", "glass"],
  };
</script>
<script type="module" src="/deploy/nmpv3-plus.bootstrap.js"></script>
```

Plus 配置只影响高级框架能力。基础播放仍由 NMPv3 提供。

## NMPv3+ 应用代码配置

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
    debug: false,
  });
```

## 配置边界

| 需求                                    | 使用位置 |
| --------------------------------------- | -------- |
| 网易云单曲、歌单、主题、布局、API 代理  | NMPv3    |
| 基础 CSS 变量调色                       | NMPv3    |
| 插件、皮肤、自定义来源、自定义歌词      | NMPv3+   |
| HostBridge 页面联动                     | NMPv3+   |
| React、Vue3、Nuxt、Astro、Svelte 适配器 | NMPv3+   |
