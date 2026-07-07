# NMPv3+ 快速开始

NMPv3+ 需要先有一个基础 NMPv3 播放器，Plus 框架在此基础上挂载插件、皮肤、音乐源、歌词和宿主联动。

## 安装

```bash
npm install @netease-mini-player/v3 @netease-mini-player/v3-plus
pnpm add @netease-mini-player/v3 @netease-mini-player/v3-plus
```

## 浏览器部署

先加载 NMPv3，再加载 Plus 浏览器入口：

```html
<script src="/node_modules/@netease-mini-player/v3/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="/node_modules/@netease-mini-player/v3-plus/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

没有配置高级扩展时，播放器仍显示 NMPv3 的基础 compact UI。

## 启用高级视觉

高级布局、频谱和强风格皮肤都需要显式配置：

```html
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    enabledExtensions: ["advanced-layouts", "visualizer", "host-sync"],
    defaultSkin: "glass",
  };
</script>

<nmp-player
  playlist-id="14273792576"
  skin="glass"
  plus-extensions="advanced-layouts,visualizer"
  plus-layout="cover"
></nmp-player>
```

## 本地 JSON 歌单

本地音乐属于 Plus。HTML 中可以写：

```html
<nmp-player
  source-type="local-json"
  source="/music/playlist.json"
  lyric="true"
  layout="compact"
></nmp-player>
```

JSON 示例：

```json
{
  "songs": [
    {
      "id": "local-001",
      "name": "Local Song",
      "artists": "Artist",
      "album": "Album",
      "picUrl": "/music/cover.jpg",
      "url": "/music/song.mp3",
      "lyricUrl": "/music/song.lrc",
      "translationLyricUrl": "/music/song.zh.lrc"
    }
  ]
}
```

应用代码中注册来源和歌词：

```ts
import {
  createLocalJsonSourceAdapter,
  createNMPv3PlusApp,
  createStaticLyricsAdapter,
  officialNMPv3PlusSkins,
} from "@netease-mini-player/v3-plus";

await createNMPv3PlusApp()
  .source(createLocalJsonSourceAdapter())
  .lyrics(
    createStaticLyricsAdapter({
      "local-001": "[00:00.00]Ready\n[00:12.00]Local lyric",
    }),
  )
  .skin(...officialNMPv3PlusSkins)
  .skin("default")
  .mount({
    root: document.querySelector("nmp-player"),
    player: window.NMPv3?.getPlayers()[0],
    debug: true,
  });
```

## 开发模式与生产模式

Plus runtime 默认日志适合开发阶段排查插件、皮肤和来源加载问题。

生产站点可以关闭默认日志：

```ts
await createNMPv3PlusApp().mount({
  root: document.querySelector("nmp-player"),
  player: window.NMPv3?.getPlayers()[0],
  debug: false,
});
```

## 验证命令

```bash
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus build
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```
