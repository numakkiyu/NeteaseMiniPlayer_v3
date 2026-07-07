# 自定义构建

NMPv3+ 支持按需要选择扩展和皮肤，再生成部署包。这个流程适合生产站点、主题包、WordPress 高级插件和静态资源目录。

## 构建前准备

先构建基础播放器和 Plus：

```bash
pnpm --filter netease-mini-player-v3 build
pnpm --filter netease-mini-player-v3-plus build
```

## 构建配置

示例配置位于：

```txt
nmpv3-plus/examples/custom-build/nmpv3-plus.config.json
```

可以用 CLI 添加扩展和皮肤：

```bash
nmpv3-plus add examples/custom-build/nmpv3-plus.config.json visualizer host-sync glass
```

查看构建计划：

```bash
nmpv3-plus plan examples/custom-build/nmpv3-plus.config.json
```

生成部署包：

```bash
nmpv3-plus build examples/custom-build/nmpv3-plus.config.json
```

## 构建计划 API

TypeScript 中可以先解析计划：

```ts
import { resolveNMPv3PlusBuildPlan } from "netease-mini-player-v3-plus/cli";

const plan = resolveNMPv3PlusBuildPlan({
  extensions: ["visualizer", "host-sync"],
  skins: ["glass", "vinyl"],
});
```

构建计划会包含 runtime、browser bootstrap、扩展、皮肤、manifest 和 HTML 标签信息。

## 部署目录

构建命令会复制真实文件，而不是生成占位资源。部署目录应保留 Vite ESM 输出结构：

```txt
deploy/
├─ nmpv3-plus.runtime.js
├─ nmpv3-plus.bootstrap.js
├─ nmpv3-plus.manifest.json
├─ packages/
├─ chunks/
├─ extensions/
│  └─ official/
│     └─ visualizer/
│        ├─ index.js
│        └─ manifest.json
└─ skins/
   └─ official/
      └─ glass/
         └─ skin.json
```

如果扩展编译后有相对 import，保留目录结构能避免运行时找不到依赖。

## 页面引用

普通 HTML 部署仍然先加载 NMPv3：

```html
<script src="/nmpv3.min.js"></script>
<script>
  window.NMPv3PlusConfig = {
    apiBaseUrl: "/api/netease",
    defaultSkin: "default",
  };
</script>
<script type="module" src="/deploy/nmpv3-plus.bootstrap.js"></script>

<nmp-player playlist-id="14273792576" layout="compact"></nmp-player>
```

启用高级能力：

```html
<script>
  window.NMPv3PlusConfig = {
    enabledExtensions: ["visualizer", "host-sync"],
  };
</script>

<nmp-player
  playlist-id="14273792576"
  skin="glass"
  plus-extensions="advanced-layouts,visualizer"
  plus-layout="cover"
></nmp-player>
```

## API 代理同步

如果 `NMPv3PlusConfig.apiBaseUrl` 存在，Plus bootstrap 会同步到：

```txt
window.NMPv3Config.apiBaseUrl
window.NMPv3ApiBaseUrl
window.NeteaseMiniPlayerApiBaseUrl
window.NMPv3.setApiBaseUrl(url)
```

如果没有全局覆盖，Plus 会保留基础播放器已有的 API 配置。单个播放器上的 `api-base-url` 仍然优先。

## 构建错误处理

未知扩展或皮肤应该直接报错。不要生成假文件或空 manifest。

常见检查：

- 扩展名是否写对
- 皮肤名是否存在
- `dist/` 是否已经构建
- manifest 是否被复制到部署目录
- `packages/`、`extensions/` 和 `chunks/` 是否保持相对路径
