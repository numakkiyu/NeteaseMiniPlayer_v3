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

| 属性                  | 说明                        |
| --------------------- | --------------------------- |
| `song-id`             | 网易云单曲 ID               |
| `playlist-id`         | 网易云歌单 ID               |
| `api-base-url`        | 网易云 API 代理地址         |
| `theme`               | `auto`、`light`、`dark`     |
| `layout`              | `compact`、`mini`、`dock`   |
| `position`            | `static` 或四角悬浮位置     |
| `embed-mode`          | `article` 或 `page`         |
| `scale`               | 缩放档位 `1`–`10` 或 `auto` |
| `palette`             | 配色色板 id，见下文         |
| `palette-follow-host` | 色相是否跟随宿主页面        |
| `lyric`               | 是否显示歌词                |
| `playlist`            | 是否显示播放列表入口        |
| `remember`            | 是否记忆播放器状态          |

## NMPv3 缩放档位

播放器按档位**整体等比缩放**：宽度、高度、字号、封面、图标、圆角一起变化，不会被横向拉扁。

| 取值   | 缩放比例 | 宽度（compact 布局）  |
| ------ | -------- | --------------------- |
| `1`    | 0.6×     | 252px                 |
| `5`    | 1.0×     | 420px（默认）         |
| `10`   | 1.5×     | 630px                 |
| `auto` | 同 5 档  | 420px，窄容器等比收窄 |

```html
<nmp-player playlist-id="14273792576" scale="7"></nmp-player>
<nmp-player song-id="1901371647" scale="auto"></nmp-player>
```

窄屏时不会只压宽度——最终缩放 = 档位比例 × min(1, 可用宽度 ÷ 设计宽度)，
设计宽度 compact/dock 为 420px、article 为 360px、mini 为 320px。
所以手机上整体等比缩小，选 10 档也不会溢出屏幕。

## NMPv3 配色色板

内置 6 套色板，每套包含明亮系与暗色系两份种子，页面明暗切换时自动使用对应版本。

| 中文名 | 取值    | 主色             |
| ------ | ------- | ---------------- |
| 晨曦   | `dawn`  | 橙红，默认       |
| 青竹   | `jade`  | 绿               |
| 苍穹   | `azure` | 蓝               |
| 流金   | `amber` | 黄               |
| 紫藤   | `iris`  | 紫               |
| 素境   | `mono`  | 近无彩，拟态质感 |

```html
<nmp-player song-id="1901371647" palette="jade"></nmp-player>
<nmp-player song-id="1901371647" palette="iris" theme="dark"></nmp-player>
```

明暗按固定顺序判定：显式 `theme` 最高优先，其次是 `theme="auto"` 采样的宿主背景亮度，
最后才回退系统偏好。`palette-follow-host` 只控制**色相**是否借用宿主，不改变这个顺序。

旧色板 id（`mint`、`forest`、`ocean`、`sky`、`butter`、`plum`、`lilac`、`pearl`、`graphite`、`ember`）
会自动映射到新的融合色板，原有配置继续可用。

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

配色相关变量由色板自动派生（主色、相似色、分裂互补色、对比度修正后的文字色等），
换色板时整组同步更新，不需要逐个覆盖。可手动覆盖的常用项：

| 变量              | 作用                     |
| ----------------- | ------------------------ |
| `--nmpv3-accent`  | 强调色                   |
| `--nmpv3-surface` | 播放器底色               |
| `--nmpv3-text`    | 正文颜色                 |
| `--nmpv3-radius`  | 圆角                     |
| `--nmpv3-z-index` | 层级，默认 999999        |
| `--nmpv3-slow-mo` | 动效倍率，调试用，默认 1 |

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
