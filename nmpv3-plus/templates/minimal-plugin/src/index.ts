import type {
  NMPv3PlusPlugin,
  NMPv3PlusPluginContext,
} from "../../../packages/core/src/index";

/**
 * 最小可运行插件
 *
 * 把整个 templates/minimal-plugin 目录复制到 extensions/official/<你的插件名>，
 * 然后按下面的顺序改：
 *
 * 1. 改 manifest.json 的 name / displayName / description
 * 2. 改下面 PLUGIN_NAME
 * 3. 改 setup 里的逻辑
 * 4. 在 extensions/official/index.ts 里加一行导出
 * 5. 在 extensions/official/manifests.ts 里加一条对应记录
 *
 * 这个文件刻意只用最小能力（一个命令 + 一条日志），
 * 想加 UI 看 ctx.slot，想读写配置看 ctx.config，
 * 想响应键盘看 ctx.shortcut，完整示例见 toolbar-actions。
 */

/** 插件名，必须和 manifest.json 的 name 一致 */
const PLUGIN_NAME = "nmpv3-plus-extension-my-plugin";

export interface NMPv3PlusMyPluginOptions {
  /** 示例选项：这条消息会在安装时打出来 */
  greeting?: string;
}

export function createMyPlugin(
  options: NMPv3PlusMyPluginOptions = {},
): NMPv3PlusPlugin {
  const greeting = options.greeting ?? "hello";

  return {
    name: PLUGIN_NAME,
    version: "1.0.0",
    setup(ctx: NMPv3PlusPluginContext) {
      /*
       * setup 里做的事情分成三类：
       * - 订阅（事件、配置）并保存取消函数
       * - 注册（插槽、命令、快捷键）并保存取消函数
       * - 返回一个清理函数，卸载时把上面这些全部撤掉
       */
      const disposers: Array<() => void> = [];

      ctx.logger.info(`${PLUGIN_NAME}: ${greeting}`);

      /* ---------- 1. 事件订阅 ---------- */
      disposers.push(
        ctx.on("songchange", (payload) => {
          const song = (payload as { song?: { name?: string } } | undefined)
            ?.song;
          ctx.logger.info(`${PLUGIN_NAME}: now playing`, song?.name ?? "-");
        }),
      );

      /* ---------- 2. 配置读写 ---------- */
      const palette = ctx.config.get().palette;
      ctx.logger.info(`${PLUGIN_NAME}: current palette`, palette);

      /* ---------- 3. 命令注册 ---------- */
      disposers.push(
        ctx.command.register({
          id: "my-plugin.ping",
          title: "Ping",
          handler: () => {
            ctx.logger.info(`${PLUGIN_NAME}: pong`);
            return { ok: true };
          },
        }),
      );

      /* ---------- 4. 清理 ---------- */
      return () => {
        for (const dispose of disposers.splice(0)) {
          try {
            dispose();
          } catch (error) {
            ctx.logger.error(`${PLUGIN_NAME}: dispose failed`, error);
          }
        }
      };
    },
  };
}
