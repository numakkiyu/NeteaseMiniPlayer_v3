# NeteaseMiniPlayer

NeteaseMiniPlayer 是一个 GitHub 项目，从 v3 开始拆成两个产品分支：

- **NeteaseMiniPlayer v3 [NMPv3]**：由 v2.5 UI 和交互体系工程化升级而来的轻量 CDN 引用版本，适合普通站长、博客、CMS、WordPress 普通用户和静态网页。
- **NeteaseMiniPlayer v3 Plus [NMPv3+]**：完整扩展版本，适合开发者、主题作者、工作室和深度定制场景。

## Which Version Should I Use?

Use **NMPv3** if you need:

- 一个 JS 即可使用
- CDN 即插即用
- 无额外 CSS
- 无 React / Vue / Lit / jQuery 等运行时依赖
- 仅支持网易云音乐
- 继承 v2.5 的 UI、交互逻辑和 NMP v2 核心能力
- 区分文章嵌入和页面/全站嵌入
- 可被现代前端项目 import

Use **NMPv3+** if you need:

- 插件系统
- 完整换肤系统
- 自定义音乐源
- 自定义歌词
- 宿主页面联动
- WordPress 高级集成
- React / Vue / Next / Nuxt / Astro / Svelte 适配
- 自行编译或部署自定义 bundle

两个版本在同一个仓库维护，但源码目录分开，避免轻量版被高级扩展功能拖重。

## Quick Start

### NMPv3 CDN

```html
<script src="./dist/nmpv3.min.js"></script>
<nmp-player playlist-id="14273792576"></nmp-player>
```

NMPv3 defaults to the v2.5-compatible NetEase proxy at
`https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php`. You can replace it per
player:

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

Or set it globally before the compiled browser bundle runs:

```html
<script>
  window.NMPv3Config = { apiBaseUrl: "/api/netease" };
</script>
<script src="./dist/nmpv3.min.js"></script>
```

### NMPv3 in Frontend Projects

Install with npm:

```bash
npm install @netease-mini-player/v3
```

Or install with pnpm:

```bash
pnpm add @netease-mini-player/v3
```

Then import it:

```ts
import "@netease-mini-player/v3/auto";
```

```html
<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

If the default endpoint is unavailable, replace it with any
NeteaseCloudMusicApi-compatible proxy by using `api-base-url`, `apiBaseUrl` in
`create()`, or `NMPv3.setApiBaseUrl("/api/netease")`.

### NMPv3+

Install with npm:

```bash
npm install @netease-mini-player/v3-plus
```

Or install with pnpm:

```bash
pnpm add @netease-mini-player/v3-plus
```

NMPv3+ is intended for custom builds and advanced integrations rather than the default single-file CDN path.

For local repository development:

```bash
pnpm install
pnpm build
pnpm validate
```

## Repository Layout

```txt
nmpv3/       # lightweight single-JS player
nmpv3-plus/  # advanced framework and extension ecosystem
docs/        # public GitHub documentation
```

## Documentation

- [Public documentation](docs/README.md)
- [NMPv3 guide](docs/nmpv3/README.md)
- [NMPv3+ guide](docs/nmpv3-plus/README.md)

## Development Status

NMPv3 is the TypeScript/Vite standardization of the v2.5-era lightweight player. The current package keeps the v2.5 UI and interaction model while moving the implementation into typed modules, a browser custom element, single-JS style injection, NetEase Cloud Music song and playlist loading through a configurable API proxy, playback controls, lyrics, playlist UI, v2 DOM migration, and shortcodes.

## License

Apache License 2.0, continuing the NeteaseMiniPlayer v2 license model.
