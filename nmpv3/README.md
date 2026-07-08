# netease-mini-player-v3

NMPv3 是 NeteaseMiniPlayer v3 的轻量播放器包。它面向公开网页、博客、CMS、静态站点、普通 WordPress 前台和前端项目中的基础网易云音乐嵌入。

这个包的目标很明确：默认只用一个 JavaScript 文件完成播放器加载，不要求额外 CSS 文件，也不引入 React、Vue、Lit、jQuery 等运行时依赖。

## 适合场景

- 在静态页面中直接插入网易云单曲或歌单
- 在 GitHub Pages、Hugo、Hexo、Jekyll、VitePress 等静态站点中使用
- 在 PHP 模板或 WordPress 前台输出播放器
- 在 React、Vue 3、Nuxt、Next.js、Astro、Svelte 项目中使用原生 `<nmp-player>`
- 需要保留 v2 短代码或旧 DOM 写法的迁移场景

如果项目需要插件、皮肤包、自定义音乐来源、自定义歌词来源或宿主页面联动，请使用 `netease-mini-player-v3-plus`。

## 安装

```bash
npm install netease-mini-player-v3
pnpm add netease-mini-player-v3
```

## CDN 引用

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

生产页面建议固定版本号：

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.1/dist/nmpv3.min.js"></script>
```

也可以使用 unpkg：

```html
<script src="https://unpkg.com/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>
```

## 前端项目引用

在需要自动注册 `<nmp-player>` 的项目中引入：

```ts
import "netease-mini-player-v3/auto";
```

然后在页面或组件中使用：

```html
<nmp-player song-id="1901371647" theme="auto" layout="mini"></nmp-player>
```

也可以通过 API 创建播放器：

```ts
import { createNMPv3Player, defineNMPv3 } from "netease-mini-player-v3";

defineNMPv3();

createNMPv3Player("#player", {
  playlistId: "14273792576",
  theme: "auto",
  layout: "compact",
});
```

## 构建产物

```txt
dist/
├─ nmpv3.min.js
├─ nmpv3.es.js
└─ nmpv3.d.ts
```

- `nmpv3.min.js` 用于浏览器 CDN 或普通脚本引用
- `nmpv3.es.js` 用于现代前端项目打包
- `nmpv3.d.ts` 用于 TypeScript 类型提示

## 常用配置

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
  lyric="true"
  playlist="true"
  api-base-url="/api/netease"
></nmp-player>
```

常用属性：

| 属性           | 说明                                                             |
| -------------- | ---------------------------------------------------------------- |
| `song-id`      | 网易云单曲 ID                                                    |
| `playlist-id`  | 网易云歌单 ID                                                    |
| `theme`        | `auto`、`light` 或 `dark`                                        |
| `layout`       | `mini`、`compact` 或 `dock`                                      |
| `embed-mode`   | `article` 或 `page`                                              |
| `position`     | `static`、`top-left`、`top-right`、`bottom-left`、`bottom-right` |
| `api-base-url` | 自定义 NeteaseCloudMusicApi 兼容代理                             |

## API 代理

NMPv3 默认使用项目内置的 NeteaseCloudMusicApi 兼容代理。部署到生产环境时，建议使用自己的代理地址。

按播放器设置：

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

按全局配置设置：

```html
<script>
  window.NMPv3Config = {
    apiBaseUrl: "/api/netease",
  };
</script>
<script src="/assets/nmpv3.min.js"></script>
```

运行时切换：

```js
window.NMPv3.setApiBaseUrl("/api/netease");
```

代理至少需要支持这些接口：

- `/song/detail`
- `/playlist/track/all`
- `/song/url/v1`
- `/lyric`

## WordPress 基础接入

`examples/wordpress-basic/netease-mini-player-v3.php` 提供基础 WordPress 示例。它只在前台加载一个 `nmpv3.min.js`，并提供短代码：

```txt
[nmpv3 playlist="14273792576"]
[nmpv3 song="1901371647" theme="dark" layout="mini"]
```

主题代码也可以调用 `nmpv3_render_player(array(...))` 输出播放器。

## 本地开发

```bash
pnpm install
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3 typecheck
pnpm --filter netease-mini-player-v3 test
```

## 能力边界

NMPv3 支持：

- 网易云单曲和歌单
- 歌词、翻译歌词和播放列表
- `mini`、`compact`、`dock` 三种基础布局
- `auto`、`light`、`dark` 主题
- 基础 CSS 变量
- v2 短代码和旧 DOM 迁移
- 页面内多播放器互斥播放
- 状态记忆、悬浮拖拽、最小化和边缘停靠
- 原生 Media Session

NMPv3 不包含：

- 插件系统
- 完整皮肤包
- 自定义音乐来源
- 自定义歌词来源
- 本地 mp3 或第三方音乐平台
- 宿主页面自动联动
- WordPress 高级后台或 Gutenberg 区块

这些能力属于 NMPv3+。

## 相关文档

- [NMPv3 文档](../docs/nmpv3/index.md)
- [浏览器直接引用](../docs/nmpv3/browser.md)
- [基础使用](../docs/nmpv3/usage.md)
- [API 与配置](../docs/nmpv3/api.md)
- [NMPv3 集成教程](../docs/nmpv3/integrations/index.md)
- [源码修改](../docs/nmpv3/source-editing.md)

## 许可证

Apache 2.0 许可证
