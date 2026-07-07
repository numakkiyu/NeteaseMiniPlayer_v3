# WordPress 与 PHP 高级集成

NMPv3+ 负责高级 WordPress 和 PHP 集成。它和 NMPv3 WordPress Basic 的区别是，Plus 可以管理多文件资源、插件、皮肤、Gutenberg 区块、自定义音乐源和高级短代码。

## 能力边界

NMPv3 WordPress Basic：

- 加载一个 `nmpv3.min.js`
- 输出 `<nmp-player>`
- 提供简单 `[nmpv3]` 短代码
- 设置默认 API 代理

NMPv3+ WordPress：

- 复制基础播放器和 Plus runtime
- 复制 browser bootstrap
- 复制 selected extensions 和 manifests
- 复制 selected skins 和 skin metadata
- 生成 Gutenberg block metadata
- 生成 enqueue plan
- 支持高级短代码和 PHP helper

## Enqueue plan

```ts
import { createNMPv3PlusWordPressEnqueuePlan } from "@netease-mini-player/v3-plus/wordpress";

const plan = createNMPv3PlusWordPressEnqueuePlan({
  apiBaseUrl: "https://example.com/NeteaseMiniPlayer/nmp.php",
  enabledExtensions: ["host-sync"],
  enabledSkins: ["default"],
  defaultSkin: "default",
});
```

这个计划用于决定 WordPress 前台应该按什么顺序加载资源。

## 构建 WordPress 插件包

```ts
import { buildNMPv3PlusWordPressPluginPackage } from "@netease-mini-player/v3-plus/wordpress";

await buildNMPv3PlusWordPressPluginPackage({
  settings: {
    enabledExtensions: ["host-sync"],
    enabledSkins: ["default"],
    defaultSkin: "default",
  },
});
```

构建过程会复制：

- 基础 `nmpv3.min.js`
- Plus WordPress bootstrap
- Plus runtime module
- `packages/`
- `extensions/`
- `chunks/`
- selected extension manifests
- selected skin JSON files
- Gutenberg block files
- package manifest

## Gutenberg block metadata

```ts
import { createNMPv3PlusBlockMetadata } from "@netease-mini-player/v3-plus/wordpress";

const block = createNMPv3PlusBlockMetadata({
  defaultSkin: "default",
  hostSyncEnabled: true,
});
```

区块元数据应只引用构建包中真实存在的文件。

## PHP helper

PHP helper 文件路径：

```txt
nmpv3-plus/packages/php/nmpv3-plus-helper.php
```

TypeScript 入口可以渲染 Plus 属性：

```ts
import { renderNMPv3PlusShortcode } from "@netease-mini-player/v3-plus/php";

renderNMPv3PlusShortcode({
  source: "local-json",
  localMusicJson: "/music/playlist.json",
  skin: "vinyl",
});
```

## 短代码建议

Plus 高级短代码可以表达自定义来源和皮肤：

```txt
[nmpv3plus source="local-json" playlist="/music/playlist.json" skin="glass"]
```

基础网易云播放器仍建议使用 NMPv3 Basic 短代码。

## 部署检查

发布 WordPress 或 PHP 集成前检查：

- 基础播放器脚本在 Plus bootstrap 前加载
- API 代理能注入到 `window.NMPv3Config.apiBaseUrl`
- 选择的插件和皮肤都存在 manifest 或 skin JSON
- Gutenberg block 引用的脚本路径真实存在
- PHP helper 输出的属性名和前端 adapter 保持一致
- 没有把高级后台逻辑写进 NMPv3 Basic 示例
