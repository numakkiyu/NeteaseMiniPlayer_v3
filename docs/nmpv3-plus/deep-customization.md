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

插件只处理行为，不修改 NMPv3 基础包，也不假设宿主页面结构固定。

### 上下文里有什么

`setup(ctx)` 拿到的上下文分成四类能力：

| 能力                        | 说明                                   |
| --------------------------- | -------------------------------------- |
| `ctx.player` / `ctx.audio`  | 底层播放器与 audio 元素，可能为 `null` |
| `ctx.store`                 | 键值存储，带 `subscribe`               |
| `ctx.source` / `ctx.lyrics` | 加载与注册来源、歌词适配器             |
| `ctx.config`                | 读写播放器配置                         |
| `ctx.slot`                  | 往播放器里挂自定义 UI                  |
| `ctx.command`               | 注册可被外部调用的命令                 |
| `ctx.shortcut`              | 注册快捷键                             |
| `ctx.logger`                | 分级日志                               |

`ctx.config` / `ctx.slot` / `ctx.command` / `ctx.shortcut` 是 3.0.2 新增的，
老插件不实现也能继续运行。

### 配置通道

读写播放器配置，不需要自己去找实例、也不需要猜 DOM：

```ts
setup(ctx) {
  // 当前快照，播放器不支持时返回空对象，不需要判空
  const config = ctx.config.get();

  // 写回播放器，失败返回 false，不抛错
  await ctx.config.patch({ palette: "jade", paletteFollowHost: false });

  // 订阅变化，返回取消订阅函数
  const stop = ctx.config.subscribe((next, previous) => {
    ctx.logger.info("palette", previous.palette, "→", next.palette);
  });

  return () => stop();
}
```

明暗判定顺序是固定的：显式 `theme` > 宿主背景亮度 > 系统偏好。
`paletteFollowHost` 只影响色相，不改变这个顺序。

### 插槽

`ctx.slot.register(name, renderer)` 往播放器里挂 DOM。内置三个位置：

| 插槽名    | 位置                       |
| --------- | -------------------------- |
| `toolbar` | 底部工具按钮行前面         |
| `overlay` | 覆盖整个播放器的浮层       |
| `panel`   | 底部行下方，适合展开式面板 |

其它名字会挂到播放器根节点末尾。同一插槽可以注册多个渲染器，`order` 小的靠前。

```ts
setup(ctx) {
  return ctx.slot.register("toolbar", ({ container, onCleanup }) => {
    const button = document.createElement("button");
    button.textContent = "调色";
    button.addEventListener("click", () => {
      void ctx.config.patch({ palette: "iris" });
    });

    container.append(button);

    // 卸载时执行，用来断开自己加的外部引用
    onCleanup(() => button.remove());
  });
}
```

插槽只负责定位，不提供样式——外观由插件自己的 CSS 决定，
这样官方皮肤和第三方插件不会互相覆盖。
某个渲染器抛错只影响它自己，不会连带其它插槽。

### 命令与快捷键

命令给宿主页面或其它插件一个统一的调用入口，不需要互相 import：

```ts
setup(ctx) {
  const disposeCommand = ctx.command.register({
    id: "myplugin.setPalette",
    title: "设置配色",
    handler: (palette) => ctx.config.patch({ palette: String(palette) }),
  });

  const disposeShortcut = ctx.shortcut.register({
    keys: "ctrl+shift+p",
    handler: () => {
      void ctx.command.execute("myplugin.setPalette", "jade");
    },
  });

  return () => {
    disposeCommand();
    disposeShortcut();
  };
}
```

命令 id 重复注册会抛错，执行不存在的命令也会抛错，需要静默时用 `executeSafe`。
快捷键默认跳过输入框，表格里填内容不会误触发；确实要在输入框里响应时传
`allowInEditable: true`。

### 生命周期

`setup` 返回的函数在插件卸载时执行。需要清理的东西：事件监听、定时器、
自己挂到播放器外面的 DOM。

`setup` 默认有 5 秒超时（`pluginTimeout` 可调），防止某个插件永远不 resolve
卡住整个启动。

依赖与版本：

```ts
export default {
  name: "my-plugin",
  version: "1.0.0",
  dependencies: { "official-toolbar-actions": "^3.0.0" },
  setup(ctx) {
    /* ... */
  },
};
```

框架会按依赖排序安装，遇到循环依赖或版本不满足直接报错。
插件想声明兼容的契约版本，参考 `isApiVersionCompatible`。

完整的四通道示例见
`nmpv3-plus/extensions/official/toolbar-actions/index.ts`，
可以直接复制改。

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
