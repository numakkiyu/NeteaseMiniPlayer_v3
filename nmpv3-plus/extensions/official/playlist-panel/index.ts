import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";

/**
 * 歌单面板
 *
 * 演示四件事：
 * 1. 用 panel 插槽挂一个可展开的歌单列表
 * 2. 监听 playlistchange 事件重建列表，点击行切歌
 * 3. 用命令控制展开与关闭
 * 4. 切换歌曲时高亮当前行
 */

export interface NMPv3PlusPlaylistPanelOptions {
  /** 初始是否展开，默认 false */
  open?: boolean;
  /** 最多显示多少首，默认 50，避免几百首时一次渲染太多 DOM */
  limit?: number;
  /** 快捷键，默认 ctrl+shift+o；传空串则不注册 */
  shortcut?: string;
}

interface PanelSong {
  id?: string | number;
  name?: string;
  artists?: string;
}

const STYLE_ID = "nmpv3-plus-playlist-panel-style";
const DEFAULT_LIMIT = 50;

const CSS_TEXT = `
.nmpv3-plus-playlist-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 240ms ease;
  font: inherit;
  font-size: 12px;
  color: var(--nmpv3-text, #222222);
}
.nmpv3-plus-playlist-panel[data-open="true"] {
  max-height: 220px;
  overflow-y: auto;
}
.nmpv3-plus-playlist-panel-list {
  margin: 0;
  padding: 4px 0;
  list-style: none;
}
.nmpv3-plus-playlist-panel-item {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 5px 12px;
  cursor: pointer;
  border: 0;
  width: 100%;
  text-align: left;
  background: transparent;
  color: inherit;
  font: inherit;
}
.nmpv3-plus-playlist-panel-item:hover {
  background: color-mix(in srgb, var(--nmpv3-accent, #ff6b35) 12%, transparent);
}
.nmpv3-plus-playlist-panel-item[data-active="true"] {
  color: var(--nmpv3-accent, #ff6b35);
  font-weight: 600;
}
.nmpv3-plus-playlist-panel-index {
  flex: 0 0 auto;
  min-width: 18px;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
.nmpv3-plus-playlist-panel-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nmpv3-plus-playlist-panel-artist {
  flex: 0 0 auto;
  opacity: 0.6;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

export function createPlaylistPanelPlugin(
  options: NMPv3PlusPlaylistPanelOptions = {},
): NMPv3PlusPlugin {
  const limit = Math.max(1, Number(options.limit) || DEFAULT_LIMIT);
  const shortcutKeys = options.shortcut ?? "ctrl+shift+o";

  return {
    name: "nmpv3-plus-extension-playlist-panel",
    version: "3.0.2",
    setup(ctx) {
      const { slot, command, shortcut, logger } = ctx;
      const disposers: Array<() => void> = [];

      let open = options.open === true;
      let songs: PanelSong[] = [];
      let activeIndex = -1;
      let panel: HTMLElement | null = null;
      let list: HTMLElement | null = null;

      const syncOpen = () => {
        if (panel) {
          panel.dataset.open = open ? "true" : "false";
        }
      };

      const highlight = () => {
        if (!list) {
          return;
        }

        list
          .querySelectorAll<HTMLElement>(".nmpv3-plus-playlist-panel-item")
          .forEach((item) => {
            const index = Number(item.dataset.index);
            item.dataset.active = index === activeIndex ? "true" : "false";
          });
      };

      const playAt = (index: number) => {
        const player = ctx.player;

        if (!player?.loadPlaylistData || songs.length === 0) {
          return;
        }

        if (index < 0 || index >= songs.length) {
          return;
        }

        void player
          .loadPlaylistData(
            { songs: songs as never[] },
            { startIndex: index, autoplay: true },
          )
          .catch((error) => {
            logger.warn("playlist-panel: switch failed", error);
          });
      };

      const render = () => {
        if (!list) {
          return;
        }

        const doc = list.ownerDocument;
        list.textContent = "";

        const visible = songs.slice(0, limit);

        visible.forEach((song, index) => {
          const item = doc.createElement("button");
          item.type = "button";
          item.className = "nmpv3-plus-playlist-panel-item";
          item.dataset.index = String(index);
          item.dataset.active = index === activeIndex ? "true" : "false";

          const number = doc.createElement("span");
          number.className = "nmpv3-plus-playlist-panel-index";
          number.textContent = String(index + 1);

          const name = doc.createElement("span");
          name.className = "nmpv3-plus-playlist-panel-name";
          name.textContent = song.name ?? "未知歌曲";

          const artist = doc.createElement("span");
          artist.className = "nmpv3-plus-playlist-panel-artist";
          artist.textContent = song.artists ?? "";

          item.append(number, name, artist);
          item.addEventListener("click", () => playAt(index));
          list!.append(item);
        });

        syncOpen();
      };

      /* ---------- 插槽 ---------- */
      disposers.push(
        slot.register("panel", ({ container, onCleanup }) => {
          ensureStyle(container.ownerDocument);

          const wrapper = container.ownerDocument.createElement("div");
          wrapper.className = "nmpv3-plus-playlist-panel";
          wrapper.dataset.open = open ? "true" : "false";

          const ul = container.ownerDocument.createElement("ul");
          ul.className = "nmpv3-plus-playlist-panel-list";

          wrapper.append(ul);
          container.append(wrapper);

          panel = wrapper;
          list = ul;
          render();

          onCleanup(() => {
            panel = null;
            list = null;
            songs = [];
          });
        }),
      );

      /* ---------- 歌单与当前曲目 ---------- */
      disposers.push(
        ctx.on("playlistchange", (payload) => {
          const detail = payload as
            { playlist?: { songs?: PanelSong[] } } | undefined;
          songs = Array.isArray(detail?.playlist?.songs)
            ? detail.playlist.songs
            : [];
          activeIndex = 0;
          render();
        }),
      );

      disposers.push(
        ctx.on("songchange", (payload) => {
          const detail = payload as { song?: { id?: unknown } } | undefined;
          const songId = detail?.song?.id;

          if (songId === undefined || songId === null) {
            return;
          }

          const found = songs.findIndex(
            (song) => String(song.id) === String(songId),
          );

          if (found >= 0) {
            activeIndex = found;
            highlight();
          }
        }),
      );

      /* ---------- 命令 ---------- */
      const toggle = () => {
        open = !open;
        syncOpen();
        return open;
      };

      disposers.push(
        command.register({
          id: "playlist-panel.toggle",
          title: "展开或收起歌单面板",
          handler: toggle,
        }),
        command.register({
          id: "playlist-panel.playIndex",
          title: "播放歌单中第 N 首",
          handler: (index) => playAt(Number(index)),
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
        for (const dispose of disposers.splice(0)) {
          try {
            dispose();
          } catch (error) {
            logger.error("playlist-panel: dispose failed", error);
          }
        }
      };
    },
  };
}
