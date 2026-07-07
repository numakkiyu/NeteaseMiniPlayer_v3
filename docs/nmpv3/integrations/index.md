# NMPv3 集成指南

NMPv3 面向不同宿主场景提供原生 Web Component 接入方案。本节按技术栈分类，覆盖静态页面、服务端脚本与主流前端框架。

NMPv3 与 NMPv3+ 的边界保持不变：需要插件、皮肤包、自定义来源或框架适配器时，应使用 NMPv3+；本节只涉及 NMPv3 原生能力。

## 适用场景

- 静态 HTML、Hugo、Hexo、Jekyll 等静态站点
- PHP 模板或 WordPress 插件
- React、Vue 3、Svelte、Astro、Next.js、Nuxt 等现代前端项目
- 需要通过 npm 构建或浏览器脚本直接引入的页面

## 教程列表

<div class="nmp-doc-link-grid">
  <a class="nmp-doc-link-card" href="./html">
    <strong>HTML 直接引用</strong>
    <span>浏览器脚本、短代码与旧版 DOM 迁移</span>
  </a>
  <a class="nmp-doc-link-card" href="./php">
    <strong>PHP / WordPress Basic</strong>
    <span>服务端短代码、模板输出与全局配置注入</span>
  </a>
  <a class="nmp-doc-link-card" href="./react">
    <strong>React</strong>
    <span>JSX 类型声明、客户端组件与事件监听</span>
  </a>
  <a class="nmp-doc-link-card" href="./vue3">
    <strong>Vue 3</strong>
    <span>单文件组件、compilerOptions 与组合式项目</span>
  </a>
  <a class="nmp-doc-link-card" href="./nextjs">
    <strong>Next.js</strong>
    <span>服务端/客户端边界与 App Router 集成</span>
  </a>
  <a class="nmp-doc-link-card" href="./nuxt">
    <strong>Nuxt</strong>
    <span>客户端插件、SSR 安全加载与页面组件</span>
  </a>
  <a class="nmp-doc-link-card" href="./astro">
    <strong>Astro</strong>
    <span>Astro 页面、静态输出与组件插槽</span>
  </a>
  <a class="nmp-doc-link-card" href="./svelte">
    <strong>Svelte</strong>
    <span>浏览器端动态导入与自定义元素类型扩展</span>
  </a>
</div>

## 通用检查项

接入后确认以下事项：

- 页面中只注册一次 `<nmp-player>` 自定义元素
- API 代理可访问 `/song/detail`、`/playlist/track/all`、`/song/url/v1` 和 `/lyric`
- 单曲与歌单 ID 以字符串形式传递
- SSR 框架仅在客户端导入 `@netease-mini-player/v3/auto`
- 未引入 NMPv3+ 的适配器包或插件系统
