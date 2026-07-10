---
layout: home
hero:
  name: NeteaseMiniPlayer v3
  tagline: 基于 NeteaseCloudMusicApi 的轻量级可插入式音乐播放器 UI 组件库
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: CDN 引用
      link: /guide/cdn
features:
  - title: NMPv3
    details: 面向公开网页、博客、CMS 和普通 WordPress 场景，默认一个 JavaScript 文件即可嵌入
  - title: NMPv3+
    details: 面向二次开发和高级集成，提供插件、皮肤、自定义音乐源、自定义歌词和自定义构建
---

<div class="nmp-doc-badges">
  <span class="nmp-doc-badge">Apache-2.0</span>
  <span class="nmp-doc-badge">Web Component</span>
  <span class="nmp-doc-badge">VitePress Docs</span>
  <span class="nmp-doc-badge">jsDelivr</span>
  <span class="nmp-doc-badge">unpkg</span>
</div>

## 按场景接入

<div class="nmp-doc-link-grid nmp-doc-link-grid--compact">
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/html">
    <strong>HTML / 静态站点</strong>
    <span>适合 GitHub Pages、Hugo、Hexo、Jekyll 和普通静态页面</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/php">
    <strong>PHP / WordPress Basic</strong>
    <span>适合服务端模板、短代码渲染和 API 代理注入</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/react">
    <strong>React</strong>
    <span>适合 JSX 类型声明、客户端组件和 Vite React 项目</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/vue3">
    <strong>Vue 3</strong>
    <span>适合单文件组件、compilerOptions 和组合式项目</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/nextjs">
    <strong>Next.js</strong>
    <span>适合 App Router、客户端边界和动态导入</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/nuxt">
    <strong>Nuxt</strong>
    <span>适合 client plugin、SSR 安全加载和页面组件</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/astro">
    <strong>Astro</strong>
    <span>适合 Astro 页面、组件插槽和静态输出</span>
  </a>
  <a class="nmp-doc-link-card" href="./nmpv3/integrations/svelte">
    <strong>Svelte</strong>
    <span>适合浏览器端动态导入和自定义元素类型扩展</span>
  </a>
</div>

## 项目定位

NeteaseMiniPlayer v3 是一个面向开源社区维护的网页播放器项目。仓库从 v3 开始拆分为两条产品线：

- **NMPv3**：轻量播放器。默认只面向网易云音乐，浏览器部署只需要一个 `nmpv3.min.js`
- **NMPv3+**：高级扩展框架。面向插件、皮肤、自定义来源、自定义歌词、宿主页面联动和框架适配

两条产品线在同一个仓库维护，但功能边界分开。普通嵌入优先使用 NMPv3，需要扩展能力时再使用 NMPv3+。

## 推荐入口

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.1/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

如果项目已经使用 npm：

```bash
npm install netease-mini-player-v3
pnpm add netease-mini-player-v3
```

```ts
import "netease-mini-player-v3/auto";
```

## 下一步

- [选择版本](./guide/which-version)
- [快速开始](./guide/getting-started)
- [CDN 引用](./guide/cdn)
- [框架集成总览](./guide/framework-integration)
- [NMPv3 集成教程](./nmpv3/integrations/)
