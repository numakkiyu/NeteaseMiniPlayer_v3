# 文档站源码

本目录是 NeteaseMiniPlayer v3 的公开 VitePress 文档站源码，面向开发者、贡献者和普通使用

## 常用命令

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

## 主要入口

- `index.md`：简体中文首页
- `en/index.md`：英文首页
- `guide/getting-started.md`：快速开始
- `guide/cdn.md`：CDN 引用说明
- `guide/custom-configuration.md`：自定义配置
- `guide/framework-integration.md`：框架集成总览
- `nmpv3/`：NMPv3 轻量播放器文档
- `nmpv3/integrations/`：NMPv3 多技术栈接入教程
- `nmpv3-plus/`：NMPv3+ 高级扩展框架文档
- `public/demo/embed/index.html`：可独立运行的静态嵌入示例

## 文档边界

- `docs/` 只放公开文档和可发布静态资源
- NMPv3 文档只描述轻量播放器能力
- NMPv3+ 文档负责插件、皮肤、来源、歌词、宿主联动、框架适配和自定义构建

