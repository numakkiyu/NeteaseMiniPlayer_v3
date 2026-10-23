# 最小插件模板

这是一个可以直接复制的最小可运行插件，用来快速起手，不用从空文件开始。

## 怎么用

把整个 `minimal-plugin` 目录复制到 `extensions/official/`，改名成你的插件名：

```bash
cp -r nmpv3-plus/templates/minimal-plugin nmpv3-plus/extensions/official/my-plugin
```

然后按顺序改五处：

1. `manifest.json`：改 `name`、`displayName`、`description`、`author`
2. `src/index.ts`：改 `PLUGIN_NAME`，必须和 manifest 的 `name` 一致
3. `src/index.ts`：改 `setup` 里的逻辑
4. `extensions/official/index.ts`：加一行 `export * from "./my-plugin";`
5. `extensions/official/manifests.ts`：照着已有条目加一条记录

最后跑一次测试：

```bash
pnpm --filter netease-mini-player-v3-plus test
```

## 目录结构

```
minimal-plugin/
├── manifest.json     # 插件元信息与配置项声明
├── README.md
└── src/
    ├── index.ts      # 插件实现
    └── index.test.ts # 最小测试
```

## 导入路径

模板里的 import 写的是相对路径：

```ts
import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";
```

复制到 `extensions/official/my-plugin/src/` 后层级不变，这个路径仍然有效。
如果你把插件放到别的地方（比如独立仓库），改成从包入口导入：

```ts
import type { NMPv3PlusPlugin } from "netease-mini-player-v3-plus";
```

## 插件能用的能力

`setup(ctx)` 里的 `ctx` 提供这些：

| 字段                           | 用途                                                 |
| ------------------------------ | ---------------------------------------------------- |
| `ctx.player` / `ctx.audio`     | 底层播放器与 audio 元素，可能为 `null`               |
| `ctx.store`                    | 键值存储，带 `subscribe`                             |
| `ctx.source` / `ctx.lyrics`    | 加载与注册来源、歌词适配器                           |
| `ctx.config`                   | `get()` / `patch()` / `subscribe()` 读写播放器配置   |
| `ctx.slot`                     | 往 `toolbar` / `overlay` / `panel` 或自定义位置挂 UI |
| `ctx.command`                  | 注册可被外部调用的命令                               |
| `ctx.shortcut`                 | 注册快捷键                                           |
| `ctx.on` / `ctx.emit`          | 事件订阅与派发                                       |
| `ctx.getPart` / `ctx.setToken` | 取播放器内部元素、写 CSS 变量                        |
| `ctx.logger`                   | 分级日志                                             |

## 清理很重要

`setup` 返回的函数会在插件卸载时执行。凡是注册出去的东西都要在这里撤掉：

```ts
setup(ctx) {
  const disposers: Array<() => void> = [];

  disposers.push(ctx.on("songchange", handler));
  disposers.push(ctx.command.register({ id: "x.y", handler: () => {} }));

  return () => {
    for (const dispose of disposers.splice(0)) {
      dispose();
    }
  };
}
```

漏掉清理会导致插件卸载后还在响应事件，或者重复安装时注册冲突。

## 配置项

`manifest.json` 的 `configSchema` 用来声明插件接受的选项，格式是：

```json
{
  "configSchema": {
    "greeting": { "type": "string", "default": "hello" }
  }
}
```

支持的 `type`：`string`、`number`、`boolean`、`array`、`object`。

## 参考实现

想看更完整的写法，按复杂度递增：

| 插件              | 用到的能力                                  |
| ----------------- | ------------------------------------------- |
| `toolbar-actions` | 四个通道全用上：插槽 + 命令 + 快捷键 + 配置 |
| `mini-lyric`      | overlay 插槽 + 定时同步 + 二分查找          |
| `playlist-panel`  | panel 插槽 + 列表渲染 + 切歌命令            |
| `cover-color`     | 事件订阅 + CSS 变量写入                     |
