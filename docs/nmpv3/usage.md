# 基础使用

本页说明 NMPv3 的常用属性、布局和使用场景。

## 歌曲与歌单

播放单曲：

```html
<nmp-player song-id="1901371647"></nmp-player>
```

播放歌单：

```html
<nmp-player playlist-id="14273792576"></nmp-player>
```

同一个播放器通常只需传入 `song-id` 或 `playlist-id`。同时传入时行为由配置归一化逻辑决定。业务代码应保持单一入口。

## 主题

```html
<nmp-player theme="auto"></nmp-player>
<nmp-player theme="light"></nmp-player>
<nmp-player theme="dark"></nmp-player>
```

`auto` 会根据浏览器或系统主题选择浅色或深色表现。

## 布局

```html
<nmp-player layout="compact"></nmp-player>
<nmp-player layout="mini"></nmp-player>
<nmp-player layout="dock"></nmp-player>
```

| 布局      | 适合场景                                                   |
| --------- | ---------------------------------------------------------- |
| `compact` | 默认播放器，保留封面、歌词、进度、音量、播放模式和列表控制 |
| `mini`    | 文章或窄容器中使用，控件更少                               |
| `dock`    | 页面级悬浮播放器，常配合 `position` 和最小化使用           |

高级 `card` 和 `cover` 布局属于 NMPv3+ 的 opt-in 扩展，不属于 NMPv3。

## 嵌入模式

文章内嵌：

```html
<nmp-player
  song-id="1901371647"
  embed-mode="article"
  lyric="false"
></nmp-player>
```

页面播放器：

```html
<nmp-player
  playlist-id="14273792576"
  embed-mode="page"
  layout="dock"
  position="bottom-right"
></nmp-player>
```

文章内嵌模式会禁用拖拽、浮动位置和播放列表面板，避免影响正文排版。

## 位置

`position` 支持：

```txt
static
top-left
top-right
bottom-left
bottom-right
```

静态位置适合文章和普通页面区块。四角位置适合站点全局播放器。

## 常用属性

| 属性                   | 值                        | 说明                            |
| ---------------------- | ------------------------- | ------------------------------- |
| `song-id`              | 字符串                    | 网易云单曲 ID                   |
| `playlist-id`          | 字符串                    | 网易云歌单 ID                   |
| `theme`                | `auto`、`light`、`dark`   | 播放器主题                      |
| `layout`               | `compact`、`mini`、`dock` | 播放器布局                      |
| `embed`                | `true`、`false`           | 旧语义兼容，`true` 等同文章内嵌 |
| `embed-mode`           | `article`、`page`         | 明确指定内嵌模式                |
| `position`             | `static` 或四角位置       | 播放器位置                      |
| `volume`               | `0` 到 `1`                | 初始音量                        |
| `autoplay`             | `true`、`false`           | 是否尝试自动播放                |
| `lyric`                | `true`、`false`           | 是否显示歌词                    |
| `playlist`             | `true`、`false`           | 是否显示播放列表入口            |
| `default-minimized`    | `true`、`false`           | 是否默认最小化                  |
| `auto-pause-on-hidden` | `true`、`false`           | 页面隐藏时是否自动暂停          |
| `remember`             | `true`、`false`           | 是否记忆状态                    |
| `storage-key`          | 字符串                    | 状态记忆命名空间                |
| `draggable`            | `true`、`false`           | 悬浮播放器是否可拖拽            |
| `hotkeys`              | `true`、`false`           | 是否启用受控快捷键              |
| `idle-opacity`         | `0.1` 到 `1`              | 最小化停靠后的透明度            |
| `api-base-url`         | URL                       | 网易云 API 代理地址             |

## 基础 CSS 变量

NMPv3 不提供完整皮肤系统，但允许站点做基础外观调整：

```css
nmp-player {
  --nmpv3-accent: #ff6b35;
  --nmpv3-radius: 16px;
  --nmpv3-bg: rgba(255, 255, 255, 0.92);
  --nmpv3-text: #222;
  --nmpv3-idle-opacity: 0.72;
}
```

需要按包加载皮肤、隔离皮肤 CSS 或动态切换皮肤时，使用 NMPv3+。

## DOM 事件

NMPv3 会抛出基础 DOM 事件：

```txt
nmpv3:ready
nmpv3:play
nmpv3:pause
nmpv3:songchange
nmpv3:playlistchange
nmpv3:error
```

监听示例：

```js
document.addEventListener("nmpv3:songchange", (event) => {
  console.log(event.detail);
});
```

这些事件只用于基础集成。自动修改宿主页面属性、CSS 变量或 URL 的能力属于 NMPv3+ HostBridge。
