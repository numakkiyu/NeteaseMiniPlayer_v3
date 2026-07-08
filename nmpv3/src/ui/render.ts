import { icons } from "./icons";
import {
  classNames as c,
  cx,
  playModeClassNames,
  stateClassNames as sc,
} from "./classNames";
import type {
  NMPv3Config,
  NMPv3LoadStatus,
  NMPv3LyricLine,
  NMPv3LyricStatus,
  NMPv3PlayMode,
  NMPv3Song,
} from "../types";

export interface NMPv3ViewState {
  song: NMPv3Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  status: NMPv3LoadStatus;
  errorMessage?: string;
  lyric: NMPv3LyricLine | null;
  lyricStatus: NMPv3LyricStatus;
  playMode: NMPv3PlayMode;
  currentIndex: number;
  playlist: NMPv3Song[];
  showLyrics: boolean;
  isPlaylistOpen: boolean;
  isMinimized: boolean;
}

export interface NMPv3RenderedElements {
  root: HTMLElement;
  cover: HTMLImageElement;
  fallbackCover: HTMLElement;
  title: HTMLElement;
  artist: HTMLElement;
  album: HTMLElement;
  order: HTMLElement;
  modeBadge: HTMLElement;
  lyricOriginal: HTMLElement;
  lyricTranslation: HTMLElement;
  playButton: HTMLButtonElement;
  playIcon: HTMLElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  progressTrack: HTMLElement;
  progressBar: HTMLElement;
  currentTime: HTMLElement;
  totalTime: HTMLElement;
  volumeTrack: HTMLElement;
  volumeBar: HTMLElement;
  lyricsButton: HTMLButtonElement;
  modeButton: HTMLButtonElement;
  playlistButton: HTMLButtonElement;
  minimizeButton: HTMLButtonElement;
  playlistPanel: HTMLElement;
  playlistList: HTMLElement;
  status: HTMLElement;
  miniPanel: HTMLElement;
  miniTitle: HTMLElement;
  miniSubtitle: HTMLElement;
  miniMode: HTMLElement;
}

/**
 * 首次渲染播放器 DOM 骨架并返回所有可交互元素的引用
 */
export function renderPlayerShell(
  target: HTMLElement,
  config: NMPv3Config,
): NMPv3RenderedElements {
  target.innerHTML = "";

  const root = element("div", c.player);
  applyRootConfig(root, config);
  root.dataset.status = "idle";
  root.tabIndex = 0;
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "NeteaseMiniPlayer v3");

  const main = element("div", c.main);
  const miniPanel = element("div", c.miniPanel);
  miniPanel.setAttribute("aria-hidden", "true");
  const miniTitle = element("div", c.miniTitle);
  const miniSubtitle = element("div", c.miniSubtitle);
  const miniMode = element("div", c.miniMode);
  const miniActions = element("div", c.miniActions);
  miniActions.setAttribute("aria-hidden", "true");
  miniPanel.append(miniTitle, miniSubtitle, miniMode, miniActions);

  const coverWrap = element("button", c.coverButton) as HTMLButtonElement;
  coverWrap.type = "button";
  coverWrap.setAttribute(
    "aria-label",
    "Open current song on NetEase Cloud Music",
  );

  const cover = document.createElement("img");
  cover.className = c.cover;
  cover.alt = "";
  cover.loading = "lazy";

  const fallbackCover = element("span", c.coverFallback);
  fallbackCover.textContent = "NMP";
  coverWrap.append(cover, fallbackCover, element("span", c.vinylRing));

  const body = element("div", c.body);
  const title = element("div", c.title);
  const artist = element("div", c.artist);
  const meta = element("div", c.meta);
  const album = element("span", c.album);
  const order = element("span", c.order);
  const modeBadge = element("span", c.modeBadge);
  meta.append(album, order, modeBadge);
  const lyrics = element("div", c.lyrics);
  const lyricOriginal = element("div", c.lyricOriginal);
  const lyricTranslation = element("div", c.lyricTranslation);
  lyrics.append(lyricOriginal, lyricTranslation);
  body.append(title, artist, meta, lyrics);

  const controls = element("div", c.controls);
  const previousButton = iconButton(
    c.previousButton,
    "Previous song",
    icons.previous,
  );
  const playButton = iconButton(c.playButton, "Play", icons.play);
  const playIcon = playButton.querySelector("span") as HTMLElement;
  const nextButton = iconButton(c.nextButton, "Next song", icons.next);
  controls.append(previousButton, playButton, nextButton);
  main.append(coverWrap, miniPanel, body, controls);

  const bottom = element("div", c.bottom);
  const progress = element("div", c.progress);
  const currentTime = element("span", cx(c.time, c.currentTime));
  const progressTrack = element("button", c.progressTrack) as HTMLButtonElement;
  progressTrack.type = "button";
  progressTrack.setAttribute("aria-label", "Seek");
  const progressBar = element("span", c.progressBar);
  progressTrack.append(progressBar);
  const totalTime = element("span", cx(c.time, c.totalTime));
  progress.append(currentTime, progressTrack, totalTime);

  const tools = element("div", c.tools);
  const volume = element("div", c.volume);
  volume.innerHTML = icons.volume;
  const volumeTrack = element("button", c.volumeTrack) as HTMLButtonElement;
  volumeTrack.type = "button";
  volumeTrack.setAttribute("aria-label", "Set volume");
  const volumeBar = element("span", c.volumeBar);
  volumeTrack.append(volumeBar);
  volume.append(volumeTrack);

  const lyricsButton = iconButton(
    c.lyricsToggle,
    "Show or hide lyrics",
    icons.lyrics,
  );
  const modeButton = iconButton(c.modeButton, "List loop", icons.loop);
  const playlistButton = iconButton(
    c.playlistToggle,
    "Show playlist",
    icons.list,
  );
  const minimizeButton = iconButton(
    c.minimizeButton,
    "Minimize",
    icons.minimize,
  );
  tools.append(
    volume,
    lyricsButton,
    modeButton,
    playlistButton,
    minimizeButton,
  );
  bottom.append(progress, tools);

  const playlistPanel = element("div", c.playlistPanel);
  const playlistList = element("div", c.playlistList);
  playlistPanel.append(playlistList);

  const status = element("div", c.status);
  root.append(main, bottom, playlistPanel, status);
  target.append(root);

  return {
    root,
    cover,
    fallbackCover,
    title,
    artist,
    album,
    order,
    modeBadge,
    lyricOriginal,
    lyricTranslation,
    playButton,
    playIcon,
    previousButton,
    nextButton,
    progressTrack,
    progressBar,
    currentTime,
    totalTime,
    volumeTrack,
    volumeBar,
    lyricsButton,
    modeButton,
    playlistButton,
    minimizeButton,
    playlistPanel,
    playlistList,
    status,
    miniPanel,
    miniTitle,
    miniSubtitle,
    miniMode,
  };
}

/**
 * 增量更新 UI：仅修改已变化的文本、样式和属性
 * 不重新创建 DOM，避免丢失事件绑定
 */
export function updatePlayerView(
  elements: NMPv3RenderedElements,
  config: NMPv3Config,
  state: NMPv3ViewState,
): void {
  applyRootConfig(elements.root, config);
  elements.root.dataset.status = state.status;
  elements.root.classList.toggle(sc.isPlaying, state.isPlaying);
  elements.root.classList.toggle(sc.isMinimized, state.isMinimized);
  elements.root.classList.toggle(sc.playlistOpen, state.isPlaylistOpen);
  elements.root.classList.toggle(sc.isArticle, config.embedMode === "article");

  const song = state.song;
  const isSingleSong = state.playlist.length <= 1;
  elements.title.textContent =
    state.errorMessage || song?.name || "NeteaseMiniPlayer";
  elements.artist.textContent =
    state.status === "loading"
      ? "Loading NetEase Cloud Music"
      : song?.artists || "Ready";
  elements.album.textContent = song?.album ? `Album: ${song.album}` : "";
  elements.album.hidden = !song?.album;
  elements.order.textContent =
    state.playlist.length > 0
      ? `${state.currentIndex + 1}/${state.playlist.length}`
      : "0/0";
  elements.order.hidden = isSingleSong;
  elements.modeBadge.textContent = playModeTitle(state.playMode);
  elements.modeBadge.className = cx(
    c.modeBadge,
    playModeClassNames[state.playMode],
  );
  elements.modeBadge.hidden = isSingleSong;
  elements.cover.hidden = !song?.picUrl;
  elements.fallbackCover.hidden = Boolean(song?.picUrl);
  if (song?.picUrl && elements.cover.src !== song.picUrl) {
    elements.cover.src = song.picUrl;
  }

  const lyric = state.lyric;
  elements.lyricOriginal.textContent = state.showLyrics
    ? lyric?.text || lyricFallback(state.status, state.lyricStatus)
    : "";
  elements.lyricTranslation.textContent =
    state.showLyrics && lyric?.translation ? lyric.translation : "";
  elements.lyricTranslation.hidden = !state.showLyrics || !lyric?.translation;
  elements.lyricsButton.classList.toggle(sc.active, state.showLyrics);

  elements.playIcon.innerHTML = state.isPlaying ? icons.pause : icons.play;
  elements.playButton.setAttribute(
    "aria-label",
    state.isPlaying ? "Pause" : "Play",
  );
  elements.progressBar.style.width = `${progressPercent(state.currentTime, state.duration)}%`;
  elements.currentTime.textContent = formatTime(state.currentTime);
  elements.totalTime.textContent = formatTime(state.duration);
  elements.volumeBar.style.width = `${Math.round(state.volume * 100)}%`;
  elements.modeButton.innerHTML = `<span>${playModeIcon(state.playMode)}</span>`;
  elements.modeButton.title = playModeTitle(state.playMode);
  elements.modeButton.setAttribute("aria-label", playModeTitle(state.playMode));
  elements.modeButton.hidden = isSingleSong;
  elements.playlistButton.classList.toggle(sc.active, state.isPlaylistOpen);
  elements.playlistButton.hidden =
    !config.showPlaylist ||
    config.embedMode === "article" ||
    state.playlist.length <= 1;
  elements.previousButton.hidden =
    config.embedMode === "article" || isSingleSong;
  elements.nextButton.hidden = config.embedMode === "article" || isSingleSong;
  elements.minimizeButton.hidden =
    config.embedMode === "article" || config.position === "static";
  elements.minimizeButton.innerHTML = `<span>${state.isMinimized ? icons.maximize : icons.minimize}</span>`;
  elements.minimizeButton.setAttribute(
    "aria-label",
    state.isMinimized ? "Expand player" : "Minimize player",
  );
  elements.status.textContent =
    state.status === "error" ? (state.errorMessage ?? "Playback error") : "";
  elements.status.hidden = state.status !== "error";
  elements.miniTitle.textContent = song?.name || "Loading...";
  elements.miniSubtitle.textContent = song?.artists || "Ready";
  elements.miniMode.textContent = playModeTitle(state.playMode);
  elements.miniMode.hidden = isSingleSong;

  renderPlaylist(elements, state);
}

function applyRootConfig(root: HTMLElement, config: NMPv3Config): void {
  root.dataset.theme = config.theme;
  root.dataset.layout = config.layout;
  root.dataset.embedMode = config.embedMode;
  root.dataset.position = config.position;
  root.style.setProperty("--nmpv3-idle-opacity", String(config.idleOpacity));
}

function renderPlaylist(
  elements: NMPv3RenderedElements,
  state: NMPv3ViewState,
): void {
  const isOpen = state.isPlaylistOpen && state.playlist.length > 1;
  const previousPanelState = elements.playlistPanel.dataset.state;
  const previousPlaylistSignature =
    elements.playlistList.dataset.playlistSignature;
  const previousActiveIndex = elements.playlistList.dataset.activeIndex;
  const playlistSignature = state.playlist
    .map((song) =>
      [
        song.id,
        song.name,
        song.artists ?? "",
        song.picUrl ?? "",
        song.duration ?? "",
      ].join("\u001f"),
    )
    .join("\u001e");
  const shouldSyncActiveScroll = shouldSyncPlaylistScroll({
    isOpen,
    previousPanelState,
    previousPlaylistSignature,
    previousActiveIndex,
    playlistSignature,
    currentIndex: state.currentIndex,
  });

  elements.playlistPanel.setAttribute("aria-hidden", String(!isOpen));
  elements.playlistPanel.dataset.state = isOpen ? "open" : "closed";

  if (elements.playlistList.dataset.playlistSignature !== playlistSignature) {
    elements.playlistList.textContent = "";
    elements.playlistList.dataset.playlistSignature = playlistSignature;

    state.playlist.forEach((song, index) => {
      const item = element("button", c.playlistItem) as HTMLButtonElement;
      item.type = "button";
      item.dataset.index = String(index);
      item.style.setProperty(
        "--nmpv3-playlist-item-delay",
        `${Math.min(index, 10) * 12}ms`,
      );

      const number = element("span", c.playlistIndex);
      number.textContent = String(index + 1).padStart(2, "0");
      const cover = document.createElement("img");
      cover.className = c.playlistCover;
      cover.alt = "";
      cover.loading = "lazy";
      cover.draggable = false;
      if (song.picUrl) {
        cover.src = song.picUrl;
      } else {
        cover.classList.add(c.noCover);
      }
      const info = element("span", c.playlistInfo);
      const name = element("span", c.playlistName);
      name.textContent = song.name;
      const artist = element("span", c.playlistArtist);
      artist.textContent = song.artists || "Unknown artist";
      const duration = element("span", c.playlistDuration);
      duration.textContent = formatTime(
        song.duration ? song.duration / 1000 : 0,
      );
      info.append(name, artist);
      item.append(number, cover, info, duration);
      elements.playlistList.append(item);
    });
  }

  elements.playlistList
    .querySelectorAll<HTMLButtonElement>(`.${c.playlistItem}`)
    .forEach((item) => {
      const isActive = Number(item.dataset.index) === state.currentIndex;
      item.classList.toggle(sc.active, isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
      item.tabIndex = isOpen ? 0 : -1;
    });
  elements.playlistList.dataset.activeIndex = String(state.currentIndex);

  const active = elements.playlistList.querySelector<HTMLElement>(
    `.${sc.active}`,
  );
  if (active && shouldSyncActiveScroll) {
    const list = elements.playlistList;
    const activeTop = active.offsetTop;
    const activeBottom = activeTop + active.offsetHeight;

    if (activeTop < list.scrollTop) {
      list.scrollTop = activeTop;
    } else if (activeBottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = activeBottom - list.clientHeight;
    }
  }
}

export function shouldSyncPlaylistScroll({
  isOpen,
  previousPanelState,
  previousPlaylistSignature,
  previousActiveIndex,
  playlistSignature,
  currentIndex,
}: {
  isOpen: boolean;
  previousPanelState?: string;
  previousPlaylistSignature?: string;
  previousActiveIndex?: string;
  playlistSignature: string;
  currentIndex: number;
}): boolean {
  if (!isOpen) {
    return false;
  }

  return (
    previousPanelState !== "open" ||
    previousPlaylistSignature !== playlistSignature ||
    previousActiveIndex !== String(currentIndex)
  );
}

function iconButton(
  className: string,
  label: string,
  icon: string,
): HTMLButtonElement {
  const button = element(
    "button",
    cx(c.iconButton, className),
  ) as HTMLButtonElement;
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<span>${icon}</span>`;
  return button;
}

function element(tagName: string, className: string): HTMLElement {
  const node = document.createElement(tagName);
  node.className = className;
  return node;
}

function progressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (currentTime / duration) * 100));
}

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function lyricFallback(
  status: NMPv3LoadStatus,
  lyricStatus: NMPv3LyricStatus,
): string {
  if (status === "loading" || lyricStatus === "loading") {
    return "Loading lyrics";
  }

  if (lyricStatus === "instrumental") {
    return "Pure music";
  }

  if (lyricStatus === "empty") {
    return "No lyrics available";
  }

  if (lyricStatus === "error") {
    return "Lyrics unavailable";
  }

  return "Waiting for lyrics";
}

function playModeIcon(mode: NMPv3PlayMode): string {
  if (mode === "single") {
    return icons.single;
  }

  if (mode === "shuffle") {
    return icons.shuffle;
  }

  return icons.loop;
}

function playModeTitle(mode: NMPv3PlayMode): string {
  if (mode === "single") {
    return "Single loop";
  }

  if (mode === "shuffle") {
    return "Shuffle";
  }

  return "List loop";
}
