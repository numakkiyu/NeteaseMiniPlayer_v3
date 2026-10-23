import type {
  NMPv3PlusPlugin,
  NMPv3PlusPluginContext,
} from "../../../packages/core/src/index";

/**
 * 工具栏快捷操作（样板插件）
 *
 * 这个插件的用途是演示「一个插件如何同时用上四个通道」：
 * - slot：往工具栏插按钮
 * - command：暴露可被外部调用的命令
 * - shortcut：绑定键盘快捷键
 * - config：读写播放器配置
 *
 * 把它当模板看，删掉不需要的部分就是自己的插件。
 */

const PALETTE_CYCLE = [
  "dawn",
  "jade",
  "azure",
  "amber",
  "iris",
  "mono",
] as const;
const SCALE_MIN = 1;
const SCALE_MAX = 10;

interface ToolbarActionOptions {
  /** 是否注册快捷键，默认 true */
  shortcuts?: boolean;
  /** 色板循环顺序，默认内置六套 */
  palettes?: readonly string[];
}

function currentPalette(ctx: NMPv3PlusPluginContext, fallback: string): string {
  const palette = ctx.config.get().palette;
  return typeof palette === "string" && palette ? palette : fallback;
}

function nextPalette(current: string, cycle: readonly string[]): string {
  const index = cycle.indexOf(current);
  const next = index < 0 ? 0 : (index + 1) % cycle.length;
  return cycle[next];
}

function clampScale(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  const base = Number.isFinite(numeric) ? numeric : 5;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(base)));
}

function createButton(
  doc: Document,
  label: string,
  hint: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.title = hint;
  button.setAttribute("aria-label", hint);
  button.dataset.nmpv3PlusToolbarAction = label;
  button.addEventListener("click", onClick);
  return button;
}

export function createToolbarActionsPlugin(
  options: ToolbarActionOptions = {},
): NMPv3PlusPlugin {
  const cycle = options.palettes?.length ? options.palettes : PALETTE_CYCLE;

  return {
    name: "official-toolbar-actions",
    version: "3.0.2",
    setup(ctx) {
      const { slot, command, shortcut, config, logger } = ctx;
      const disposers: Array<() => void> = [];

      /* ---------- 1. 把按钮插进工具栏 ---------- */
      disposers.push(
        slot.register("toolbar", ({ container, onCleanup }) => {
          const doc = container.ownerDocument;
          container.dataset.nmpv3PlusToolbar = "true";

          const cyclePalette = () => {
            const current = currentPalette(ctx, cycle[0]);
            const next = nextPalette(current, cycle);
            void config.patch({ palette: next, paletteFollowHost: false });
          };

          const changeScale = (delta: number) => {
            const current = clampScale(config.get().scale);
            void config.patch({ scale: clampScale(current + delta) });
          };

          container.append(
            createButton(doc, "调色", "切换下一套配色", cyclePalette),
            createButton(doc, "－", "缩小一档", () => changeScale(-1)),
            createButton(doc, "＋", "放大一档", () => changeScale(1)),
          );

          onCleanup(() => {
            // 容器会被插槽系统整体移除，这里只需要断开可能的外部引用
            container.dataset.nmpv3PlusToolbar = "";
          });
        }),
      );

      /* ---------- 2. 注册命令，供宿主或其它插件调用 ---------- */
      disposers.push(
        command.register({
          id: "toolbar-actions.cyclePalette",
          title: "切换配色",
          handler: () => {
            const current = currentPalette(ctx, cycle[0]);
            const next = nextPalette(current, cycle);
            return config.patch({ palette: next, paletteFollowHost: false });
          },
        }),
        command.register({
          id: "toolbar-actions.setScale",
          title: "设置缩放档位",
          handler: (arg) => config.patch({ scale: clampScale(arg) }),
        }),
      );

      /* ---------- 3. 快捷键 ---------- */
      if (options.shortcuts !== false) {
        disposers.push(
          shortcut.register({
            keys: "ctrl+shift+p",
            handler: () => {
              const current = currentPalette(ctx, cycle[0]);
              void config.patch({
                palette: nextPalette(current, cycle),
                paletteFollowHost: false,
              });
            },
          }),
        );
      }

      /* ---------- 4. 订阅配置变化，做一次日志，方便排查 ---------- */
      disposers.push(
        config.subscribe((next, previous) => {
          if (next.palette !== previous.palette) {
            logger.info(
              `toolbar-actions: palette ${String(previous.palette)} → ${String(next.palette)}`,
            );
          }
        }),
      );

      return () => {
        for (const dispose of disposers.splice(0)) {
          try {
            dispose();
          } catch (error) {
            logger.error("toolbar-actions: dispose failed", error);
          }
        }
      };
    },
  };
}
