# HTML 直接引用

NMPv3 作为单文件浏览器脚本运行时，无需构建工具，可直接在静态 HTML 中通过 `<script>` 标签加载。

## 前置环境依赖检查

- 现代浏览器（支持 ES modules 与 Custom Elements）
- 可用的 NMPv3 构建产物：
  - 本地开发：`nmpv3/dist/nmpv3.min.js`
  - CDN：`https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js`
- 一个可访问的网易云 API 代理，默认地址为 `https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php`

## NMPv3 包安装与配置流程

浏览器场景无需安装 npm 包。将构建产物复制到项目静态目录，或通过 CDN 引用即可。页面加载脚本后，会自动注册 `<nmp-player>` 并扫描短代码与旧版 DOM。

### 本地构建产物引用

```html
<script src="../../dist/nmpv3.min.js"></script>
```

### CDN 引用

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
```

### 全局 API 地址配置

在脚本之前注入 `window.NMPv3Config`：

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>
```

配置优先级从高到低依次为：元素属性、`window.NMPv3Config.apiBaseUrl`、`window.NMPv3ApiBaseUrl`、内置默认地址。

## 核心功能接入代码示例

### 歌单播放器

```html
<nmp-player
  playlist-id="14273792576"
  api-base-url="/api/netease"
  theme="auto"
  layout="compact"
></nmp-player>
```

### 单曲内嵌文章

```html
<nmp-player
  song-id="1901371647"
  api-base-url="/api/netease"
  theme="dark"
  embed="true"
  embed-mode="article"
  lyric="false"
></nmp-player>
```

### 浮动页面播放器

```html
<nmp-player
  playlist-id="14273792576"
  api-base-url="/api/netease"
  theme="auto"
  embed-mode="page"
  layout="dock"
  position="bottom-right"
  default-minimized="true"
  storage-key="browser-example-page"
></nmp-player>
```

### 短代码

页面中直接书写文本短代码，脚本加载后会自动替换为 `<nmp-player>`：

```html
<p>
  {nmpv3:song=1901371647, api-base-url=/api/netease, embed=article, lyric=false}
</p>
```

### 旧版 DOM 迁移

NMPv2 的 `.netease-mini-player` 容器会被自动升级：

```html
<div
  class="netease-mini-player"
  data-song-id="1901371647"
  data-api-base-url="/api/netease"
  data-theme="auto"
  data-embed="true"
  data-lyric="true"
></div>
```

## 常见问题排障指南

### 播放器未渲染

- 确认脚本已加载且没有网络错误
- 检查控制台是否有 `nmp-player` 未定义的错误
- 确认 `<nmp-player>` 写在 `<script>` 之前，或脚本在 `DOMContentLoaded` 之后执行（浏览器包已自动处理）

### 接口返回 403 或跨域错误

- 使用同域 API 代理，或配置 `api-base-url` 为允许跨域的地址
- 默认公共代理仅用于体验，生产环境建议自建代理

### 短代码未替换

- 短代码格式应为 `{nmpv3:...}` 或 `{nmpv2:...}`
- 脚本会在 DOM 加载完成后扫描文本节点，动态插入的文本需手动调用 `window.NMPv3.processShortcodes()`

## 进阶扩展开发方案

### 通过全局对象控制播放器

```html
<script>
  document.addEventListener("nmpv3:ready", () => {
    const players = window.NMPv3.getPlayers();
    if (players.length > 0) {
      players[0].setVolume(0.5);
    }
  });
</script>
```

### 事件监听

```html
<script>
  document.addEventListener("nmpv3:play", (event) => {
    console.log("正在播放", event.target);
  });
</script>
```

支持的事件包括：`nmpv3:ready`、`nmpv3:play`、`nmpv3:pause`、`nmpv3:songchange`、`nmpv3:playlistchange`、`nmpv3:error`。

### 多播放器共存

`window.NMPv3.pauseAll()` 可暂停所有实例，避免多个播放器同时发声。

### 静态站点生成器

Hugo、Hexo、Jekyll 等生成器只需在模板中输出 `<nmp-player>` 标签和 `<script>` 引用即可，无需构建时集成。
