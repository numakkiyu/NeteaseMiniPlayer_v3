# 深度自定义开发流程

NMPv3+ 的深度自定义不是直接改一个巨大播放器文件，而是按能力拆分：来源负责歌曲数据，歌词负责文本，皮肤负责视觉令牌和 CSS，插件负责行为，HostBridge 负责宿主页面联动，自定义构建负责部署产物。

## 推荐流程

1. 先使用 NMPv3 完成基础播放器部署
2. 决定数据来源是网易云、本地 JSON、静态列表还是自定义 API
3. 决定歌词来源是网易云、本地 LRC、静态文本还是翻译文件
4. 决定是否需要官方插件
5. 决定是否需要官方皮肤或用户皮肤
6. 决定是否需要 HostBridge 联动页面
7. 通过 app 入口组合能力
8. 执行构建和 UI smoke 验证
9. 生成自定义部署包

## 组合式入口

推荐把所有能力集中注册：

```ts
const app = createNMPv3PlusApp()
  .source(createLocalJsonSourceAdapter())
  .lyrics(createStaticLyricsAdapter({}))
  .skin(...officialNMPv3PlusSkins)
  .skin("default")
  .use(createHostSyncPlugin());

const runtime = await app.mount({
  root: document.querySelector("nmp-player"),
  player: window.NMPv3?.getPlayers()[0],
});
```

组合式入口按顺序声明来源、歌词、皮肤和插件，在 mount 前完成注册。

## 直接使用 runtime

需要更细粒度的控制时，可直接使用 runtime：

```ts
const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  player: window.NMPv3?.getPlayers()[0],
});

runtime.registerSource(createLocalJsonSourceAdapter());
runtime.registerLyrics(createStaticLyricsAdapter({}));
runtime.registerSkin(defaultSkin);

await runtime.installPlugin(createHostSyncPlugin());
await runtime.loadPlaylist({
  source: "local-json",
  url: "/music/playlist.json",
});
```

直接使用 runtime 时需要自行保证注册顺序和错误处理。

## 自定义功能开发分层

| 需求                                 | 应该扩展的位置    |
| ------------------------------------ | ----------------- |
| 换播放器颜色、圆角、背景和字体       | Skin              |
| 加一个频谱、播放状态标记或视觉层     | Plugin            |
| 从本地 JSON 或业务 API 取歌          | SourceAdapter     |
| 从 LRC、JSON 或静态文本取歌词        | LyricsAdapter     |
| 把当前歌曲写入页面属性或 CSS 变量    | HostBridge        |
| 选择扩展和皮肤后输出部署目录         | CLI custom build  |
| 在 React、Vue、Next 等框架中生成属性 | Framework adapter |

## 开发一个插件

插件只处理行为。它不应该修改 NMPv3 基础包，也不应该假设宿主页面结构固定。

```ts
export default {
  name: "nmpv3-plus-extension-user-wave",
  setup(ctx) {
    const stop = ctx.on("songchange", ({ song }) => {
      ctx.setToken("--nmpv3-user-wave-active", song ? "1" : "0");
    });

    return () => stop();
  },
};
```

插件需要清理自己注册的事件、定时器和 DOM 副作用。

## 开发一个皮肤

皮肤应该优先使用 CSS 变量和有限选择器。用户皮肤一般包含：

```txt
skin.json
skin.css
```

`skin.json` 示例：

```json
{
  "name": "studio-deep",
  "displayName": "Studio Deep",
  "version": "1.0.0",
  "author": "User",
  "supports": ["mini", "compact", "dock", "card", "cover"],
  "tokens": {
    "--nmpv3-bg": "rgba(16, 20, 28, 0.92)",
    "--nmpv3-text": "#f7f2e8",
    "--nmpv3-accent": "#ff8a50",
    "--nmpv3-radius": "18px"
  }
}
```

`skin.css` 会被 Plus 的皮肤加载流程隔离到生成的皮肤 class 下，避免影响页面其他区域。

## 开发一个自定义来源

自定义来源应该只负责把业务数据转换成播放器能理解的歌曲和歌单结构。

```ts
const mySource = {
  name: "my-api",
  async getPlaylist(id) {
    const response = await fetch(`/api/playlists/${id}`);
    const data = await response.json();

    return {
      id,
      name: data.title,
      songs: data.songs.map((song) => ({
        id: song.id,
        name: song.name,
        artists: song.artist,
        album: song.album,
        picUrl: song.cover,
        url: song.audioUrl,
      })),
    };
  },
};

runtime.registerSource(mySource);
```

不要把自定义来源下放到 NMPv3。轻量版只保留网易云。

## 开发 HostBridge 联动

HostBridge 适合把播放器状态写到宿主页面：

```ts
runtime.bridgeHost({
  target: "body",
  rules: [
    {
      on: "songchange",
      attribute: {
        "data-current-song": "{{song.id}}",
      },
      style: {
        "--site-cover": "url({{song.picUrl}})",
      },
      className: {
        "nmp-is-playing": "{{player.isPlaying}}",
      },
    },
  ],
});
```

规则应保持明确，禁止插件直接查询宿主 DOM。

## 交付前检查

深度自定义完成后检查：

- NMPv3 基础播放器仍可单独构建
- Plus 没有把插件、皮肤或来源逻辑写回 NMPv3
- 插件卸载后事件和样式能清理
- 用户皮肤 CSS 没有泄露到页面其他区域
- 本地 JSON 和歌词 URL 可访问
- HostBridge 只修改明确的目标元素
- 自定义构建包中 manifest、runtime、extensions、skins 路径完整
