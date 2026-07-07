# NMPv3+ 源码修改

NMPv3+ 的源码修改要围绕框架边界进行。不应为了某个高级功能修改 NMPv3 轻量版，也不应将 Plus 默认 UI 设计为不可替换的强绑定界面。

## 修改前准备

```bash
pnpm install
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus typecheck
pnpm --filter @netease-mini-player/v3-plus test
pnpm --filter @netease-mini-player/v3-plus build
```

UI 或浏览器 bootstrap 相关改动还要跑：

```bash
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```

## 常用源码位置

| 目标            | 文件或目录                              |
| --------------- | --------------------------------------- |
| 组合式 app 入口 | `nmpv3-plus/packages/core/src/app/`     |
| runtime 主入口  | `nmpv3-plus/packages/core/src/runtime/` |
| 插件管理        | `nmpv3-plus/packages/core/src/plugin/`  |
| 皮肤管理        | `nmpv3-plus/packages/core/src/skin/`    |
| 音乐源管理      | `nmpv3-plus/packages/core/src/source/`  |
| 歌词管理        | `nmpv3-plus/packages/core/src/lyric/`   |
| 宿主联动        | `nmpv3-plus/packages/core/src/bridge/`  |
| 事件总线        | `nmpv3-plus/packages/core/src/event/`   |
| 框架属性适配    | `nmpv3-plus/packages/adapters/src/`     |
| React 入口      | `nmpv3-plus/packages/react/src/`        |
| Vue 入口        | `nmpv3-plus/packages/vue/src/`          |
| Next 入口       | `nmpv3-plus/packages/next/src/`         |
| Nuxt 入口       | `nmpv3-plus/packages/nuxt/src/`         |
| Astro 入口      | `nmpv3-plus/packages/astro/src/`        |
| Svelte 入口     | `nmpv3-plus/packages/svelte/src/`       |
| CLI             | `nmpv3-plus/packages/cli/src/`          |
| WordPress       | `nmpv3-plus/packages/wordpress/src/`    |
| PHP helper      | `nmpv3-plus/packages/php/`              |
| 官方扩展        | `nmpv3-plus/extensions/official/`       |
| 官方皮肤        | `nmpv3-plus/skins/official/`            |

## 新增一个官方插件

建议步骤：

1. 在 `nmpv3-plus/extensions/official/<name>/` 创建插件目录
2. 写 `manifest.json`
3. 写 `index.ts`
4. 如果需要样式，写 `style.css` 和对应的 `styleText.ts`
5. 在官方扩展导出入口注册
6. 为 manifest、安装、依赖和清理写测试
7. 更新文档

插件必须返回清理函数或清理 promise。它不应该把事件、定时器、样式和 DOM 副作用留在卸载后。

## 新增一个官方皮肤

建议步骤：

1. 在 `nmpv3-plus/skins/official/<name>/` 创建目录
2. 写 `skin.json`
3. 写 `skin.css`
4. 在官方皮肤导出入口注册
5. 确认选择器可被 SkinEngine 作用域隔离
6. 更新皮肤测试和文档

皮肤应尽量通过 token 和局部 CSS 表达，不要改 NMPv3 DOM 结构。

## 修改 framework adapter

所有框架适配器都应该基于共享的属性映射能力。新增字段时通常需要同步：

1. `nmpv3-plus/packages/adapters/src/elementProps.ts`
2. 相关框架入口
3. 类型声明
4. adapter 测试
5. 文档示例

适配器输出的是自定义元素属性，不应该引入 React、Vue 或 Svelte 运行时作为 Plus package 的硬依赖。

## 修改 custom build

CLI 修改要保证部署包里是真实文件。

检查项：

- runtime 文件存在
- browser bootstrap 存在
- selected extension 的 `index.js` 和 `manifest.json` 存在
- selected skin 的 `skin.json` 存在
- `packages/`、`chunks/` 和相对 import 没有断
- 未知扩展或皮肤会失败

## 修改 WordPress 或 PHP 集成

WordPress 高级集成属于 Plus。它可以复制基础 `nmpv3.min.js`，再复制 Plus bootstrap、runtime、扩展、皮肤、区块文件和 manifest。

修改时要确认：

- 基础播放器先加载
- Plus 资源后加载
- API 代理配置能同步到 NMPv3
- Gutenberg block 只引用存在的资源
- PHP helper 输出的属性与 adapter 规则一致

## 验收清单

```bash
pnpm --filter @netease-mini-player/v3-plus typecheck
pnpm --filter @netease-mini-player/v3-plus test
pnpm --filter @netease-mini-player/v3-plus build
```

涉及 UI、浏览器 bootstrap、布局、皮肤、来源或 host sync 时执行：

```bash
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```

还要人工确认：

- NMPv3 没有被 Plus 反向依赖
- 默认 UI 仍从基础播放器开始
- 高级视觉是显式 opt-in
- 插件和皮肤能卸载和清理
- 文档没有把 Plus 高级能力写成 NMPv3 功能
