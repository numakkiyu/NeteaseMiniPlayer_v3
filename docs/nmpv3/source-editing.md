# NMPv3 源码修改

NMPv3 允许开发者直接改源码后重新构建。修改时要保留轻量版的核心承诺：一个 JS、零运行时依赖、只支持网易云音乐。

## 修改前准备

安装依赖：

```bash
pnpm install
```

只验证 NMPv3：

```bash
pnpm --filter @netease-mini-player/v3 typecheck
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3 test
```

## 常用源码位置

| 目标               | 文件                                    |
| ------------------ | --------------------------------------- |
| 自定义元素生命周期 | `nmpv3/src/element/NMPv3Element.ts`     |
| 播放器主逻辑       | `nmpv3/src/core/NMPv3Player.ts`         |
| 音频控制           | `nmpv3/src/core/AudioController.ts`     |
| 网易云 API 请求    | `nmpv3/src/api/NeteaseApiClient.ts`     |
| DOM 渲染           | `nmpv3/src/ui/render.ts`                |
| 图标               | `nmpv3/src/ui/icons.ts`                 |
| 样式字符串         | `nmpv3/src/styles/nmpv3.css.ts`         |
| 默认配置           | `nmpv3/src/config/defaultConfig.ts`     |
| HTML 属性归一化    | `nmpv3/src/config/normalizeConfig.ts`   |
| LRC 解析           | `nmpv3/src/lyric/parseLrc.ts`           |
| 短代码解析         | `nmpv3/src/shortcode/parseShortcode.ts` |
| v2 DOM 兼容        | `nmpv3/src/shortcode/legacyV2.ts`       |

## 修改样式

轻量版样式在 `nmpv3/src/styles/nmpv3.css.ts`。它会被构建进 JavaScript 并在运行时注入页面。

修改步骤：

1. 先找现有 `nmpv3-` 前缀类名
2. 修改尺寸、颜色、间距或状态样式
3. 避免引入外部 CSS 文件
4. 避免使用过于通用的类名
5. 构建后确认 `dist/nmpv3.min.js` 仍包含样式

不要把完整皮肤包加载器写进 NMPv3。需要皮肤包时使用 NMPv3+。

## 修改 DOM 结构

DOM 渲染在 `nmpv3/src/ui/render.ts`。修改结构时要保持控件的可访问性和移动端稳定性。

建议流程：

1. 先确认要改的是 compact、mini 还是 dock
2. 保留播放、暂停、上一首、下一首、进度、歌词和列表的基础结构
3. 给新增元素使用 `nmpv3-` 前缀类名
4. 更新 `NMPv3Player.ts` 中对应的查询和事件绑定
5. 检查 destroy 时事件能被清理

## 修改默认配置

默认配置在 `nmpv3/src/config/defaultConfig.ts`：

```ts
export const defaultConfig = {
  theme: "auto",
  layout: "compact",
  volume: 0.8,
  remember: true,
};
```

新增配置时需要同步：

1. `nmpv3/src/types.ts`
2. `nmpv3/src/config/defaultConfig.ts`
3. `nmpv3/src/config/normalizeConfig.ts`
4. `nmpv3/src/index.ts` 的属性应用逻辑
5. 相关测试和公开文档

新增配置不能变成插件、皮肤、SourceAdapter 或 HostBridge 的入口。

## 修改 API 逻辑

网易云 API 客户端在 `nmpv3/src/api/NeteaseApiClient.ts`。轻量版只应保留必要接口：

```txt
/song/detail
/playlist/track/all
/song/url/v1
/lyric
```

需要支持本地 JSON、第三方平台或自定义 source 时，将需求放到 NMPv3+。

## 修改短代码或旧 DOM 兼容

短代码入口：

```txt
nmpv3/src/shortcode/parseShortcode.ts
```

旧 DOM 读取入口：

```txt
nmpv3/src/shortcode/legacyV2.ts
```

修改后至少覆盖这些场景：

- `{nmpv3:playlist=14273792576}`
- `{nmpv2:song-id=1901371647, theme=dark}`
- `.netease-mini-player` 的 `data-song-id`
- `.netease-mini-player` 的 `data-playlist-id`

## 构建与检查

```bash
pnpm --filter @netease-mini-player/v3 typecheck
pnpm --filter @netease-mini-player/v3 test
pnpm --filter @netease-mini-player/v3 build
```

修改完成后还要人工检查：

- `nmpv3/package.json` 的 `dependencies` 仍然是空对象
- 构建产物仍然包含 `dist/nmpv3.min.js`
- 页面直接引用一个 JS 后可以运行
- 移动端没有横向滚动
- 长标题、长歌手和长歌词不会挤压按钮
- 控制台没有错误
