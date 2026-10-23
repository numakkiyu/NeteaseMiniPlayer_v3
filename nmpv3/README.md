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
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.1/dist/nmpv3.min.js"></script>
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
| `scale`        | 等比例缩放档位，`1`-`10`（默认 `5`）或 `auto`                    |

## 缩放档位

播放器整体按档位等比例缩放（宽度、高度、字号、封面、图标、圆角同步变化），不会拉伸变形。

| 档位   | 缩放比例 | 宽度（compact 布局） |
| ------ | -------- | -------------------- |
| `1`    | 0.6×     | 252px                |
| `5`    | 1.0×     | 420px（默认）        |
| `10`   | 1.5×     | 630px                |
| `auto` | 自动     | 按视口宽高计算       |

按播放器设置：

```html
<nmp-player playlist-id="14273792576" scale="7"></nmp-player>
<nmp-player song-id="1901371647" scale="auto"></nmp-player>
```

按全局配置设置：

```html
<script>
  window.NMPv3Config = {
    scale: 6,
  };
</script>
```

运行时调整：

```js
player.updateConfig({ scale: 8 });
NMPv3.setGlobalConfig({ scale: "auto" });
```

短代码：

```
{nmpv3:song=1901371647, scale=7}
```

`auto` 等价于 5 档（1.0×），不做视口比例放大。

真正处理窄屏的是**容器适配**：最终缩放 = 档位比例 × min(1, 可用宽度 ÷ 设计宽度)。
设计宽度按布局取：compact/dock 为 420px、article 为 360px、mini 为 320px。

所以手机上不会把播放器拉扁——宽度和内部尺寸（封面、字号、间距）用同一个因子缩小，
整体等比收进容器。手动选 10 档也不会溢出屏幕，只是同样被压到容器宽度。

窗口尺寸变化时会重新计算。

## 配色色板

内置 6 套色板，每套内含**明亮系与暗色系两份种子**——页面明亮时自动用浅色版本、暗色时用深色版本，不需要再单独选「深色版」或「浅色版」。

| 中文名 | 后台简称 | 主色   | 气质                   |
| ------ | -------- | ------ | ---------------------- |
| 晨曦   | `dawn`   | 橙红   | 温暖有活力，**默认**   |
| 青竹   | `jade`   | 绿     | 明亮清透或沉稳内敛     |
| 苍穹   | `azure`  | 蓝     | 轻快干净或冷静深邃     |
| 流金   | `amber`  | 黄     | 柔和温润或暖金厚重     |
| 紫藤   | `iris`   | 紫     | 轻柔梦幻或浓郁高贵     |
| 素境   | `mono`   | 近无彩 | 拟态，靠明暗双影做质感 |

按播放器设置：

```html
<nmp-player song-id="1901371647" palette="jade"></nmp-player>
<nmp-player song-id="1901371647" palette="iris" theme="dark"></nmp-player>
```

按全局配置设置：

```html
<script>
  window.NMPv3Config = {
    palette: "azure",
  };
</script>
```

运行时调整：

```js
player.updateConfig({ palette: "amber" });
const info = player.getPaletteInfo();
// { palette, hueSource, schemeSource, contrast }
```

短代码：

```
{nmpv3:song=1901371647, palette=jade}
```

### 宿主取色

`paletteFollowHost`（默认 `true`）控制色相是否借用宿主页面：

- **开启**：采样播放器最近的背景祖先，若有明显色相（彩度 ≥ 0.03），按 85% 宿主 + 15% 色板的比例拉拢色相。
- **关闭**：色相完全用色板。

无论开关如何，**明暗永远按下面的顺序判定**：

1. 显式 `theme="light"` / `theme="dark"` 最高优先
2. `theme="auto"` 时采样宿主背景亮度决定明暗
3. 采不到背景（如全透明）才回退系统偏好

这个开关只影响色相，不影响明暗——关掉色相跟随不会让亮页面里的播放器变成深色。

```html
<nmp-player
  song-id="1901371647"
  palette="jade"
  palette-follow-host="false"
></nmp-player>
```

### 配色实现

- 计算用 OKLCH（感知均匀：调明度不跑色相），输出 hex/rgba，不依赖浏览器 `oklch()` 支持
- 主色、相似色（±28°/32°）、分裂互补色（+150°/+210°）全部由种子派生
- 对比度自动兜底：正文 ≥ 7:1、次要 ≥ 4.5:1、强调 ≥ 3:1，不足时只压明度不动色相
- 呼吸动画的 4 个色分别取主色、相似色、两个分裂互补色，全国 alpha 0.12–0.26

旧版成对色板 id（`mint`/`forest`/`ocean`/`sky`/`butter`/`plum`/`lilac`/`pearl`/`graphite`/`ember`）会自动映射到新的融合色板，已写的配置不会失效。

## 宿主隔离

播放器以「不干扰宿主」为前提设计：

- 所有 CSS 选择器都带 `nmpv3-` / `nmp-player` 前缀，不写全局标签选择器
- 样式只注入一个 `<style id="nmpv3-style">`，多次调用不会重复插入
- 只清空自己的挂载点，不触碰其它 DOM
- `localStorage` 键统一带 `nmpv3:` 前缀
- 全局事件（键盘、滚动、可见性）全部在 `destroy()` 时解绑
- 键盘热键仅在鼠标悬停或焦点在播放器内时响应，输入框内完全让行

浮动模式的层级默认是 `999999`，如与宿主弹窗冲突，可在宿主 CSS 中覆盖：

```css
.nmpv3-player {
  --nmpv3-z-index: 2000;
}
```

## 浏览器兼容

- 布局与缩放只用 CSS 自定义属性 + `calc()` + `width/max-width` + 媒体查询，均为各内核长期支持的基线特性
- `color-mix()`、`inset`、`mask-image` 等较新特性都写了回退或前缀，不支持时降级为近似样式而非破版
- 未使用 `zoom` 与 `transform: scale` 做缩放，避免 Firefox 旧版不支持与 fixed 定位留白

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
