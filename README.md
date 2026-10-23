<div align="center">

# NeteaseMiniPlayer v3

**基于 NeteaseCloudMusicApi 的轻量级可插入式音乐播放器 UI 组件库**

一个 JavaScript 文件即可嵌入 · 零运行时依赖 · 原生 Web Component · 网易云音乐专用

<p>
  <img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg?style=flat-square">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/netease-mini-player-v3?style=flat-square&label=%40netease-mini-player%2Fv3">
  <img alt="NPM Version Plus" src="https://img.shields.io/npm/v/netease-mini-player-v3-plus?style=flat-square&label=%40netease-mini-player%2Fv3-plus">
  <img alt="jsDelivr" src="https://img.shields.io/jsdelivr/npm/hm/netease-mini-player-v3?style=flat-square&label=jsDelivr">
  <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A518-22c55e?style=flat-square">
  <img alt="Package Manager" src="https://img.shields.io/badge/pnpm-workspace-F69D20?style=flat-square">
  <img alt="Language" src="https://img.shields.io/badge/TypeScript-5.5%2B-3178C6?style=flat-square">
  <img alt="Docs" src="https://img.shields.io/badge/docs-VitePress-1.x-646CFF?style=flat-square">
</p>

<p>
  <a href="./docs/guide/getting-started.md">快速开始</a> ·
  <a href="./docs/guide/cdn.md">CDN 引用</a> ·
  <a href="./docs/guide/which-version.md">选择版本</a> ·
  <a href="./docs/index.md">完整文档</a> ·
  <a href="./CONTRIBUTING.md">参与贡献</a> ·
  <a href="./CHANGELOG.md">更新日志</a>
</p>

</div>

---

> \[!IMPORTANT]
> NeteaseMiniPlayer v3 在同一个开源仓库中维护 **两条独立产品线**：
>
> - **NMPv3**：轻量播放器，默认只面向网易云音乐，浏览器部署仅需一个 `nmpv3.min.js`，运行时零依赖。
> - **NMPv3+**：高级扩展框架，面向插件、皮肤、自定义音乐源、自定义歌词、宿主页面联动与框架适配器。
>
> 二者不是同一包内的功能开关，功能边界严格分开。详见 [选择版本](./docs/guide/which-version.md)。

## 目录

- [项目特性](#项目特性)
- [选择版本](#选择版本)
- [快速开始](#快速开始)
  - [CDN 引用](#cdn-引用)
  - [npm / pnpm 安装](#npm--pnpm-安装)
- [NMPv3+ 入门](#nmpv3-入门)
- [文档导航](#文档导航)
- [仓库结构](#仓库结构)
- [本地开发](#本地开发)
- [许可证](#许可证)

## 项目特性

- **单文件嵌入**：只需要一个 `nmpv3.min.js`，样式随 JS 注入，不用额外引 CSS。
- **零运行时依赖**：不引入 React、Vue、Lit、jQuery 等任何运行时框架。
- **原生 Web Component**：用 `<nmp-player>` 接入，与页面框架无关。
- **6 套配色色板**：每套含明暗两份种子，可跟随宿主页面取色，也可固定用色板。
- **1–10 档等比缩放**：宽度、字号、封面、圆角一起缩放，窄屏等比收进容器而不是压扁。
- **卡片与唱片形态**：可收成圆形唱片贴边，展开回卡片，形变过程为合成动画，稳定 60fps。
- **宿主隔离**：挂载时校验容器、只注入一个 style、样式全部带前缀，不污染宿主页面。
- **v2 兼容**：保留紧凑 / 迷你 / 悬浮形态、短代码 `{nmpv3:...}` 与旧 `.netease-mini-player` 迁移路径。
- **CDN 友好**：发布至 npm，可通过 jsDelivr / unpkg 直接引用，支持版本锁定。

## 选择版本

| 场景                                                   | 使用版本   | 说明                         |
| ------------------------------------------------------ | ---------- | ---------------------------- |
| 在公开网页、博客、CMS 或静态站点中嵌入网易云播放器     | **NMPv3**  | 一个 JavaScript 文件即可运行 |
| 在 React、Vue3、Nuxt、Astro 或 Svelte 中输出基础播放器 | **NMPv3**  | 直接使用原生 `<nmp-player>`  |
| 需要普通 WordPress 短代码前台                          | **NMPv3**  | 前台只加载 `nmpv3.min.js`    |
| 需要本地 JSON、歌词文件、插件、皮肤或页面联动          | **NMPv3+** | 这些能力由高级框架提供       |
| 需要 WordPress 后台、Gutenberg 区块或资源包构建        | **NMPv3+** | 属于高级集成                 |

> 旧站点建议先迁到 NMPv3，确认单曲、歌单、短代码和旧 DOM 兼容路径都正常，再考虑是否要用 NMPv3+。详见 [选择版本](./docs/guide/which-version.md)。

## 快速开始

### CDN 引用

通过 jsDelivr 引入 NMPv3（推荐）：

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

通过 unpkg 引入：

```html
<script src="https://unpkg.com/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>

<nmp-player song-id="1901371647" theme="auto" layout="mini"></nmp-player>
```

> \[!TIP]
> 生产环境应固定版本号，避免 `latest` 带来不可预期的升级：
>
> ```html
> <script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.1/dist/nmpv3.min.js"></script>
> ```

更多用法见 [CDN 引用指南](./docs/guide/cdn.md)。

### npm / pnpm 安装

```bash
npm install netease-mini-player-v3
# 或
pnpm add netease-mini-player-v3
```

引入自动注册入口：

```ts
import "netease-mini-player-v3/auto";
```

在页面中使用自定义元素：

```html
<nmp-player playlist-id="14273792576" api-base-url="/api/netease"></nmp-player>
```

## NMPv3+ 入门

NMPv3+ 面向需要扩展能力的集成者，需同时安装基础播放器与 Plus 框架：

```bash
npm install netease-mini-player-v3 netease-mini-player-v3-plus
# 或
pnpm add netease-mini-player-v3 netease-mini-player-v3-plus
```

浏览器端先加载基础播放器，再加载 Plus 浏览器入口。未选择任何高级扩展时，界面停留在 NMPv3 基础 UI：

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@latest/dist/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php",
    defaultSkin: "default",
  };
</script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3-plus@latest/dist/browser.js"
></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

> \[!NOTE]
> NMPv3+ 装好后默认还是 NMPv3 的基础界面，它提供的是扩展框架，不是另一套更花哨的皮肤。完整能力清单（PluginManager / SkinEngine / SourceAdapter / LyricsAdapter / HostBridge / CLI / 框架适配器）见 [NMPv3+ 指南](./docs/nmpv3-plus/index.md) 与子包 README [`nmpv3-plus/README.md`](./nmpv3-plus/README.md)。

## 文档导航

完整文档基于 VitePress 构建，源文件位于 [`docs/`](./docs) 目录。以下为各模块文档入口：

**指南类**

- [文档首页](./docs/index.md) — 首页，按场景接入导航
- [选择版本](./docs/guide/which-version.md) — NMPv3 与 NMPv3+ 的边界与选型建议
- [快速开始](./docs/guide/getting-started.md) — 从零接入的完整步骤
- [CDN 引用](./docs/guide/cdn.md) — jsDelivr / unpkg 与包入口字段
- [自定义配置](./docs/guide/custom-configuration.md) — 属性、全局配置与 CSS 变量
- [框架集成总览](./docs/guide/framework-integration.md) — React / Vue3 / Next / Nuxt / Astro / Svelte

**项目线文档**

- [NMPv3 指南](./docs/nmpv3/index.md) — 轻量播放器完整说明
- [NMPv3+ 指南](./docs/nmpv3-plus/index.md) — 高级扩展框架完整说明

## 仓库结构

```txt
.
├── nmpv3/        # 轻量单 JS 播放器（NMPv3）
├── nmpv3-plus/   # 高级扩展框架与扩展生态（NMPv3+）
├── docs/         # 公开 VitePress 文档站点与静态嵌入 Demo
├── scripts/      # 仓库级脚本（文档 Demo 资源同步等）
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── NOTICE
```

## 本地开发

本仓库使用 pnpm workspace 管理多包。前置要求：Node ≥ 18，pnpm 已安装。

安装依赖：

```bash
pnpm install
```

构建两条产品线：

```bash
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3-plus build
```

启动文档站点的本地预览：

```bash
pnpm docs:dev
```

运行完整的仓库校验（类型检查 + 测试 + Lint + 格式检查）：

```bash
pnpm validate
```

其他可用脚本：

| 命令                | 作用                              |
| ------------------- | --------------------------------- |
| `pnpm typecheck`    | 全仓库 TypeScript 类型检查        |
| `pnpm test`         | 运行各包测试                      |
| `pnpm lint`         | ESLint 检查（`--max-warnings=0`） |
| `pnpm format`       | Prettier 格式化写入               |
| `pnpm format:check` | Prettier 格式检查                 |
| `pnpm docs:build`   | 构建文档站点                      |
| `pnpm docs:preview` | 预览已构建的文档站点              |

---

## 许可证

本项目基于 [Apache License 2.0](./LICENSE) 开源，版权所有 © 2026 BHCN STUDIO & 贡献者。

</div>
