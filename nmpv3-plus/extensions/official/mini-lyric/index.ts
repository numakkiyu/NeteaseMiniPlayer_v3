import type {
  NMPv3PlusPlugin,
  NMPv3PlusSong,
} from "../../../packages/core/src/index";

/**
 * 迷你歌词条
 *
 * 演示三件事：
 * 1. 用 overlay 插槽往播放器上层挂一条歌词
 * 2. 用 songchange 事件换歌时重新取歌词，再用定时器自己同步当前行
 *    （NMPv3 没有 timeupdate 事件，进度只能从 getState() 读）
 * 3. 用命令与快捷键控制显示开关
 */

export interface NMPv3PlusMiniLyricOptions {
  /** 初始是否显示，默认 true */
  visible?: boolean;
  /** 同步间隔（毫秒），默认 250；小于 80 会被钳到 80 */
  interval?: number;
  /** 快捷键，默认 ctrl+shift+l；传空串则不注册 */
  shortcut?: string;
}

const DEFAULT_INTERVAL = 250;
const MIN_INTERVAL = 80;

const STYLE_ID = "nmpv3-plus-mini-lyric-style";

const CSS_TEXT = `
.nmpv3-plus-mini-lyric {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  padding: 0 12px;
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  color: var(--nmpv3-muted, rgba(0, 0, 0, 0.6));
  text-shadow: 0 1px 2px var(--nmpv3-surface, #ffffff);
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 160ms ease;
}
.nmpv3-plus-mini-lyric[data-empty="true"] {
  opacity: 0;
}
`;

function ensureStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  doc.head?.append(style);
}

interface LyricLine {
  time: number;
  text: string;
}

/**
 * 在按时间升序排列的歌词里找当前行
 *
 * 用二分而不是从头扫：歌词同步是定时任务，行数多了线性扫会变成热路径。
 */
export function findActiveLyricLine(
  lines: readonly LyricLine[],
  currentTime: number,
): LyricLine | null {
  if (lines.length === 0 || !Number.isFinite(currentTime)) {
    return null;
  }

  let low = 0;
  let high = lines.length - 1;
  let active: LyricLine | null = null;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = lines[mid];

    if (line.time <= currentTime) {
      active = line;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return active;
}

export function createMiniLyricPlugin(
  options: NMPv3PlusMiniLyricOptions = {},
): NMPv3PlusPlugin {
  const interval = Math.max(
    MIN_INTERVAL,
    Number(options.interval) || DEFAULT_INTERVAL,
  );
  const shortcutKeys = options.shortcut ?? "ctrl+shift+l";

  return {
    name: "nmpv3-plus-extension-mini-lyric",
    version: "3.0.2",
    setup(ctx) {
      const { slot, command, shortcut, logger } = ctx;
      const disposers: Array<() => void> = [];

      let visible = options.visible !== false;
      let lines: LyricLine[] = [];
      let timer: ReturnType<typeof setInterval> | null = null;
      let elements: { bar: HTMLElement } | null = null;
      let lastText = "";

      const stopTimer = () => {
        if (timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      };

      const render = () => {
        if (!elements) {
          return;
        }

        if (!visible) {
          elements.bar.dataset.empty = "true";
          elements.bar.textContent = "";
          lastText = "";
          return;
        }

        const state = ctx.player?.getState?.() as
          { currentTime?: number } | undefined;
        const currentTime =
          typeof state?.currentTime === "number" ? state.currentTime : 0;
        const line = findActiveLyricLine(lines, currentTime);
        const text = line?.text ?? "";

        if (text === lastText) {
          return;
        }

        lastText = text;
        elements.bar.textContent = text;
        elements.bar.dataset.empty = text ? "false" : "true";
      };

      const startTimer = () => {
        if (timer !== null || !visible) {
          return;
        }

        timer = setInterval(render, interval);
      };

      const loadLyrics = async (songId: string, song?: NMPv3PlusSong) => {
        lines = [];

        if (!ctx.lyrics) {
          return;
        }

        try {
          const result = await ctx.lyrics.getLyrics({ songId, song });
          lines = result.lines
            .map((line) => ({ time: line.time, text: line.text }))
            .filter((line) => line.text)
            .sort((a, b) => a.time - b.time);
        } catch (error) {
          // 取不到歌词不是错误，静默变成空白条
          logger.warn("mini-lyric: lyric load failed", error);
          lines = [];
        }
      };

      /* ---------- 插槽 ---------- */
      disposers.push(
        slot.register("overlay", ({ container, onCleanup }) => {
          ensureStyle(container.ownerDocument);

          const bar = container.ownerDocument.createElement("div");
          bar.className = "nmpv3-plus-mini-lyric";
          bar.dataset.empty = "true";
          container.append(bar);

          elements = { bar };
          render();
          startTimer();

          onCleanup(() => {
            stopTimer();
            elements = null;
            lines = [];
            lastText = "";
          });
        }),
      );

      /* ---------- 换歌时重新取歌词 ---------- */
      disposers.push(
        ctx.on("songchange", (payload) => {
          const detail = payload as { song?: NMPv3PlusSong } | undefined;
          const songId = detail?.song?.id;

          if (songId === undefined || songId === null) {
            lines = [];
            render();
            return;
          }

          void loadLyrics(String(songId), detail?.song).then(render);
        }),
      );

      /* ---------- 命令 ---------- */
      const toggle = () => {
        visible = !visible;

        if (visible) {
          startTimer();
        } else {
          stopTimer();
        }

        render();
        return visible;
      };

      disposers.push(
        command.register({
          id: "mini-lyric.toggle",
          title: "切换迷你歌词条",
          handler: toggle,
        }),
      );

      /* ---------- 快捷键 ---------- */
      if (shortcutKeys) {
        disposers.push(
          shortcut.register({
            keys: shortcutKeys,
            handler: () => {
              void toggle();
            },
          }),
        );
      }

      return () => {
        stopTimer();

        for (const dispose of disposers.splice(0)) {
          try {
            dispose();
          } catch (error) {
            logger.error("mini-lyric: dispose failed", error);
          }
        }
      };
    },
  };
}
