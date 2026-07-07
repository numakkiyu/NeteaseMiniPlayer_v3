# @netease-mini-player/v3-plus

NMPv3+ 是 NeteaseMiniPlayer v3 Plus 的高级扩展框架。它在 NMPv3 基础播放器之上提供插件、皮肤、自定义来源、自定义歌词、宿主页面联动、框架适配器和自定义构建能力。

NMPv3+ 不替代 NMPv3 的轻量入口。普通网页嵌入优先使用 `@netease-mini-player/v3`，只有在需要高级扩展时再加载 NMPv3+。

## 适合场景

- 需要本地 JSON 歌单、业务 API 或自定义音乐来源
- 需要加载本地 LRC、翻译歌词或静态歌词
- 需要插件系统、皮肤系统或用户扩展包
- 需要页面背景、DOM 属性、CSS 变量或 URL 跟随播放状态变化
- 需要 React、Vue 3、Next.js、Nuxt、Astro、Svelte 等框架适配器
- 需要 WordPress 高级集成、PHP 辅助函数或自定义部署包
- 需要按项目选择插件、皮肤和运行时代码的自定义构建流程

## 安装

```bash
npm install @netease-mini-player/v3 @netease-mini-player/v3-plus
pnpm add @netease-mini-player/v3 @netease-mini-player/v3-plus
```

NMPv3+ 需要先有一个基础 NMPv3 播放器实例。未启用高级扩展时，默认界面保持 NMPv3 的基础 compact UI。

## 浏览器引用

```html
<script src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@netease-mini-player/v3-plus@latest/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

也可以使用 unpkg：

```html
<script src="https://unpkg.com/@netease-mini-player/v3@latest/dist/nmpv3.min.js"></script>
<script
  type="module"
  src="https://unpkg.com/@netease-mini-player/v3-plus@latest/dist/browser.js"
></script>
```

## 推荐应用入口

在前端项目中，推荐使用类似 Vue `createApp()` 的组合式入口。这样可以把来源、歌词、皮肤和插件集中注册，再挂载到现有播放器。

```ts
import {
  createHostSyncPlugin,
  createLocalJsonSourceAdapter,
  createNMPv3PlusApp,
  createStaticLyricsAdapter,
  officialNMPv3PlusSkins,
} from "@netease-mini-player/v3-plus";

await createNMPv3PlusApp()
  .source(createLocalJsonSourceAdapter())
  .lyrics(
    createStaticLyricsAdapter({
      "local-001": "[00:01.00]本地歌词",
    }),
  )
  .skin(...officialNMPv3PlusSkins)
  .skin("default")
  .use(createHostSyncPlugin())
  .mount({
    root: document.querySelector("nmp-player"),
    player: window.NMPv3?.getPlayers()[0],
  });
```

低层运行时 API 也可以直接使用：

```ts
import {
  createCoverColorPlugin,
  createNMPv3PlusRuntime,
} from "@netease-mini-player/v3-plus";

const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
});

await runtime.installPlugin(createCoverColorPlugin());
```

## 插件能力

官方扩展包括：

| 扩展               | 用途                              |
| ------------------ | --------------------------------- |
| `advanced-layouts` | 启用 `card` 和 `cover` 等高级布局 |
| `visualizer`       | 添加播放频谱、波形或氛围视觉层    |
| `cover-color`      | 从封面提取主色并写入 CSS 变量     |
| `host-sync`        | 将播放状态同步到宿主页面          |
| `cross-tab-sync`   | 在多个标签页之间同步选定事件      |
| `media-session`    | 配置系统媒体控制信息              |
| `custom-source`    | 注册自定义音乐来源                |
| `local-lyrics`     | 注册本地或静态歌词                |
| `pwa-cache`        | 为运行时和资源提供可选缓存        |

高级布局和视觉扩展需要显式启用，不会自动改变 NMPv3 的默认界面。

```html
<nmp-player
  playlist-id="14273792576"
  plus-extensions="advanced-layouts,visualizer"
  plus-layout="cover"
></nmp-player>
```

## 皮肤能力

官方皮肤包括：

- `default`：保留基础 NMPv3 外观
- `glass`：透明表面和模糊效果
- `minimal`：克制的工具型界面
- `anime`：更轻的强调色皮肤
- `cyber`：深色高对比方向
- `vinyl`：偏唱片机的视觉方向

注册并应用皮肤：

```ts
import {
  createNMPv3PlusRuntime,
  officialNMPv3PlusSkins,
} from "@netease-mini-player/v3-plus";

const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  skins: officialNMPv3PlusSkins,
});

runtime.applySkin("glass");
```

用户皮肤可以通过 `skin-url` 加载：

```html
<nmp-player
  playlist-id="14273792576"
  skin="studio-deep"
  skin-url="/skins/user/studio-deep/skin.json"
></nmp-player>
```

## 自定义来源与歌词

NMPv3+ 支持本地 JSON、静态歌单、手动来源和自定义 API 来源。

```ts
import { createLocalJsonSourceAdapter } from "@netease-mini-player/v3-plus/core";

runtime.registerSource(createLocalJsonSourceAdapter());

await runtime.loadPlaylist({
  source: "local-json",
  url: "/music/playlist.json",
});
```

静态歌词示例：

```ts
import { createStaticLyricsAdapter } from "@netease-mini-player/v3-plus/core";

runtime.registerLyrics(
  createStaticLyricsAdapter({
    "local-001": {
      lyric: "[00:01.00]原文歌词",
      translation: "[00:01.00]翻译歌词",
    },
  }),
);
```

## 框架适配器

NMPv3+ 提供面向常见框架的适配器入口：

- `@netease-mini-player/v3-plus/react`
- `@netease-mini-player/v3-plus/vue`
- `@netease-mini-player/v3-plus/next`
- `@netease-mini-player/v3-plus/nuxt`
- `@netease-mini-player/v3-plus/astro`
- `@netease-mini-player/v3-plus/svelte`

这些适配器不会把框架运行时打进 NMPv3+。它们主要负责把框架友好的属性转换成 `<nmp-player>` 可以识别的原生属性和事件。

React 示例：

```ts
import { createNMPv3PlusReactProps } from "@netease-mini-player/v3-plus/react";

const props = createNMPv3PlusReactProps({
  playlistId: "14273792576",
  skin: "default",
  plusExtensions: ["host-sync"],
  hostSync: true,
});
```

## 自定义构建

NMPv3+ 可以按项目选择插件、皮肤和运行时代码，生成可部署的自定义包。

```bash
pnpm --filter @netease-mini-player/v3-plus build
nmpv3-plus add examples/custom-build/nmpv3-plus.config.json visualizer host-sync glass
nmpv3-plus plan examples/custom-build/nmpv3-plus.config.json
nmpv3-plus build examples/custom-build/nmpv3-plus.config.json
```

构建结果会保留运行时模块、扩展清单、皮肤元数据和部署清单，适合放到普通静态目录或后端模板目录中。

## WordPress 与 PHP 高级集成

NMPv3+ 负责高级 WordPress 和 PHP 集成，包括：

- 设置页
- Gutenberg 区块元数据
- enqueue 计划
- 短代码渲染
- PHP 辅助函数
- 插件包构建

```ts
import {
  buildNMPv3PlusWordPressPluginPackage,
  createNMPv3PlusBlockMetadata,
  createNMPv3PlusWordPressEnqueuePlan,
} from "@netease-mini-player/v3-plus/wordpress";

const block = createNMPv3PlusBlockMetadata({
  defaultSkin: "default",
  hostSyncEnabled: true,
});
```

## 本地开发

```bash
pnpm install
pnpm --filter @netease-mini-player/v3-plus build
pnpm --filter @netease-mini-player/v3-plus typecheck
pnpm --filter @netease-mini-player/v3-plus test
```

渲染冒烟检查：

```bash
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus build
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```

## 能力边界

NMPv3+ 负责：

- 插件系统
- 皮肤系统
- 自定义音乐来源
- 自定义歌词来源
- 宿主页面联动
- 框架适配器
- 自定义构建
- WordPress 与 PHP 高级集成

NMPv3+ 不应该：

- 取代 NMPv3 作为普通网页的默认轻量入口
- 让 NMPv3 用户为了基础播放理解插件或皮肤系统
- 把高级扩展能力反向塞进 `nmpv3/`
- 默认启用大封面、频谱或强视觉皮肤

## 相关文档

- [NMPv3+ 文档](../docs/nmpv3-plus/index.md)
- [快速开始](../docs/nmpv3-plus/getting-started.md)
- [深度自定义流程](../docs/nmpv3-plus/deep-customization.md)
- [框架适配](../docs/nmpv3-plus/frameworks.md)
- [插件与皮肤](../docs/nmpv3-plus/plugins-skins.md)
- [音乐源与歌词](../docs/nmpv3-plus/sources-lyrics.md)
- [自定义构建](../docs/nmpv3-plus/custom-build.md)
- [WordPress 与 PHP 高级集成](../docs/nmpv3-plus/wordpress-php.md)

## 许可证

Apache 2.0 许可证
