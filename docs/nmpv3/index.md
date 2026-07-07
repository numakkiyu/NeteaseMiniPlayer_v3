# NMPv3

NMPv3 是 NeteaseMiniPlayer v3 的轻量播放器包。它面向 GitHub Pages、博客、CMS、静态页面、普通 WordPress 前台和前端项目中的基础音乐嵌入。

## 目标

- 默认浏览器部署只需要一个 `nmpv3.min.js`
- 样式由 JavaScript 注入
- 运行时不依赖前端框架
- 音乐来源限定为网易云音乐
- 支持 `<nmp-player>`、短代码和旧 DOM 迁移
- 可通过 npm 安装并在前端项目中 import

## CDN 示例

```html
<script src="https://cdn.jsdelivr.net/npm/netease-mini-player-v3@3.0.0-alpha.0/dist/nmpv3.min.js"></script>

<nmp-player
  playlist-id="14273792576"
  theme="auto"
  layout="compact"
></nmp-player>
```

## npm 示例

```bash
npm install netease-mini-player-v3
pnpm add netease-mini-player-v3
```

```ts
import "netease-mini-player-v3/auto";
```

## 支持能力

| 能力                     | 状态         |
| ------------------------ | ------------ |
| 网易云单曲和歌单         | 支持         |
| compact、mini、dock 布局 | 支持         |
| auto、light、dark 主题   | 支持         |
| 歌词、播放列表、播放模式 | 支持         |
| 短代码和 v2 DOM 兼容     | 支持         |
| 插件、皮肤包、自定义来源 | 不属于 NMPv3 |

## 阅读路径

- [浏览器直接引用](./browser)
- [集成教程总览](./integrations/)
- [HTML 直接引用](./integrations/html)
- [React 接入](./integrations/react)
- [Vue 3 接入](./integrations/vue3)
- [Next.js 接入](./integrations/nextjs)
- [基础使用](./usage)
- [API 与配置](./api)
- [源码修改](./source-editing)
- [WordPress Basic](./wordpress)
