# 插件与皮肤

插件处理行为，皮肤处理视觉。两者都属于 NMPv3+，不会进入 NMPv3 轻量版。

## 官方插件

| 插件               | 作用                                              |
| ------------------ | ------------------------------------------------- |
| `advanced-layouts` | 提供 opt-in 的 `card` 和 `cover` 高级布局         |
| `visualizer`       | 提供 bars、wave、ambient 等视觉层                 |
| `cover-color`      | 从封面提取主色并写入 CSS token                    |
| `host-sync`        | 把播放器事件映射到宿主页面属性、class 和 CSS 变量 |
| `cross-tab-sync`   | 使用 BroadcastChannel 同步部分播放状态            |
| `media-session`    | 配置 Media Session 元数据和控制                   |
| `custom-source`    | 注册自定义来源                                    |
| `local-lyrics`     | 注册本地或静态歌词                                |
| `pwa-cache`        | 可选 Cache API 缓存能力                           |

安装插件：

```ts
await runtime.installPlugin(createHostSyncPlugin());
```

批量组合：

```ts
await createNMPv3PlusApp()
  .use(createHostSyncPlugin())
  .use(createCoverColorPlugin())
  .mount({
    root: document.querySelector("nmp-player"),
    player: window.NMPv3?.getPlayers()[0],
  });
```

## 用户插件包

用户插件包通常包含：

```txt
manifest.json
index.js
style.css
```

`manifest.json`：

```json
{
  "name": "nmpv3-plus-extension-user-wave",
  "displayName": "User Wave",
  "version": "1.0.0",
  "author": "User",
  "entry": "./index.js",
  "style": "./style.css",
  "type": "visual",
  "dependencies": {
    "nmpv3-plus-extension-host-sync": ">=1.0.0"
  },
  "description": "Adds a visual layer."
}
```

`index.js`：

```js
export default {
  name: "nmpv3-plus-extension-user-wave",
  setup(ctx) {
    const stop = ctx.on("songchange", () => {
      ctx.setToken("--nmpv3-user-wave-active", "1");
    });

    return () => stop();
  },
};
```

HTML 中引用：

```html
<nmp-player
  playlist-id="14273792576"
  extension-url="/extensions/user/wave/manifest.json"
></nmp-player>
```

TypeScript 中加载：

```ts
const extension = await loadNMPv3PlusPluginPackage({
  manifestUrl: "/extensions/user/wave/manifest.json",
});

await runtime.installPlugin(extension.plugin);
```

## 插件依赖

插件 manifest 和插件对象可以声明依赖：

```json
{
  "dependencies": {
    "nmpv3-plus-extension-host-sync": ">=1.0.0"
  }
}
```

支持范围：

```txt
*
1.0.0
>=1.0.0
^1.0.0
~1.0.0
```

批量安装会按依赖排序。缺少依赖、版本不兼容或循环依赖会失败，并回滚已经安装的插件。

## 官方皮肤

官方皮肤：

- `default`
- `glass`
- `minimal`
- `anime`
- `cyber`
- `vinyl`

注册并应用：

```ts
import {
  createNMPv3PlusRuntime,
  officialNMPv3PlusSkins,
} from "netease-mini-player-v3-plus";

const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  skins: officialNMPv3PlusSkins,
});

runtime.applySkin("glass");
```

## 用户皮肤包

HTML 中引用用户皮肤：

```html
<nmp-player
  playlist-id="14273792576"
  skin="studio-deep"
  skin-url="/skins/user/studio-deep/skin.json"
></nmp-player>
```

`skin.json`：

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

如果同目录存在 `skin.css`，Plus 会加载并把选择器隔离到生成的皮肤 class 下，例如：

```css
.nmpv3-plus-skin-studio-deep .nmpv3-player {
  backdrop-filter: blur(18px);
}
```

皮肤 CSS 应使用部署后的普通 CSS。若使用 Sass、Less 或 PostCSS，先编译再打包。

## 插件和皮肤的职责边界

| 类型       | 应该做                                   | 不应该做                              |
| ---------- | ---------------------------------------- | ------------------------------------- |
| 插件       | 监听事件、写 token、注册行为、清理副作用 | 修改 NMPv3 源码或假设宿主页面结构固定 |
| 皮肤       | 改颜色、字体、间距、背景、布局 token     | 加载音乐数据或写业务逻辑              |
| HostBridge | 把状态映射到宿主页面                     | 直接查询和修改任意 DOM                |
