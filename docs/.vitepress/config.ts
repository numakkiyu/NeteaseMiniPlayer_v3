import { defineConfig } from "vitepress";

const siteBase = process.env.VITEPRESS_BASE ?? "/";
const repositoryUrl =
  process.env.VITEPRESS_REPO_URL ??
  "https://github.com/BHCN-STUDIO/NeteaseMiniPlayer_v3";

const zhNav = [
  { text: "文档首页", link: "/" },
  { text: "版本选择", link: "/guide/which-version" },
  { text: "CDN", link: "/guide/cdn" },
  { text: "NMPv3", link: "/nmpv3/" },
  { text: "NMPv3+", link: "/nmpv3-plus/" },
];

const enNav = [
  { text: "Home", link: "/en/" },
  { text: "Choose a Version", link: "/en/guide/which-version" },
  { text: "CDN", link: "/en/guide/cdn" },
  { text: "NMPv3", link: "/en/nmpv3/" },
  { text: "NMPv3+", link: "/en/nmpv3-plus/" },
];

const zhSidebar = [
  {
    text: "开始",
    items: [
      { text: "文档首页", link: "/" },
      { text: "版本选择", link: "/guide/which-version" },
      { text: "快速开始", link: "/guide/getting-started" },
      { text: "CDN 引用", link: "/guide/cdn" },
      { text: "自定义配置", link: "/guide/custom-configuration" },
      { text: "框架集成总览", link: "/guide/framework-integration" },
    ],
  },
  {
    text: "NMPv3 轻量版",
    items: [
      { text: "定位与边界", link: "/nmpv3/" },
      { text: "浏览器直接引用", link: "/nmpv3/browser" },
      { text: "框架接入", link: "/nmpv3/frameworks" },
      { text: "基础使用", link: "/nmpv3/usage" },
      { text: "API 与配置", link: "/nmpv3/api" },
      { text: "源码修改", link: "/nmpv3/source-editing" },
      { text: "WordPress Basic", link: "/nmpv3/wordpress" },
    ],
  },
  {
    text: "NMPv3 集成教程",
    items: [
      { text: "教程总览", link: "/nmpv3/integrations/" },
      { text: "HTML 直接引用", link: "/nmpv3/integrations/html" },
      { text: "PHP / WordPress Basic", link: "/nmpv3/integrations/php" },
      { text: "React", link: "/nmpv3/integrations/react" },
      { text: "Vue 3", link: "/nmpv3/integrations/vue3" },
      { text: "Next.js", link: "/nmpv3/integrations/nextjs" },
      { text: "Nuxt", link: "/nmpv3/integrations/nuxt" },
      { text: "Astro", link: "/nmpv3/integrations/astro" },
      { text: "Svelte", link: "/nmpv3/integrations/svelte" },
    ],
  },
  {
    text: "NMPv3+ 高级版",
    items: [
      { text: "定位与边界", link: "/nmpv3-plus/" },
      { text: "快速开始", link: "/nmpv3-plus/getting-started" },
      { text: "深度自定义流程", link: "/nmpv3-plus/deep-customization" },
      { text: "框架适配", link: "/nmpv3-plus/frameworks" },
      { text: "插件与皮肤", link: "/nmpv3-plus/plugins-skins" },
      { text: "音乐源与歌词", link: "/nmpv3-plus/sources-lyrics" },
      { text: "自定义构建", link: "/nmpv3-plus/custom-build" },
      { text: "源码修改", link: "/nmpv3-plus/source-editing" },
      { text: "WordPress 与 PHP", link: "/nmpv3-plus/wordpress-php" },
    ],
  },
];

const enSidebar = [
  {
    text: "Start",
    items: [
      { text: "Home", link: "/en/" },
      { text: "Choose a Version", link: "/en/guide/which-version" },
      { text: "Quick Start", link: "/en/guide/getting-started" },
      { text: "CDN Usage", link: "/en/guide/cdn" },
      { text: "Custom Configuration", link: "/en/guide/custom-configuration" },
      {
        text: "Framework Integration",
        link: "/en/guide/framework-integration",
      },
    ],
  },
  {
    text: "NMPv3",
    items: [
      { text: "Positioning", link: "/en/nmpv3/" },
      { text: "Browser Script", link: "/en/nmpv3/browser" },
      { text: "Frameworks", link: "/en/nmpv3/frameworks" },
      { text: "Basic Usage", link: "/en/nmpv3/usage" },
      { text: "API and Config", link: "/en/nmpv3/api" },
      { text: "Source Editing", link: "/en/nmpv3/source-editing" },
      { text: "WordPress Basic", link: "/en/nmpv3/wordpress" },
    ],
  },
  {
    text: "NMPv3+",
    items: [
      { text: "Positioning", link: "/en/nmpv3-plus/" },
      { text: "Quick Start", link: "/en/nmpv3-plus/getting-started" },
      {
        text: "Deep Customization",
        link: "/en/nmpv3-plus/deep-customization",
      },
      { text: "Frameworks", link: "/en/nmpv3-plus/frameworks" },
      { text: "Plugins and Skins", link: "/en/nmpv3-plus/plugins-skins" },
      {
        text: "Sources and Lyrics",
        link: "/en/nmpv3-plus/sources-lyrics",
      },
      { text: "Custom Build", link: "/en/nmpv3-plus/custom-build" },
      { text: "Source Editing", link: "/en/nmpv3-plus/source-editing" },
      { text: "WordPress and PHP", link: "/en/nmpv3-plus/wordpress-php" },
    ],
  },
];

export default defineConfig({
  title: "NeteaseMiniPlayer v3",
  description: "NeteaseMiniPlayer v3 and v3 Plus documentation",
  base: siteBase,
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: false,
  head: [
    ["meta", { name: "theme-color", content: "#ff6b35" }],
    ["link", { rel: "icon", href: `${siteBase}nmpv3Logo.png` }],
  ],
  themeConfig: {
    logo: { light: "/nmpv3Logo.png", dark: "/nmpv3Logo.png", alt: "NMP" },
    nav: zhNav,
    sidebar: zhSidebar,
    socialLinks: [
      {
        icon: "github",
        link: repositoryUrl,
      },
    ],
    search: {
      provider: "local",
    },
    outline: {
      level: [2, 3],
      label: "本页目录",
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    lastUpdated: {
      text: "最后更新",
      formatOptions: {
        dateStyle: "medium",
        timeStyle: "short",
      },
    },
  },
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      title: "NeteaseMiniPlayer v3",
      description: "NeteaseMiniPlayer v3 与 v3 Plus 文档",
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
      },
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      title: "NeteaseMiniPlayer v3",
      description: "Documentation for NeteaseMiniPlayer v3 and v3 Plus",
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: {
          level: [2, 3],
          label: "On this page",
        },
        docFooter: {
          prev: "Previous",
          next: "Next",
        },
        lastUpdated: {
          text: "Last updated",
          formatOptions: {
            dateStyle: "medium",
            timeStyle: "short",
          },
        },
      },
    },
  },
});
